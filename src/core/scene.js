import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CONFIG } from '../config.js';

// レンダラ・シーン・カメラ・操作系の初期化
export function createScene(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // 高DPI端末の負荷抑制
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(CONFIG.BG_COLOR);
  scene.fog = new THREE.Fog(CONFIG.BG_COLOR, 18000, 45000);

  const camera = new THREE.PerspectiveCamera(
    55, window.innerWidth / window.innerHeight, 1, 120000
  );
  camera.position.set(0, 9000, 13000); // 南上空から俯瞰

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 400;
  controls.maxDistance = 40000;

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { renderer, scene, camera, controls };
}
