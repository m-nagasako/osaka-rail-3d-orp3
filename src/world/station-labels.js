import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { CONFIG } from '../config.js';
import { state } from '../core/state.js';
import { classifyStructure } from '../sim/structure.js';

const DESKTOP_ALWAYS = 20;
const DESKTOP_ALL_DISTANCE = 6500;
const MOBILE_ALWAYS = 10;
const MOBILE_ALL_DISTANCE = 4000;

// 駅名ラベル。常時は主要駅のみ、ズームイン時に全駅を表示する。
export function createStationLabels(scene, data, proj) {
  const linesById = new Map(data.lines.map((l) => [l.id, l]));
  const topStations = new Set(
    data.stations
      .filter((s) => s.ridership && s.ridership.value != null)
      .sort((a, b) => b.ridership.value - a.ridership.value)
      .slice(0, DESKTOP_ALWAYS)
      .map((s) => s.id)
  );
  const mobileTopStations = new Set(
    data.stations
      .filter((s) => s.ridership && s.ridership.value != null)
      .sort((a, b) => b.ridership.value - a.ridership.value)
      .slice(0, MOBILE_ALWAYS)
      .map((s) => s.id)
  );

  const group = new THREE.Group();
  scene.add(group);

  const labels = data.stations.map((st) => {
    const { x, z } = proj.toXZ(st.lat, st.lng);
    let sum = 0, n = 0;
    const memberships = [];
    for (const lid of st.lines) {
      const ln = linesById.get(lid);
      const idx = ln ? ln.stations.indexOf(st.id) : -1;
      if (idx >= 0) {
        sum += ln.elev[idx];
        n++;
        memberships.push({ lineId: lid, structure: classifyStructure(ln.elev[idx]) });
      }
    }
    const el = document.createElement('div');
    el.className = topStations.has(st.id) ? 'st-label st-label-top' : 'st-label';
    el.textContent = st.name;

    const label = new CSS2DObject(el);
    label.position.set(x, (n ? sum / n : 0) * CONFIG.EXAGGERATION + 90, z);
    group.add(label);
    return { st, el, label, memberships };
  });

  function update(camera, controls) {
    const mobile = window.innerWidth <= 760;
    const always = mobile ? mobileTopStations : topStations;
    const allDistance = mobile ? MOBILE_ALL_DISTANCE : DESKTOP_ALL_DISTANCE;
    const showAll = camera.position.distanceTo(controls.target) < allDistance;

    for (const item of labels) {
      const lineVisible = item.memberships.some((mbr) =>
        state.visibleLines.has(mbr.lineId) && state.visibleStructures.has(mbr.structure)
      );
      const visible = lineVisible && (showAll || always.has(item.st.id));
      item.label.visible = visible;
      item.el.style.display = visible ? '' : 'none';
    }
  }

  return { update };
}
