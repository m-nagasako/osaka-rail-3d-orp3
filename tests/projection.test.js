import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createProjection } from '../src/core/projection.js';

const stations = JSON.parse(readFileSync(new URL('../public/data/stations.json', import.meta.url)));
const proj = createProjection(stations);
const rad = (d) => (d * Math.PI) / 180;
const R = 6371000;
const haversine = (a, b) => {
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat/2)**2 + Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dLng/2)**2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

describe('座標変換(L1)', () => {
  it('緯度0.01度 ≒ 1105.4m(北=−Z)', () => {
    const a = proj.toXZ(34.70, 135.50), b = proj.toXZ(34.71, 135.50);
    expect(a.z - b.z).toBeCloseTo(1105.4, 0); // 北に行くほどZが減る
    expect(a.x).toBeCloseTo(b.x, 6);
  });
  it('梅田〜なんばの投影距離がハバサイン距離と1%以内で一致', () => {
    const u = stations.find((s) => s.name === '梅田'), n = stations.find((s) => s.name === 'なんば');
    const pu = proj.toXZ(u.lat, u.lng), pn = proj.toXZ(n.lat, n.lng);
    const dProj = Math.hypot(pu.x - pn.x, pu.z - pn.z);
    const dReal = haversine(u, n);
    expect(Math.abs(dProj - dReal) / dReal).toBeLessThan(0.01);
  });
  it('原点がデータ中心(投影X/Zの最小・最大が対称)', () => {
    let minX = 1e9, maxX = -1e9, minZ = 1e9, maxZ = -1e9;
    for (const s of stations) {
      const { x, z } = proj.toXZ(s.lat, s.lng);
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
    }
    expect(Math.abs(minX + maxX)).toBeLessThan(1); // 1m以内で対称
    expect(Math.abs(minZ + maxZ)).toBeLessThan(1);
  });
});
