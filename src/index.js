const editor = document.getElementById('scriptEditor');
const displaySelect = document.getElementById('displaySelect');
const fontSizeInput = document.getElementById('fontSize');
const lineHeightInput = document.getElementById('lineHeight');
const speedInput = document.getElementById('speed');
const textColorInput = document.getElementById('textColor');
const bgColorInput = document.getElementById('bgColor');
const mirrorInput = document.getElementById('mirror');
const fontSizeVal = document.getElementById('fontSizeVal');
const lineHeightVal = document.getElementById('lineHeightVal');
const speedVal = document.getElementById('speedVal');
const statusBar = document.getElementById('statusBar');

let isPlaying = false;
let currentConfig = {};

function updateConfig() {
  currentConfig = {
    fontSize: +fontSizeInput.value,
    lineHeight: +lineHeightInput.value,
    textColor: textColorInput.value,
    bgColor: bgColorInput.value,
    mirror: mirrorInput.checked,
    speed: +speedInput.value,
  };
  window.prompterAPI.updateConfig(currentConfig);
  fontSizeVal.textContent = fontSizeInput.value;
  lineHeightVal.textContent = lineHeightInput.value;
  speedVal.textContent = speedInput.value;
}

function setStatus(msg) {
  statusBar.textContent = msg;
  setTimeout(() => {
    statusBar.textContent = '就绪';
  }, 3000);
}

function renderDisplays(data) {
  const { displays, external, primary } = data;
  displaySelect.innerHTML = '';
  displays.forEach((d, idx) => {
    const opt = document.createElement('option');
    opt.value = d.id;
    const isPrimary = d.id === primary.id;
    const isExternal = external && d.id === external.id;
    opt.textContent = `显示器 ${idx + 1} ${d.size.width}×${d.size.height} ${isPrimary ? '(主屏)' : ''} ${isExternal ? '(推荐副屏)' : ''}`;
    displaySelect.appendChild(opt);
  });
  if (external) {
    displaySelect.value = external.id;
  } else if (primary) {
    displaySelect.value = primary.id;
  }
}

// 事件绑定
fontSizeInput.addEventListener('input', updateConfig);
lineHeightInput.addEventListener('input', updateConfig);
speedInput.addEventListener('input', updateConfig);
textColorInput.addEventListener('input', updateConfig);
bgColorInput.addEventListener('input', updateConfig);
mirrorInput.addEventListener('change', updateConfig);

editor.addEventListener('input', () => {
  window.prompterAPI.updateScript(editor.value);
});

displaySelect.addEventListener('change', () => {
  window.prompterAPI.selectDisplay(+displaySelect.value);
});

document.getElementById('btnOpen').addEventListener('click', () => {
  window.prompterAPI.openPrompter();
  setStatus('提词器已开启');
});

document.getElementById('btnClose').addEventListener('click', () => {
  window.prompterAPI.closePrompter();
  setStatus('提词器已关闭');
});

document.getElementById('btnPlay').addEventListener('click', () => {
  window.prompterAPI.togglePlay();
});

document.getElementById('btnPause').addEventListener('click', () => {
  window.prompterAPI.togglePlay();
});

document.getElementById('btnLoad').addEventListener('click', () => {
  window.prompterAPI.loadFile();
});

document.getElementById('btnSave').addEventListener('click', () => {
  window.prompterAPI.saveFile(editor.value);
});

// 快捷键在主控台也生效
document.addEventListener('keydown', (e) => {
  if (e.target === editor) return;
  if (e.code === 'Space') {
    e.preventDefault();
    window.prompterAPI.togglePlay();
  }
  if (e.code === 'ArrowUp') {
    speedInput.value = (+speedInput.value + 0.5).toFixed(1);
    updateConfig();
  }
  if (e.code === 'ArrowDown') {
    speedInput.value = Math.max(0, +speedInput.value - 0.5).toFixed(1);
    updateConfig();
  }
});

// 拖拽文件
editor.addEventListener('dragover', (e) => {
  e.preventDefault();
  editor.classList.add('dragover');
});
editor.addEventListener('dragleave', () => editor.classList.remove('dragover'));
editor.addEventListener('drop', (e) => {
  e.preventDefault();
  editor.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file) {
    window.prompterAPI.dragFile(file.path);
  }
});

// IPC 监听
window.prompterAPI.onDisplays(renderDisplays);

window.prompterAPI.onFileLoaded(({ text, filePath }) => {
  editor.value = text;
  window.prompterAPI.updateScript(text);
  setStatus(`已加载：${filePath}`);
});

window.prompterAPI.onFileError((msg) => {
  setStatus(`错误：${msg}`);
});

window.prompterAPI.onFileSaved((path) => {
  setStatus(`已保存：${path}`);
});

window.prompterAPI.onPlayState((state) => {
  isPlaying = state;
  document.getElementById('btnPlay').classList.toggle('active', state);
  document.getElementById('btnPause').classList.toggle('active', !state);
});

window.prompterAPI.onSpeed((speed) => {
  speedInput.value = speed;
  speedVal.textContent = speed;
});

// 初始化
window.prompterAPI.getDisplays();
