import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { state } from '../core/state.js';
import { classifyStructure } from '../sim/structure.js';

// 駅: InstancedMesh(球)1つ。高さは所属路線のelev平均。
// レイヤ規則: 「所属する全路線がOFFのときだけ」非表示(設計5.3、乗換駅対策)
export function createStations(scene, data, proj) {
  const linesById = new Map(data.lines.map((l) => [l.id, l]));
  const inst = new THREE.InstancedMesh(
    new THREE.SphereGeometry(CONFIG.STATION_RADIUS, 12, 8),
    new THREE.MeshBasicMaterial({ color: 0xf0f4f8 }),
    data.stations.length
  );
  const guides = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(CONFIG.DEPTH_GUIDE_RADIUS, CONFIG.DEPTH_GUIDE_RADIUS, 1, 8),
    new THREE.MeshBasicMaterial({
      color: 0x7fd5ff,
      transparent: true,
      opacity: 0.46,
      depthWrite: false,
    }),
    data.stations.length
  );
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3();
  const gm = new THREE.Matrix4(), gp = new THREE.Vector3(), gs = new THREE.Vector3();

  const items = data.stations.map((st) => {
    const { x, z } = proj.toXZ(st.lat, st.lng);
    let sum = 0, n = 0;
    const memberships = [];
    for (const lid of st.lines) {
      const ln = linesById.get(lid);
      const idx = ln.stations.indexOf(st.id);
      if (idx >= 0) {
        sum += ln.elev[idx];
        n++;
        memberships.push({ lineId: lid, structure: classifyStructure(ln.elev[idx]) });
      }
    }
    return { st, x, z, y: (n ? sum / n : 0) * CONFIG.EXAGGERATION, memberships };
  });

  function apply() {
    items.forEach((it, i) => {
      const on = it.memberships.some((mbr) =>
        state.visibleLines.has(mbr.lineId) && state.visibleStructures.has(mbr.structure)
      );
      p.set(it.x, it.y, it.z);
      s.setScalar(on ? 1 : 0.0001);
      m.compose(p, q, s);
      inst.setMatrixAt(i, m);

      const h = Math.abs(it.y);
      gp.set(it.x, it.y / 2, it.z);
      gs.set(1, on && h > 1 ? h : 0.0001, 1);
      gm.compose(gp, q, gs);
      guides.setMatrixAt(i, gm);
    });
    inst.instanceMatrix.needsUpdate = true;
    guides.instanceMatrix.needsUpdate = true;
  }
  apply();
  scene.add(guides);
  scene.add(inst);
  const pos = new Map(items.map((it) => [it.st.id, { x: it.x, y: it.y, z: it.z }]));
  return { mesh: inst, apply, positionOf: (id) => pos.get(id) };
}
