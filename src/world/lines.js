import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { state } from '../core/state.js';
import { classifyStructure, hasVisibleStructure } from '../sim/structure.js';

// 路線: 駅座標を通るCatmullRom曲線 → チューブ。深さは路線×駅のelev配列から
export function createLines(scene, data, proj) {
  const group = new THREE.Group();
  scene.add(group);
  const stationById = new Map(data.stations.map((s) => [s.id, s]));
  const lineObjects = new Map(); // lineId -> { group, segments, curve, line, points, apply }

  for (const line of data.lines) {
    const points = line.stations.map((sid, i) => {
      const st = stationById.get(sid);
      const { x, z } = proj.toXZ(st.lat, st.lng);
      return new THREE.Vector3(x, line.elev[i] * CONFIG.EXAGGERATION, z);
    });
    const closed = line.closed === true;
    const curve = new THREE.CatmullRomCurve3(points, closed, 'centripetal', 0.5);
    curve.arcLengthDivisions = Math.max(1, (closed ? points.length : points.length - 1) * 40);
    curve.updateArcLengths();
    const lineGroup = new THREE.Group();
    lineGroup.userData.lineId = line.id;
    const segments = [];
    const segmentCount = closed ? points.length : points.length - 1;
    for (let i = 0; i < segmentCount; i++) {
      const j = (i + 1) % points.length;
      const segCurve = new THREE.CatmullRomCurve3([points[i], points[j]], false, 'centripetal', 0.5);
      const geo = new THREE.TubeGeometry(segCurve, 12, CONFIG.TUBE_RADIUS, 6, false);
      const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: line.color }));
      const classes = [classifyStructure(line.elev[i]), classifyStructure(line.elev[j])];
      lineGroup.add(mesh);
      segments.push({ mesh, classes });
    }
    group.add(lineGroup);
    const apply = () => {
      const lineOn = state.visibleLines.has(line.id);
      lineGroup.visible = lineOn;
      for (const seg of segments) {
        seg.mesh.visible = lineOn && hasVisibleStructure(seg.classes, state.visibleStructures);
      }
    };
    apply();
    lineObjects.set(line.id, { group: lineGroup, segments, curve, line, points, apply });
  }
  return lineObjects;
}
