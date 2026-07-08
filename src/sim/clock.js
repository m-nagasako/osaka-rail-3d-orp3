import { state } from '../core/state.js';
// シミュ時刻: 05:00〜25:00でループ(深夜は列車ゼロが正しい姿)
const WRAP_START = 5 * 3600, WRAP_END = 25 * 3600;

export function tick(dtSec) {
  if (!state.running) return;
  state.simTime += dtSec * state.speed;
  if (state.simTime > WRAP_END) state.simTime = WRAP_START;
}

export function fmt(sec) {
  const s = Math.floor(sec);
  const h = String(Math.floor(s / 3600)).padStart(2, '0');
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  return `${h}:${m}`;
}
