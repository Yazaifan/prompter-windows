# Prompter Pro

Windows 外接显示器提词器。

## 功能

- 自动识别外接显示器，一键把提词窗口投到副屏
- 字号、行高、文字颜色、背景颜色可调
- 水平镜像翻转（配合反光玻璃使用）
- 滚动速度可调，支持空格播放/暂停、方向键调速
- 导入/导出 `.txt` 文稿，支持拖拽文件
- 配置和文稿自动保存

## Windows 打包安装程序

### 方法一：本地打包（推荐会命令行的用户）

1. 在 Windows 电脑上安装 Node.js（建议 LTS 版本）
2. 把整个项目文件夹复制到 Windows 电脑
3. 打开 PowerShell，进入项目目录：

```powershell
cd C:\Users\你的用户名\Documents\prompter-windows
```

4. 安装依赖：

```powershell
npm install
```

5. 打包成安装程序：

```powershell
npm run make
```

打包完成后，安装程序在：

```
out\make\squirrel.windows\x64\PrompterPro-Setup.exe
```

把这个 `.exe` 发给用户双击安装即可。

### 方法二：GitHub Actions 自动打包（不用本地装环境）

1. 把项目上传到 GitHub 仓库
2. 进入仓库的 **Actions** 页面
3. 找到 **Build Windows Installer** 工作流，点击 **Run workflow** 手动触发
4. 等待几分钟后，进入最新一次运行记录
5. 在页面底部 **Artifacts** 区域下载 `PrompterPro-Windows-Installer`
6. 解压下载的 zip，里面就是 `PrompterPro-Setup.exe`

触发过一次后，以后每次 push 代码到 main 分支，GitHub 都会自动重新打包。

## 开发运行

```powershell
npm install
npm start
```

## 替换软件图标

1. 准备一张 `icon.ico`（Windows 安装包图标）
2. 放到 `assets\icon.ico`
3. 在 `forge.config.js` 里 `maker-squirrel` 的 `config` 中加一行：

```js
setupIcon: 'assets/icon.ico',
```

## 使用提示

- 第一次打开后，在主控台点击「开启提词器」
- 如果副屏没识别到，重新插拔 HDMI/Type-C 线，再点一下「开启提词器」
- 播放/暂停快捷键在主控台和全局都可用：空格、Ctrl+Shift+P

## 技术栈

Electron + Electron Forge + Squirrel.Windows
