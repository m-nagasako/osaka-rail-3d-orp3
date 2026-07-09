import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { hmsToSec } from '../src/sim/schedule.js';

// 生成済みデータ(public/data)の整合を回帰テスト化(設計L2)
const load = (f) => JSON.parse(readFileSync(new URL(`../public/data/${f}`, import.meta.url)));
const stations = load('stations.json');
const lines = load('lines.json');
const meta = load('meta.json');
const byId = new Map(stations.map((s) => [s.id, s]));

const R = 6371, rad = (d) => (d * Math.PI) / 180;
const km = (a, b) => {
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat/2)**2 + Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dLng/2)**2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

describe('生成データの整合(L2回帰)', () => {
  it('規模: 10路線・ユニーク114駅・延べ140駅', () => {
    expect(lines.length).toBe(10);
    expect(stations.length).toBe(114);
    expect(lines.reduce((a, l) => a + l.stations.length, 0)).toBe(140);
  });
  it('路線↔駅の相互参照が閉じている', () => {
    for (const ln of lines) for (const sid of ln.stations) {
      const st = byId.get(sid);
      expect(st, `参照切れ ${sid}`).toBeDefined();
      expect(st.lines).toContain(ln.id);
    }
    for (const st of stations) for (const lid of st.lines)
      expect(lines.find((l) => l.id === lid).stations).toContain(st.id);
  });
  it('座標が大阪近辺、隣接駅間が0.25〜4.5km', () => {
    for (const st of stations) {
      expect(st.lat).toBeGreaterThan(34.3); expect(st.lat).toBeLessThan(34.9);
      expect(st.lng).toBeGreaterThan(135.2); expect(st.lng).toBeLessThan(135.7);
    }
    for (const ln of lines) for (let i = 1; i < ln.stations.length; i++) {
      const d = km(byId.get(ln.stations[i-1]), byId.get(ln.stations[i]));
      expect(d, `${ln.name} 駅間${i}`).toBeGreaterThan(0.25);
      expect(d).toBeLessThan(4.5);
    }
  });
  it('elev配列長が駅数と一致し、色がhex形式', () => {
    for (const ln of lines) {
      expect(ln.elev.length).toBe(ln.stations.length);
      expect(ln.color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
  it('ヘッドウェイがサービス時間を隙間なく覆う', () => {
    for (const ln of lines) {
      let cur = hmsToSec(ln.service.start);
      for (const h of ln.headways) {
        expect(hmsToSec(h.from), ln.name).toBe(cur);
        expect(h.min).toBeGreaterThan(0);
        cur = hmsToSec(h.to);
      }
      expect(cur).toBe(hmsToSec(ln.service.end));
    }
  });
  it('乗降人員: 全駅に「正の値」または「集計先の注記」がある', () => {
    for (const st of stations) {
      const r = st.ridership;
      expect(r, st.name).toBeTruthy();
      if (r.value === null) expect(typeof r.note).toBe('string');
      else { expect(r.value).toBeGreaterThan(0); expect(r.year).toContain('2025'); }
    }
  });
  it('meta: 出典3件以上と近似の注意書きを含む', () => {
    expect(meta.sources.length).toBeGreaterThanOrEqual(3);
    expect(meta.notes.some((n) => n.includes('近似'))).toBe(true);
    expect(meta.notes.some((n) => n.includes('夢洲'))).toBe(true);
  });
  it('距離サニティ: 梅田〜なんば直線3.5〜5.0km', () => {
    const d = km(stations.find((s) => s.name === '梅田'), stations.find((s) => s.name === 'なんば'));
    expect(d).toBeGreaterThan(3.5); expect(d).toBeLessThan(5.0);
  });
  it('北大阪急行: 南北線が事業者別に入り、江坂は御堂筋線と共有される', () => {
    const line = lines.find((l) => l.id === 'kita_kyuko');
    expect(line).toBeDefined();
    expect(line.operator).toBe('北大阪急行');
    expect(line.name).toBe('南北線');

    const names = line.stations.map((sid) => byId.get(sid).name);
    expect(names).toEqual(['箕面萱野', '箕面船場阪大前', '千里中央', '桃山台', '緑地公園', '江坂']);
    for (const name of ['箕面萱野', '箕面船場阪大前', '千里中央', '桃山台', '緑地公園']) {
      expect(byId.get(line.stations[names.indexOf(name)]).lat).toBeGreaterThan(byId.get(line.stations[names.indexOf('江坂')]).lat);
    }
    for (let i = 1; i < line.stations.length; i++) {
      expect(byId.get(line.stations[i - 1]).lat).toBeGreaterThan(byId.get(line.stations[i]).lat);
    }

    const esaka = stations.filter((s) => s.name === '江坂');
    expect(esaka).toHaveLength(1);
    expect(esaka[0].lines).toEqual(expect.arrayContaining(['midosuji', 'kita_kyuko']));
  });
});
