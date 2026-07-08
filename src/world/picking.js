import * as THREE from 'three';

// 駅クリック/ホバー判定: InstancedMeshへのレイキャスト → instanceId → 駅
export function setupPicking(renderer, camera, stationsMesh, stations, onPick, onHover) {
  const ray = new THREE.Raycaster();
  const ptr = new THREE.Vector2();
  let downX = 0, downY = 0;
  let hoveringId = null;
  const dom = renderer.domElement;

  const hitStation = (e) => {
    const rect = dom.getBoundingClientRect();
    ptr.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    ray.setFromCamera(ptr, camera);
    const hits = ray.intersectObject(stationsMesh);
    return hits.length && hits[0].instanceId != null ? stations[hits[0].instanceId] : null;
  };

  dom.addEventListener('pointerdown', (e) => { downX = e.clientX; downY = e.clientY; });
  dom.addEventListener('pointermove', (e) => {
    const st = hitStation(e);
    const id = st?.id || null;
    dom.style.cursor = st ? 'pointer' : '';
    if (id !== hoveringId) hoveringId = id;
    if (onHover) onHover(st, e);
  });
  dom.addEventListener('pointerleave', () => {
    hoveringId = null;
    dom.style.cursor = '';
    if (onHover) onHover(null);
  });
  dom.addEventListener('pointerup', (e) => {
    if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) return; // ドラッグはカメラ操作
    const st = hitStation(e);
    if (st) onPick(st);
  });
}
