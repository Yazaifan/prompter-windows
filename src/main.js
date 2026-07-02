const { app, BrowserWindow, ipcMain, screen, dialog, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');

const CONFIG_PATH = path.join(app.getPath('userData'), 'config.json');

let mainWindow, prompterWindow;
let isPlaying = false;
let currentSpeed = 3;
let displays = [];
let selectedDisplayId = null;

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    }
  } catch (e) {
    console.error('读取配置失败', e);
  }
  return {
    fontSize: 72,
    lineHeight: 1.6,
    textColor: '#ffffff',
    bgColor: '#000000',
    mirror: false,
    speed: 3,
    script: '',
    displayId: null,
  };
}

function saveConfig(cfg) {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
  } catch (e) {
    console.error('保存配置失败', e);
  }
}

function updateDisplays() {
  displays = screen.getAllDisplays();
  const primary = screen.getPrimaryDisplay();
  const external = displays.find(d => d.id !== primary.id) || primary;
  return { displays, external, primary };
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 960,
    height: 720,
    minWidth: 700,
    minHeight: 500,
    title: 'Prompter Pro 主控台',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createPrompterWindow() {
  const { external } = updateDisplays();
  const target = displays.find(d => d.id === selectedDisplayId) || external || screen.getPrimaryDisplay();

  prompterWindow = new BrowserWindow({
    x: target.bounds.x,
    y: target.bounds.y,
    width: target.bounds.width,
    height: target.bounds.height,
    fullscreen: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: false,
    resizable: false,
    movable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  prompterWindow.loadFile(path.join(__dirname, 'prompter.html'));
  prompterWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  prompterWindow.setIgnoreMouseEvents(true);

  prompterWindow.on('closed', () => {
    prompterWindow = null;
  });

  prompterWindow.on('ready-to-show', () => {
    const cfg = loadConfig();
    sendToPrompter('config', cfg);
    sendToPrompter('script', cfg.script || '');
  });
}

function sendToPrompter(channel, data) {
  if (prompterWindow && !prompterWindow.isDestroyed()) {
    prompterWindow.webContents.send(channel, data);
  }
}

function sendToMain(channel, data) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, data);
  }
}

function togglePlay() {
  isPlaying = !isPlaying;
  sendToPrompter('play-state', isPlaying);
  sendToMain('play-state', isPlaying);
}

function changeSpeed(delta) {
  currentSpeed = Math.max(0, Math.min(20, currentSpeed + delta));
  sendToPrompter('speed', currentSpeed);
  sendToMain('speed', currentSpeed);
}

function registerShortcuts() {
  globalShortcut.register('Space', () => {
    if (prompterWindow && !prompterWindow.isDestroyed()) togglePlay();
  });
  globalShortcut.register('Up', () => changeSpeed(1));
  globalShortcut.register('Down', () => changeSpeed(-1));
  globalShortcut.register('CommandOrControl+Shift+P', () => {
    if (prompterWindow && !prompterWindow.isDestroyed()) {
      togglePlay();
    } else if (mainWindow) {
      ipcMain.emit('open-prompter');
    }
  });
}

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    createMainWindow();
    registerShortcuts();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });

  app.on('will-quit', () => {
    globalShortcut.unregisterAll();
  });
}

// IPC 通信
ipcMain.on('get-displays', (event) => {
  const { displays, external, primary } = updateDisplays();
  event.reply('displays', { displays, external, primary });
});

ipcMain.on('select-display', (event, id) => {
  selectedDisplayId = id;
  if (prompterWindow && !prompterWindow.isDestroyed()) {
    const target = displays.find(d => d.id === id) || screen.getPrimaryDisplay();
    prompterWindow.setFullScreen(false);
    setTimeout(() => {
      prompterWindow.setBounds(target.bounds);
      prompterWindow.setFullScreen(true);
    }, 100);
  }
});

ipcMain.on('open-prompter', () => {
  if (!prompterWindow || prompterWindow.isDestroyed()) {
    createPrompterWindow();
  } else {
    prompterWindow.focus();
  }
});

ipcMain.on('close-prompter', () => {
  if (prompterWindow && !prompterWindow.isDestroyed()) {
    prompterWindow.close();
    prompterWindow = null;
  }
});

ipcMain.on('update-script', (event, script) => {
  sendToPrompter('script', script);
  const cfg = loadConfig();
  cfg.script = script;
  saveConfig(cfg);
});

ipcMain.on('update-config', (event, config) => {
  currentSpeed = config.speed || 3;
  sendToPrompter('config', config);
  const cfg = loadConfig();
  Object.assign(cfg, config);
  saveConfig(cfg);
});

ipcMain.on('toggle-play', () => togglePlay());
ipcMain.on('set-speed', (event, speed) => {
  currentSpeed = speed;
  sendToPrompter('speed', speed);
});

ipcMain.on('load-file', async (event) => {
  if (!mainWindow) return;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: '文本文稿', extensions: ['txt', 'md', 'docx', 'doc'] },
      { name: '所有文件', extensions: ['*'] },
    ],
  });
  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0];
    try {
      const text = fs.readFileSync(filePath, 'utf8');
      event.reply('file-loaded', { text, filePath });
    } catch (e) {
      event.reply('file-error', e.message);
    }
  }
});

ipcMain.on('save-file', async (event, text) => {
  if (!mainWindow) return;
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: '文稿.txt',
    filters: [{ name: '文本文件', extensions: ['txt'] }],
  });
  if (!result.canceled) {
    try {
      fs.writeFileSync(result.filePath, text, 'utf8');
      event.reply('file-saved', result.filePath);
    } catch (e) {
      event.reply('file-error', e.message);
    }
  }
});

ipcMain.on('drag-file', (event, filePath) => {
  try {
    const text = fs.readFileSync(filePath, 'utf8');
    event.reply('file-loaded', { text, filePath });
  } catch (e) {
    event.reply('file-error', e.message);
  }
});

// 显示器变动时重新定位
screen.on('display-added', () => {
  updateDisplays();
  sendToMain('displays', { displays, external: displays.find(d => d.id !== screen.getPrimaryDisplay().id), primary: screen.getPrimaryDisplay() });
});

screen.on('display-removed', () => {
  updateDisplays();
  sendToMain('displays', { displays, external: displays.find(d => d.id !== screen.getPrimaryDisplay().id), primary: screen.getPrimaryDisplay() });
  if (prompterWindow && !prompterWindow.isDestroyed()) {
    const primary = screen.getPrimaryDisplay();
    prompterWindow.setFullScreen(false);
    setTimeout(() => {
      prompterWindow.setBounds(primary.bounds);
      prompterWindow.setFullScreen(true);
    }, 100);
  }
});
