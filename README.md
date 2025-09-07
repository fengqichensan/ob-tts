# Obsidian TTS (ob-tts)

ob-tts 是一个为 [Obsidian](https://obsidian.md) 设计的文字转语音（Text-to-Speech, TTS）插件。它使用 Google Gemini API 将您选中的文本转换为语音，并将音频文件保存在您的笔记库中。

## 功能特性
- **文本转语音**: 通过右键菜单将选中的文本转换为语音。
- **集成 Google Gemini**: 利用强大的 Google Gemini API (`gemini-2.5-flash-preview-tts` 模型) 生成高质量音频。
- **自动保存与链接**: 生成的 `.wav` 音频文件会自动保存到您的 Obsidian 笔记库中，并以链接形式插入到当前笔记。
- **即时播放**: 语音生成后会自动播放，方便您即时收听。
- **高度可配置**:
    - 设置您的 Google Gemini API 密钥。
    - 自定义用于语音合成的语音名称。
    - 指定音频文件的保存文件夹。

## 安装方法

### 手动安装
1. 从本插件的最新 release 下载 `main.js`, `manifest.json`, `styles.css` 文件。
2. 在您的 Obsidian 笔记库的 `.obsidian/plugins/` 目录下创建一个新的文件夹，例如 `ob-tts`。
3. 将下载的文件复制到新建的 `ob-tts` 文件夹中。
4. 在 Obsidian 的“设置” -> “社区插件”中，刷新插件列表并启用 `ob-tts` 插件。

## 使用方法

1. **配置 API 密钥**:
   - 打开 Obsidian 的“设置”面板。
   - 在左侧导航栏中找到并点击 “ob-tts”。
   - 在 “API Key” 字段中输入您的 Google Gemini API 密钥。您可以从 [Google AI Studio](https://aistudio.google.com/app/apikey) 获取密钥。
   - （可选）配置“语音名称”和“保存文件夹”。

2. **转换文本为语音**:
   - 在任意笔记中，用鼠标选中您想要转换的文本。
   - 在选中的文本上右键单击，打开上下文菜单。
   - 点击 “TTS” 选项。
   - 插件将开始生成语音（您会看到提示信息），完成后会自动播放，并将音频文件的链接插入到原文后面。

## 开发

如果您想为本项目贡献代码或进行二次开发，可以按照以下步骤设置开发环境：

1. 克隆本仓库到您的 Obsidian 插件目录 `.obsidian/plugins/` 下。
2. 在仓库根目录运行 `npm install` 来安装依赖。
3. 运行 `npm run dev` 以启动开发模式。此命令会自动编译修改后的代码。
4. （推荐）安装 [Hot-Reload](https://github.com/pjeby/hot-reload) 插件，它可以在开发过程中自动重新加载插件，提升开发效率。

## 未来计划

- 实现并支持“语音风格指令 (Style Instructions)”功能，让用户可以更精细地控制生成语音的风格。

## 许可证

本项目基于 MIT License 开源，欢迎自由使用与二次开发。