import * as THREE from 'three';
import { state } from '../core/state.js';
import { classifyStructure } from '../sim/structure.js';

// 乗降人員バー: 駅の真上に√(人員)比例の角柱。梅田(43万)と小駅(数千)の差が
// 線形だと画が壊れるため√で圧縮し、実数は駅パネルに表示する(設計5.2)
const K = 3.5; // 高さ係数: √434981×3.5 ≒ 2300m(梅田)

export function createRidershipBars(scene, data, proj) {
  const linesById = new Map(data.lines.map((l) => [l.id, l]));
  const geo = new THREE.BoxGeometry(60, 1, 60);
  geo.translate(0, 0.5, 0); // 原点を底面に→yスケール=高さ
  const inst = new THREE.InstancedMesh(
    geo,
    new THREE.MeshBasicMaterial({ color: 0xffc857, transparent: true, opacity: 0.82, depthWrite: false }),
    data.stations.length
  );
  inst.renderOrder = 2;
  scene.add(inst);

  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3();
  const items = data.stations.map((st) => {
    const { x, z } = proj.toXZ(st.lat, st.lng);
    const v = st.ridership && st.ridership.value;
    const memberships = [];
    for (const lid of st.lines) {
      const ln = linesById.get(lid);
      const idx = ln ? ln.stations.indexOf(st.id) : -1;
      if (idx >= 0) memberships.push({ lineId: lid, structure: classifyStructure(ln.elev[idx]) });
    }
    return { st, x, z, h: v ? Math.sqrt(v) * K : 0, memberships };
  });

  function apply() {
    items.forEach((it, i) => {
      const on = state.showRidership && it.h > 0 && it.memberships.some((mbr) =>
        state.visibleLines.has(mbr.lineId) && state.visibleStructures.has(mbr.structure)
      );
      p.set(it.x, 2, it.z);
      s.set(1, on ? it.h : 0.0001, 1); // OFFはほぼ0に潰して非表示扱い
      m.compose(p, q, s);
      inst.setMatrixAt(i, m);
    });
    inst.instanceMatrix.needsUpdate = true;
  }
  apply();
  return { apply };
}
