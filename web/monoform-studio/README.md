# MONOFORM Studio（导演台）

本目录是「导演台」功能在画布项目内的**自包含源码副本**，与外部白膜动画项目（`F:\白膜动画`）完全解耦。

## 与画布的关系

- 画布运行时不依赖本目录，只依赖 `web/public/monoform/` 下的构建产物。
- 本目录是那份产物的**唯一源码来源**：改动导演台功能，改这里并重新构建即可。
- 外部白膜动画项目可以独立开发，互不影响；两者通过构建产物单向同步。

## 目录结构

| 路径 | 说明 |
|---|---|
| `src/` | MONOFORM 工作台源码（App.jsx / Viewport.jsx / rig.js 等） |
| `public/models/` | 内置人物白模资源（运行时加载） |
| `public/branding/` | 品牌图标 |
| `scripts/build-daily-animations.mjs` | 每日动画生成脚本（可选工具） |
| `docs/USER_GUIDE.md` | 原项目用户指南 |

## 修改与更新流程

1. 修改本目录 `src/` 下的源码。
2. 构建并同步到画布静态资源：

   ```bash
   cd web
   npm run build:monoform
   ```

   该命令会在 `monoform-studio` 下安装依赖并执行构建，然后把 `dist/` 的入口文件与资源同步到 `web/public/monoform/`。
3. 刷新画布页面验证（导演台页面 `/director` 与画布内导演台节点共用同一份资源）。

## 注意事项

- 每次 `build:monoform` 只替换 `public/monoform/` 下的 `index.html` 与 `assets/`，`models/`、`branding/` 保持原位。
- 保持本目录与 `public/monoform/` 同步后再提交代码，避免页面使用过期资源。
- 不要直接修改 `public/monoform/` 里的产物文件（下次构建会被覆盖）。
