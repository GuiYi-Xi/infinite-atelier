<p align="center">
  <img src="web/public/brand-logo.png" width="112" alt="Infinite Atelier logo">
</p>

<h1 align="center">Infinite Atelier</h1>

<p align="center">为桌面创作而生的 AI 视觉工作台</p>

Infinite Atelier 将画布编排、图片生成、参考图、提示词、资产管理和导演预演放在一个连贯的桌面工作流中。项目由 `GuiYi-Xi` 独立维护，界面、品牌与内置提示词库围绕高效视觉创作重新设计。

## 产品概览

- **用户问题**：创作者需要在模型配置、提示词、参考图、生成结果和本地素材之间频繁切换，长任务状态与失败恢复也缺少统一入口。
- **产品方案**：以无限画布为主工作区，将 Provider 配置、生成节点、提示词库、本地资产和导演预演组织成连续流程。
- **我的工作**：负责场景梳理、功能规划、交互与视觉设计、前端实现、模型接口封装、Windows 启动流程、测试和使用文档。
- **验证方式**：仓库提供完整源码、产品截图、演示视频和可复现的本地启动步骤；所有配置与生成历史默认保存在本机。

这个项目展示的是模型能力从 API 到用户产品的封装实践，不涉及 GPU 集群或企业级模型托管部署。

## 功能

- 无限创作画布：组织图片、文字、音频、视频和生成结果。
- 多渠道模型：配置 OpenAI 兼容接口及自定义中转 API。
- 图片生成：支持 GPT Image 2 等模型的文生图、图生图与多图参考。
- 提示词库：内置 12 组带展示图的提示词，可复制、收藏、替换封面或新增条目。
- 视觉资产：保存生成结果与素材，支持导入、导出和本地备份。
- 导演台：内置 MONOFORM 预演工具，用于镜头、角色和动作设计。
- 品牌主页：五套整体配色、动态品牌背景与最近项目入口。

## 演示与导演台

- [观看 Infinite Atelier 项目演示视频（MP4，约 63 MB）](https://github.com/GuiYi-Xi/infinite-atelier/releases/download/v1.0.0/Infinite-Atelier-Demo.mp4)
- [MONOFORM 素形白模预演工作台源码](https://github.com/GuiYi-Xi/monoform-previs-studio)
- [导演台使用教程（哔哩哔哩）](https://www.bilibili.com/video/BV1HNud6SEgs/)

## Windows 启动

双击仓库根目录的 `start.bat`。电脑需要先安装 Node.js LTS（Node.js 20.19+ 或 22.12+）。启动器会刷新系统 PATH，并识别官方安装、NVM、Volta、Scoop、fnm、注册表和常见安装目录：

[下载 Node.js LTS](https://nodejs.org/en/download)

启动脚本会自动安装依赖，并从 `3000` 开始选择可用端口启动：

```text
http://localhost:3000
```

也可以手动运行：

```powershell
cd web
npm install --legacy-peer-deps --include=optional
npm run dev
```

`start.bat` 会校验 Vite 及其 Windows 原生模块；依赖不完整时会自动补装。

如果安装 Node.js 后仍提示找不到，请先重启 Windows（或注销后重新登录），然后再次运行 `start.bat`。启动器不会自动重复打开 Node.js 下载页面。

首次启动会在 `web/node_modules` 安装前端依赖，因此本地目录会增加数万个文件和约数百 MB 占用。该目录已被 Git 忽略，不会上传到仓库。

## 生产构建

```powershell
cd web
npm run typecheck
npm run build:monoform
npm run build
```

构建结果位于 `web/dist`。

## 使用说明

1. 打开右上角配置，添加 API 地址和 API Key。
2. 为渠道拉取或手动添加模型，并设置图片、视频、文本或音频能力。
3. 新建画布，将提示词、参考图和生成节点组织到同一工作区。
4. 主页提示词库的内置封面位于 `web/public/prompt-covers`，卡片右上角可以随时替换。

所有配置、画布、资产和生成记录默认保存在当前浏览器本地。浏览器数据按网址来源隔离，因此不同磁盘目录只要都使用 `http://localhost:3000`，就会读取同一份本地配置。API Key 不会提交到仓库；分享导出的配置或截图前仍应检查敏感信息。

## 目录

```text
Infinite Atelier
├─ start.bat                 Windows 启动器
├─ web/src                   主应用源码
├─ web/public                品牌与提示词图片资源
├─ web/monoform-studio       内嵌导演预演工具
└─ LICENSE                   开源许可证
```

## 维护者

[GuiYi-Xi](https://github.com/GuiYi-Xi)

## License

代码许可见 [LICENSE](LICENSE)。
