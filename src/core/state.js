// ミニイベントバス(Nuxtのreactiveの手作り最小版)。UI → state → world の単方向
import { STRUCTURES } from '../sim/structure.js';

const listeners = new Map();
export const state = {
  data: null,               // { stations, lines, meta }
  visibleLines: new Set(),  // 表示中の路線ID
  simTime: 8 * 3600,        // シミュ時刻(0時からの秒)
  speed: 60,                // 倍速
  running: true,
  showRidership: false,
  showDecorations: true,
  visibleStructures: new Set(STRUCTURES),
};
export function on(event, fn) {
  if (!listeners.has(event)) listeners.set(event, []);
  listeners.get(event).push(fn);
}
export function emit(event, payload) {
  (listeners.get(event) || []).forEach((fn) => fn(payload));
}
