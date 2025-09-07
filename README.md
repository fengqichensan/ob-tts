
# ob-tts

ob-tts 是一个为 Obsidian 设计的文字转语音（Text-to-Speech, TTS）插件。

## 功能特性
- 可通过右键菜单触发朗读

## 安装方法

### 社区插件安装（未实现）
1. 在 Obsidian 中打开“设置” -> “社区插件” -> “浏览”。
2. 搜索 `ob-tts`，点击安装并启用插件。

### 手动安装
1. 下载本插件的最新 release 或克隆本仓库到本地。
2. 将插件文件夹放入您的 Obsidian 仓库的 `.obsidian/plugins/` 目录下。
3. 在 Obsidian 的“设置” -> “社区插件”中启用 `ob-tts` 插件。

## 使用方法

1. 右键点击任意选中笔记内容，选择“朗读”。

## 开发环境构筑
参照下面的官方文档
https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin

以下命令可在终端中持续运行，当您修改源代码时会自动重建插件，适合开发调试阶段：
```
npm run dev
```

开发时建议安装 [Hot-Reload](https://github.com/pjeby/hot-reload) 插件，它可以在开发过程中自动重新加载插件，避免手动刷新。

如需手动编译生成最终插件包，可运行：
```
npm run build
```

## 未来计划

无

## 许可证

本项目基于 MIT License 开源，欢迎自由使用与二次开发。
