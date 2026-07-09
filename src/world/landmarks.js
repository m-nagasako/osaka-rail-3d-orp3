import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { state } from '../core/state.js';

const PIN_COLOR = 0xffd166;
const BASE_COLOR = 0x31566c;

export function createLandmarks(scene, landmarks, proj) {
  const group = new THREE.Group();
  scene.add(group);

  for (const lm of landmarks) {
    const { x, z } = proj.toXZ(lm.lat, lm.lng);
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(70, 70, 8, 18),
      new THREE.MeshBasicMaterial({ color: BASE_COLOR, transparent: true, opacity: 0.72 })
    );
    base.position.set(x, 8, z);
    group.add(base);

    const pin = new THREE.Mesh(
      new THREE.ConeGeometry(46, 160, 5),
      new THREE.MeshBasicMaterial({ color: PIN_COLOR })
    );
    pin.position.set(x, Math.max(120, lm.heightM * 0.9), z);
    group.add(pin);

    const el = document.createElement('div');
    el.className = 'lm-label';
    el.textContent = lm.name;
    const label = new CSS2DObject(el);
    label.position.set(x, Math.max(250, lm.heightM + 150), z);
    group.add(label);
  }

  const apply = () => { group.visible = state.showDecorations; };
  apply();
  return { apply, group };
}
