import { GoogleGenAI } from '@google/genai';
import { Buffer } from 'buffer';
import mime from 'mime';

import { App, Editor, MarkdownView, Notice, Plugin, PluginSettingTab, Setting, requestUrl } from 'obsidian';

// 定义插件的设置接口，包含API密钥、语音名称和风格指令
interface ObTtsSettings {
	apiKey: string;
	voice: string;
	styleInstructions: string;
	saveFolder: string;
}

// 默认设置值
const DEFAULT_SETTINGS: ObTtsSettings = {
	apiKey: '',
	voice: 'Sadaltager', // 默认语音名称
	styleInstructions: 'Read aloud in a warm and friendly tone: ',
	saveFolder: ''
}

// 定义WAV转换选项接口，包含声道数、采样率和每个样本的位数
interface WavConversionOptions {
	numChannels: number,
	sampleRate: number,
	bitsPerSample: number
}

// 插件主类，继承自Obsidian的Plugin基类
export default class ObTtsPlugin extends Plugin {
	settings: ObTtsSettings;

	// 插件加载时调用
	async onload() {
		// 加载保存的设置
		await this.loadSettings();

		// 注册编辑器右键菜单事件
		this.registerEvent(
			this.app.workspace.on('editor-menu', (menu, editor, view) => {
				const selection = editor.getSelection(); // 获取当前选中的文本
				if (selection) {
					// 如果有选中文本，添加“TTS”菜单项
					menu.addItem((item) => {
						item
							.setTitle('TTS') // 菜单标题
							.setIcon('speaker') // 菜单图标
							.onClick(async () => {
								// 点击菜单项时调用文本转语音函数
								this.textToSpeech(editor, selection);
							});
					});
				}
			})
		);

		// 添加插件设置面板
		this.addSettingTab(new ObTtsSettingTab(this.app, this));
	}

	// 插件卸载时调用（目前无操作）
	onunload() {

	}

	// 加载插件设置，从本地存储读取并合并默认值
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	// 保存插件设置到本地存储
	async saveSettings() {
		await this.saveData(this.settings);
	}

	// 文本转语音核心函数，接收编辑器和文本参数
	async textToSpeech(editor: Editor, text: string) {
	    if (!this.settings.apiKey) {
	        // 如果API密钥未设置，提示用户
	        new Notice('请在插件设置中填写Gemini API密钥。');
	        return;
	    }
		// 检查是否选择了语音
		if (!this.settings.voice) {
			new Notice('请在插件设置中选择语音。');
			return;
		}
	    new Notice('正在生成语音...'); // 提示正在生成语音

	    // 初始化Google Gemini AI客户端，使用用户设置的API密钥
	    const ai = new GoogleGenAI({ apiKey: this.settings.apiKey });
	    const model = 'gemini-2.5-flash-preview-tts'; // 使用的模型名称
	    // 配置参数，包含温度、响应类型为音频以及语音配置
	    const config = {
	        temperature: 1,
	        responseModalities: ['audio'],
	        speechConfig: {
				voiceConfig: { prebuiltVoiceConfig: { voiceName: this.settings.voice } }
	        }
	    };
		// systemInstruction: this.settings.styleInstructions,

	    // 构造请求内容，角色为用户，内容为选中的文本
	    const contents = [{ role: 'user', parts: [{ text }] }];

	    try {
	        // 调用模型生成内容流
	        const response = await ai.models.generateContentStream({ model, config, contents });
	        let buffers: Buffer[] = [];

	        // 异步遍历响应的每个数据块
	        for await (const chunk of response) {
	            // 解析音频数据的base64编码
	            const inlineData = chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData;
	            if (inlineData?.data) {
	                let buffer = Buffer.from(inlineData.data, 'base64');
	                const ext = mime.getExtension(inlineData.mimeType || '');
	                if (!ext || ext === 'l16') {
	                    // 如果不是标准WAV格式，则调用转换函数添加WAV头
	                    buffer = convertToWav(inlineData.data || '', inlineData.mimeType || '');
	                }
	                buffers.push(buffer); // 将音频数据块加入数组
	            }
	        }

	        if (buffers.length === 0) {
	            // 如果没有返回任何音频数据，提示用户
	            new Notice('未生成任何音频。');
	            return;
	        }

	        // 合并所有音频数据块为一个完整的Buffer
	        const finalBuffer = Buffer.concat(buffers);
	        const fileName = `tts-${Date.now()}.wav`; // 生成唯一文件名
	        let fullPath = fileName;
	        if (this.settings.saveFolder && this.settings.saveFolder.trim() !== '') {
	            if (!(await this.app.vault.adapter.exists(this.settings.saveFolder))) {
	                await this.app.vault.createFolder(this.settings.saveFolder);
	            }
	            fullPath = this.settings.saveFolder.replace(/\/+$/, '') + '/' + fileName;
	        }
	        // 将音频文件保存到Obsidian的Vault中
	        await this.app.vault.createBinary(fullPath, finalBuffer);
	        // 播放生成的音频
	        this.playAudio(finalBuffer);

	        // 构造音频文件的Markdown链接，插入到编辑器中
	        const link = `![[${fullPath}]]`;
	        editor.replaceSelection(`${text} ${link}`);

	        new Notice('语音生成完成，已插入链接。'); // 完成提示
	    } catch (error) {
	        // 捕获并打印错误，提示用户检查控制台
	        console.error('Error generating TTS:', error);
	        new Notice('生成语音时出错，请查看控制台。');
	    }
	}

