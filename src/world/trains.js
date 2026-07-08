import * as THREE from 'three';
import { buildSchedule, positionAt } from '../sim/schedule.js';
import { state } from '../core/state.js';
import { CONFIG } from '../config.js';

// 曲線上の各駅の弧長(起点からの距離m)。
// 駅iは曲線パラメータ t=i/(n-1) 上にあるが、tは距離と比例しないため getLengths で実距離に変換する
function stationArcDistances(curve, nStations) {
  const perSeg = 40;
  const div = (nStations - 1) * perSeg;
  const lengths = curve.getLengths(div); // 長さdiv+1、k番目 = t=k/div 地点の弧長
  return Array.from({ length: nStations }, (_, i) => lengths[i * perSeg]);
}

export function createTrains(scene, data, lineObjects) {
  const per = [];
  let capacity = 0;
  for (const { line, curve } of lineObjects.values()) {
    const dists = stationArcDistances(curve, line.stations.length);
    const sched = buildSchedule(dists, line);
    const minH = Math.min(...line.headways.map((h) => h.min)) * 60;
    capacity += 2 * (Math.ceil(sched.T / minH) + 2); // 両方向の最大同時本数+余裕
    const color = new THREE.Color(line.color);
    per.push({
      line,
      curve,
      sched,
      len: dists[dists.length - 1],
      color,
      stoppedColor: color.clone().lerp(new THREE.Color(0xffffff), 0.48),
    });
  }

  const inst = new THREE.InstancedMesh(
    new THREE.BoxGeometry(170, 44, 38), // 列車=路線色の箱(全長は誇張込みの見た目値)
    new THREE.MeshBasicMaterial({ color: 0xffffff }),
    capacity
  );
  inst.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(inst);

  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), one = new THREE.Vector3(1, 1, 1);
  const X = new THREE.Vector3(1, 0, 0), pt = new THREE.Vector3(), tang = new THREE.Vector3();

  // シミュ時刻simTの全列車を計算し直す(ステートレス)
  function update(simT) {
    let idx = 0;
    let stopped = 0;
    for (const p of per) {
      if (!state.visibleLines.has(p.line.id)) continue; // レイヤOFFの路線は列車ごと消す
      for (const dir of [1, -1]) {
        for (const d of p.sched.departures) {
          const e = simT - d;
          if (e < 0 || e > p.sched.T) continue; // 未出発 or 到着済み
          const pos = positionAt(p.sched.profile, e);
          if (!pos || idx >= capacity) continue;
          const dist = dir === 1 ? pos.dist : p.len - pos.dist; // 逆方向は距離を反転
          const u = Math.min(Math.max(dist / p.len, 0), 1);
          p.curve.getPointAt(u, pt);            // 距離ベースで曲線上の座標を取得
          pt.y += CONFIG.TRAIN_Y_OFFSET;        // チューブより少し上に置き、列車として判別しやすくする
          p.curve.getTangentAt(u, tang);        // 進行方向(接線)
          if (dir === -1) tang.negate();
          q.setFromUnitVectors(X, tang.normalize());
          m.compose(pt, q, one);
          inst.setMatrixAt(idx, m);
          inst.setColorAt(idx, pos.stopped ? p.stoppedColor : p.color);
          if (pos.stopped) stopped++;
          idx++;
        }
      }
    }
    inst.count = idx; // 実在する列車数だけ描画
    inst.instanceMatrix.needsUpdate = true;
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
    return { count: idx, stopped };
  }

  return { update, capacity };
}
