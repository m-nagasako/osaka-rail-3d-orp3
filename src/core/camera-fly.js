import * as THREE from 'three';

// カメラの滑らか移動(easeInOut)。ユーザーが操作を始めたら即中断して主導権を返す
export function createFly(camera, controls) {
  let anim = null;
  const cancel = () => { if (anim) cancelAnimationFrame(anim); anim = null; };
  controls.addEventListener('start', cancel);

  function flyTo(camTo, tgtTo, ms = 750) {
    cancel();
    const c0 = camera.position.clone(), t0 = controls.target.clone();
    const start = performance.now();
    const step = () => {
      const k = Math.min(1, (performance.now() - start) / ms);
      const e = k < 0.5 ? 2 * k * k : 1 - ((-2 * k + 2) ** 2) / 2;
      camera.position.lerpVectors(c0, camTo, e);
      controls.target.lerpVectors(t0, tgtTo, e);
      anim = k < 1 ? requestAnimationFrame(step) : null;
    };
    anim = requestAnimationFrame(step);
  }

  // 駅フォーカス: 現在の視線方向を保ったまま2600mまで寄る
  function focusStation(x, y, z) {
    const tgt = new THREE.Vector3(x, y, z);
    const dir = camera.position.clone().sub(controls.target);
    if (dir.lengthSq() < 1) dir.set(0, 1, 1);
    dir.setLength(2600);
    if (dir.y < 900) { dir.y = 900; dir.setLength(2600); }
    flyTo(tgt.clone().add(dir), tgt);
  }
  return { flyTo, focusStation };
}
