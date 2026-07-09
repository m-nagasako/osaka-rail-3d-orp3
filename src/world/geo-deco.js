import * as THREE from 'three';
import { state } from '../core/state.js';

// 模式的な海岸線(大阪湾)と淀川のライン。
// ※装飾目的の手描きデフォルメであり実測データではない(精度非保証)。外部設計F1の但し書きどおり
const COAST = [[34.725,135.375],[34.703,135.408],[34.678,135.425],[34.655,135.436],
               [34.632,135.441],[34.610,135.443],[34.588,135.452],[34.568,135.470]];
const YODO  = [[34.737,135.565],[34.728,135.530],[34.720,135.501],[34.713,135.470],
               [34.701,135.444],[34.690,135.414]];

export function createGeoDeco(scene, proj) {
  const group = new THREE.Group();
  scene.add(group);
  const mk = (pts, opacity) => {
    const v = pts.map(([lat, lng]) => {
      const { x, z } = proj.toXZ(lat, lng);
      return new THREE.Vector3(x, 3, z);
    });
    const g = new THREE.BufferGeometry().setFromPoints(v);
    group.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0x2e5a70, transparent: true, opacity })));
  };
  mk(COAST, 0.85);
  mk(YODO, 0.6);
  const apply = () => { group.visible = state.showDecorations; };
  apply();
  return { apply, group };
}