	// 播放音频数据，参数为ArrayBuffer类型
	playAudio(audioData: ArrayBuffer) {
		const blob = new Blob([audioData], { type: 'audio/wav' }); // 创建音频Blob对象
		const url = URL.createObjectURL(blob); // 生成临时URL
		const audio = new Audio(url); // 创建Audio对象
		audio.play(); // 播放音频
	}
}

// 插件设置面板类，继承自PluginSettingTab
class ObTtsSettingTab extends PluginSettingTab {
	plugin: ObTtsPlugin;

	// 构造函数，接收Obsidian应用和插件实例
	constructor(app: App, plugin: ObTtsPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	// 显示设置面板内容
	display(): void {
		const {containerEl} = this;

		containerEl.empty(); // 清空容器

		// 添加API Key设置项
		new Setting(containerEl)
			.setName('API Key')
			.setDesc('您的Google Gemini API密钥')
			.addText(text => text
				.setPlaceholder('Enter your API key')
				.setValue(this.plugin.settings.apiKey)
				.onChange(async (value) => {
					this.plugin.settings.apiKey = value;
					await this.plugin.saveSettings(); // 保存设置
				}));

		// 添加语音名称设置项
		new Setting(containerEl)
			.setName('Voice')
			.setDesc('用于语音合成的语音名称（例如：Sadaltager）')
			.addText(text => text
				.setPlaceholder('Enter the voice')
				.setValue(this.plugin.settings.voice)
				.onChange(async (value) => {
					this.plugin.settings.voice = value;
					await this.plugin.saveSettings(); // 保存设置
				}));

		// 添加风格指令设置项（目前未实现功能）
		new Setting(containerEl)
			.setName('Style Instructions')
			.setDesc('语音风格指令（尚未实现）')
			.addTextArea(text => text
				.setPlaceholder('Enter style instructions')
				.setValue(this.plugin.settings.styleInstructions)
				.onChange(async (value) => {
					this.plugin.settings.styleInstructions = value;
					await this.plugin.saveSettings(); // 保存设置
				}));

		// 添加音频文件保存文件夹设置项
		new Setting(containerEl)
			.setName('Save Folder')
			.setDesc('音频文件保存的文件夹路径')
			.addText(text => text
				.setPlaceholder('Enter folder path')
				.setValue(this.plugin.settings.saveFolder)
				.onChange(async (value) => {
					this.plugin.settings.saveFolder = value;
					await this.plugin.saveSettings(); // 保存设置
				}));
	}
}

// 将非标准音频数据转换为标准WAV格式，添加WAV头
function convertToWav(rawData: string, mimeType: string) {
    const options = parseMimeType(mimeType); // 解析mimeType获取音频参数
    const wavHeader = createWavHeader(rawData.length, options); // 创建WAV头
    const buffer = Buffer.from(rawData, 'base64'); // 将base64数据转换为Buffer
    return Buffer.concat([wavHeader, buffer]); // 合并WAV头和音频数据
}

// 解析mimeType字符串，提取音频参数，如采样率、声道数、位深
function parseMimeType(mimeType: string): WavConversionOptions {
    // 例如mimeType格式: "audio/l16;rate=24000"
    let numChannels = 1;
    let sampleRate = 24000;
    let bitsPerSample = 16;
    if (mimeType) {
        const rateMatch = mimeType.match(/rate=([0-9]+)/);
        if (rateMatch) sampleRate = parseInt(rateMatch[1]);
        if (/stereo/i.test(mimeType)) numChannels = 2;
        if (/l8/i.test(mimeType)) bitsPerSample = 8;
        if (/l16/i.test(mimeType)) bitsPerSample = 16;
    }
    return { numChannels, sampleRate, bitsPerSample };
}

// 创建WAV文件头，参数为数据长度和音频参数
function createWavHeader(dataLength: number, options: WavConversionOptions): Buffer {
    const { numChannels, sampleRate, bitsPerSample } = options;
    const byteRate = sampleRate * numChannels * bitsPerSample / 8;
    const blockAlign = numChannels * bitsPerSample / 8;
    const buffer = Buffer.alloc(44); // WAV头固定为44字节
    buffer.write('RIFF', 0); // ChunkID标识RIFF格式
    buffer.writeUInt32LE(36 + dataLength, 4); // ChunkSize，整个文件大小减去8字节
    buffer.write('WAVE', 8); // 格式标识WAVE
    buffer.write('fmt ', 12); // 子块ID，格式块
    buffer.writeUInt32LE(16, 16); // 子块大小，PCM格式固定16
    buffer.writeUInt16LE(1, 20); // 音频格式，1表示PCM
    buffer.writeUInt16LE(numChannels, 22); // 声道数
    buffer.writeUInt32LE(sampleRate, 24); // 采样率
    buffer.writeUInt32LE(byteRate, 28); // 字节率
    buffer.writeUInt16LE(blockAlign, 32); // 块对齐
    buffer.writeUInt16LE(bitsPerSample, 34); // 位深
    buffer.write('data', 36); // 数据块ID
    buffer.writeUInt32LE(dataLength, 40); // 数据块大小
    return buffer;
}