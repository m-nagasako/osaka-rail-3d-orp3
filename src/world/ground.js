import * as THREE from 'three';
import { CONFIG } from '../config.js';

// 半透明の地面+グリッド。地下路線が透けて見えるのが狙い
export function createGround(scene, extent) {
  const size = extent + CONFIG.MARGIN * 2;

  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshBasicMaterial({
      color: CONFIG.GROUND_COLOR,
      transparent: true,
      opacity: CONFIG.GROUND_OPACITY,
      depthWrite: false,       // 透過の裏にある地下チューブを消さない
      side: THREE.DoubleSide,  // 見下ろし・見上げの両対応
    })
  );
  plane.rotation.x = -Math.PI / 2;
  plane.renderOrder = 1; // 不透明物(路線)の後に重ねる
  scene.add(plane);

  const grid = new THREE.GridHelper(size, 44, 0x1d2836, 0x131a24);
  grid.position.y = 2;
  scene.add(grid);
}
