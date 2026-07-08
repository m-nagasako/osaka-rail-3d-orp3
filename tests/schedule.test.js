import { describe, it, expect } from 'vitest';
import {
  buildDepartures,
  buildProfile,
  buildReverseDistances,
  buildSchedule,
  hmsToSec,
  positionAt,
} from '../src/sim/schedule.js';

// テスト路線: 駅4つ(0m/1000m/2500m/4000m)、36km/h=10m/s、停車30秒
// → 期待プロファイル: 駅0{0,0} 駅1{100,130} 駅2{280,310} 駅3{460,460} 全所要T=460秒
const dists = [0, 1000, 2500, 4000];
const line = {
  avgSpeedKmh: 36, dwellSec: 30,
  service: { start: '05:00', end: '07:00' },
  headways: [
    { from: '05:00', to: '06:00', min: 10 },
    { from: '06:00', to: '07:00', min: 5 },
  ],
};

describe('buildProfile', () => {
  const p = buildProfile(dists, 36, 30);
  it('各駅の到着/出発秒が手計算と一致する', () => {
    expect(p[1].arr).toBeCloseTo(100); expect(p[1].dep).toBeCloseTo(130);
    expect(p[2].arr).toBeCloseTo(280); expect(p[2].dep).toBeCloseTo(310);
    expect(p[3].arr).toBeCloseTo(460); expect(p[3].dep).toBeCloseTo(460); // 終点は停車なし
  });
  it('時刻と距離が単調非減少', () => {
    for (let i = 1; i < p.length; i++) {
      expect(p[i].arr).toBeGreaterThanOrEqual(p[i - 1].dep);
      expect(p[i].dist).toBeGreaterThan(p[i - 1].dist);
    }
  });
});

describe('buildDepartures', () => {
  const d = buildDepartures(line.service, line.headways);
  it('本数がヘッドウェイ表と一致(10分帯6本+5分帯12本=18本)', () => {
    expect(d.length).toBe(18);
    expect(d[0]).toBe(hmsToSec('05:00'));
    expect(d[d.length - 1]).toBe(hmsToSec('06:55'));
  });
  it('サービス終了以降の出発がない', () => {
    expect(d.every((t) => t < hmsToSec('07:00'))).toBe(true);
  });
});

describe('positionAt', () => {
  const p = buildProfile(dists, 36, 30);
  it('運行範囲外はnull(未出発/到着後)', () => {
    expect(positionAt(p, -1)).toBeNull();
    expect(positionAt(p, 461)).toBeNull();
  });
  it('起点・走行中・停車中・終点を正しく判定する', () => {
    expect(positionAt(p, 0)).toEqual({ dist: 0, stopped: true });
    expect(positionAt(p, 50)).toEqual({ dist: 500, stopped: false });   // 駅0→1の中間
    expect(positionAt(p, 115).stopped).toBe(true);                       // 駅1に停車中
    expect(positionAt(p, 115).dist).toBe(1000);
    expect(positionAt(p, 460)).toEqual({ dist: 4000, stopped: true });  // 終点
  });
  it('時間を進めると距離が戻らない(単調性)', () => {
    let prev = -1;
    for (let e = 0; e <= 460; e += 1) {
      const r = positionAt(p, e);
      expect(r.dist).toBeGreaterThanOrEqual(prev);
      prev = r.dist;
    }
  });
});

describe('buildSchedule', () => {
  it('実データ形式のlineオブジェクトから組み立てられる', () => {
    const s = buildSchedule(dists, line);
    expect(s.T).toBeCloseTo(460);
    expect(s.departures.length).toBe(18);
    expect(s.profile.length).toBe(4);
  });
});

describe('reverse direction schedule', () => {
  const asymmetricDists = [0, 100, 250, 400];
  it('逆方向用の駅距離配列を終点起点で組み立てる', () => {
    expect(buildReverseDistances(asymmetricDists)).toEqual([0, 150, 300, 400]);
  });

  it('逆方向の停車位置が元の駅集合に一致する', () => {
    const reverseSchedule = buildSchedule(buildReverseDistances(asymmetricDists), line);
    const physicalStations = new Set(asymmetricDists);
    const len = asymmetricDists[asymmetricDists.length - 1];

    for (let i = 1; i < reverseSchedule.profile.length - 1; i++) {
      const stop = reverseSchedule.profile[i];
      const pos = positionAt(reverseSchedule.profile, (stop.arr + stop.dep) / 2);
      const physicalDist = len - pos.dist;
      const nearest = Math.min(...Array.from(physicalStations, (d) => Math.abs(d - physicalDist)));
      expect(nearest).toBeLessThanOrEqual(1e-6);
    }
  });
});
