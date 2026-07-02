const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('prompterAPI', {
  // 主控台 -> 主进程
  getDisplays: () => ipcRenderer.send('get-displays'),
  selectDisplay: (id) => ipcRenderer.send('select-display', id),
  openPrompter: () => ipcRenderer.send('open-prompter'),
  closePrompter: () => ipcRenderer.send('close-prompter'),
  updateScript: (text) => ipcRenderer.send('update-script', text),
  updateConfig: (config) => ipcRenderer.send('update-config', config),
  togglePlay: () => ipcRenderer.send('toggle-play'),
  setSpeed: (speed) => ipcRenderer.send('set-speed', speed),
  loadFile: () => ipcRenderer.send('load-file'),
  saveFile: (text) => ipcRenderer.send('save-file', text),
  dragFile: (filePath) => ipcRenderer.send('drag-file', filePath),

  // 主进程 -> 渲染进程
  onDisplays: (cb) => ipcRenderer.on('displays', (_, data) => cb(data)),
  onFileLoaded: (cb) => ipcRenderer.on('file-loaded', (_, data) => cb(data)),
  onFileError: (cb) => ipcRenderer.on('file-error', (_, msg) => cb(msg)),
  onFileSaved: (cb) => ipcRenderer.on('file-saved', (_, path) => cb(path)),
  onPlayState: (cb) => ipcRenderer.on('play-state', (_, state) => cb(state)),
  onSpeed: (cb) => ipcRenderer.on('speed', (_, speed) => cb(speed)),

  // 提词窗口
  onScript: (cb) => ipcRenderer.on('script', (_, text) => cb(text)),
  onConfig: (cb) => ipcRenderer.on('config', (_, cfg) => cb(cfg)),
  onPlayStatePrompter: (cb) => ipcRenderer.on('play-state', (_, state) => cb(state)),
  onSpeedPrompter: (cb) => ipcRenderer.on('speed', (_, speed) => cb(speed)),
});
