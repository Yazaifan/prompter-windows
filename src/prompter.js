const content = document.getElementById('content');
const pausedIndicator = document.getElementById('pausedIndicator');

let isPlaying = false;
let speed = 3;
let position = 0;
let lastTime = 0;
let rafId = null;

function applyConfig(cfg) {
  content.style.fontSize = `${cfg.fontSize || 72}px`;
  content.style.lineHeight = cfg.lineHeight || 1.6;
  content.style.color = cfg.textColor || '#ffffff';
  document.body.style.backgroundColor = cfg.bgColor || '#000000';
  content.style.transform = cfg.mirror ? 'scaleX(-1)' : 'none';
  speed = cfg.speed || 3;
}

function updateScript(text) {
  content.textContent = text || '';
  position = 0;
  window.scrollTo(0, 0);
}

function loop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const delta = timestamp - lastTime;
  lastTime = timestamp;

  if (isPlaying && speed > 0) {
    position += (speed * delta) / 16;
    window.scrollTo(0, position);
  }

  rafId = requestAnimationFrame(loop);
}

function setPlayState(state) {
  isPlaying = state;
  pausedIndicator.classList.toggle('show', !isPlaying);
}

function setSpeed(value) {
  speed = value;
}

window.prompterAPI.onConfig(applyConfig);
window.prompterAPI.onScript(updateScript);
window.prompterAPI.onPlayStatePrompter(setPlayState);
window.prompterAPI.onSpeedPrompter(setSpeed);

rafId = requestAnimationFrame(loop);

// 兜底：键盘控制
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    window.prompterAPI.togglePlay();
  }
});
