import * as THREE from 'three';

// 視点プリセット(俯瞰/真上/低空)。extent=路線網の広がり(m)に比例した位置へ移動
export function createViewButtons(fly, extent) {
  const el = document.createElement('div');
  el.id = 'viewbtns';
  el.innerHTML = `<button data-v="bird">俯瞰</button><button data-v="top">真上</button><button data-v="low">低空</button>`;
  document.body.appendChild(el);
  const O = new THREE.Vector3(0, 0, 0);
  const P = {
    bird: new THREE.Vector3(0, extent * 0.75, extent * 1.05),
    top:  new THREE.Vector3(1, extent * 1.7, 1),
    low:  new THREE.Vector3(0, extent * 0.13, extent * 0.85),
  };
  el.querySelectorAll('button').forEach((b) => (b.onclick = () => fly.flyTo(P[b.dataset.v].clone(), O.clone())));
}
