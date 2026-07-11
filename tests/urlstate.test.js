import { describe, it, expect } from 'vitest';
import { decodeState, defaultShareState, encodeState } from '../src/core/url-state.js';

const lineIds = ['midosuji', 'tanimachi', 'jr_osaka_loop', 'hankyu_kobe', 'nankai_main'];

function makeState(overrides = {}) {
  return { ...defaultShareState(lineIds), ...overrides };
}

function expectShareState(actual, expected) {
  expect([...actual.visibleLines].sort()).toEqual([...expected.visibleLines].sort());
  expect([...actual.visibleStructures].sort()).toEqual([...expected.visibleStructures].sort());
  expect(actual.simTime).toBe(expected.simTime);
  expect(actual.speed).toBe(expected.speed);
  expect(actual.running).toBe(expected.running);
  expect(actual.showRidership).toBe(expected.showRidership);
  expect(actual.showDecorations).toBe(expected.showDecorations);
}

describe('URL共有 state encode/decode', () => {
  const cases = [
    ['既定', makeState()],
    ['solo(1路線ON)', makeState({ visibleLines: new Set(['midosuji']) })],
    ['構造フィルタ(地下のみ)', makeState({ visibleStructures: new Set(['地下']) })],
    ['一時停止', makeState({ running: false })],
    ['人員バーON', makeState({ showRidership: true })],
    ['装飾OFF', makeState({ showDecorations: false })],
    ['時刻端00:00', makeState({ simTime: 0 })],
    ['深夜帯25:00', makeState({ simTime: 25 * 3600, speed: 300 })],
  ];

  it.each(cases)('%sを往復できる', (_, source) => {
    const encoded = encodeState(source, lineIds);
    const decoded = decodeState(encoded, lineIds);
    expectShareState(decoded, source);
  });

  it('ハッシュ記号つきでも復元できる', () => {
    const source = makeState({
      visibleLines: new Set(['hankyu_kobe', 'nankai_main']),
      running: false,
      showRidership: true,
      showDecorations: false,
      speed: 10,
      simTime: 23 * 3600,
    });
    expectShareState(decodeState(`#${encodeState(source, lineIds)}`, lineIds), source);
  });

  it('不正入力は例外を投げず既定値へ戻す', () => {
    const defaults = defaultShareState(lineIds);
    for (const bad of [
      '',
      '#v0.x0:.7.2.5.mio',
      '#v1.i1:not_real.7.2.5.mio',
      '#v1.i99:midosuji.7.2.5.mio',
      '#broken',
    ]) {
      expect(() => decodeState(bad, lineIds)).not.toThrow();
      expectShareState(decodeState(bad, lineIds), defaults);
    }
  });
});
