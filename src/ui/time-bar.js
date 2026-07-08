import { state } from '../core/state.js';
import { fmt } from '../sim/clock.js';

const MIN = 5 * 3600, MAX = 25 * 3600;
const SPEEDS = [1, 10, 60, 300];

// 画面下部の時刻バー: 再生/停止・スライダー・倍速プリセット
export function createTimeBar() {
  const el = document.createElement('div');
  el.id = 'timebar';
  el.innerHTML = `
    <button class="play" title="再生/停止">⏸</button>
    <input type="range" min="${MIN}" max="${MAX}" step="30" value="${state.simTime}">
    <span class="clock"></span>
    <span class="trainstat">列車 --本</span>
    <span class="spd">${SPEEDS.map((s) => `<button data-s="${s}">×${s}</button>`).join('')}</span>`;
  document.body.appendChild(el);

  const play = el.querySelector('.play');
  const slider = el.querySelector('input');
  const clock = el.querySelector('.clock');
  const trainstat = el.querySelector('.trainstat');
  let dragging = false;

  play.onclick = () => { state.running = !state.running; play.textContent = state.running ? '⏸' : '▶'; };
  slider.addEventListener('pointerdown', () => (dragging = true));
  slider.addEventListener('pointerup', () => (dragging = false));
  // ステートレス設計の見せ場: スライダーを動かすと全列車が即その時刻の位置に現れる
  slider.addEventListener('input', () => { state.simTime = Number(slider.value); });
  for (const b of el.querySelectorAll('[data-s]')) {
    b.onclick = () => {
      state.speed = Number(b.dataset.s);
      el.querySelectorAll('[data-s]').forEach((x) => x.classList.toggle('on', x === b));
    };
  }
  el.querySelector('[data-s="60"]').classList.add('on');

  // 毎フレームmainから呼ぶ(ドラッグ中はスライダーを奪わない)
  return {
    refresh(trainStats) {
      if (!dragging) slider.value = state.simTime;
      clock.textContent = fmt(state.simTime);
      if (trainStats) trainstat.textContent = `列車 ${trainStats.count}本 / 停車 ${trainStats.stopped}本`;
    },
  };
}
