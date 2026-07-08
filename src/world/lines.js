import * as THREE from 'three';
import { CONFIG } from '../config.js';

// 路線: 駅座標を通るCatmullRom曲線 → チューブ。深さは路線×駅のelev配列から
export function createLines(scene, data, proj) {
  const group = new THREE.Group();
  scene.add(group);
  const stationById = new Map(data.stations.map((s) => [s.id, s]));
  const lineObjects = new Map(); // lineId -> { mesh, curve, line, points }

  for (const line of data.lines) {
    const points = line.stations.map((sid, i) => {
      const st = stationById.get(sid);
      const { x, z } = proj.toXZ(st.lat, st.lng);
      return new THREE.Vector3(x, line.elev[i] * CONFIG.EXAGGERATION, z);
    });
    const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.5);
    curve.arcLengthDivisions = Math.max(1, (points.length - 1) * 40);
    curve.updateArcLengths();
    const geo = new THREE.TubeGeometry(
      curve, Math.max(64, points.length * 10), CONFIG.TUBE_RADIUS, 6, false
    );
    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: line.color }));
    mesh.userData.lineId = line.id;
    group.add(mesh);
    lineObjects.set(line.id, { mesh, curve, line, points });
  }
  return lineObjects;
}
