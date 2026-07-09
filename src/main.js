import { createScene } from './core/scene.js';
import { createProjection } from './core/projection.js';
import { state, on } from './core/state.js';
import { createGround } from './world/ground.js';
import { createLines } from './world/lines.js';
import { createStations } from './world/stations.js';
import { createStationLabels } from './world/station-labels.js';
import { createTrains } from './world/trains.js';
import { createRidershipBars } from './world/ridership.js';
import { setupPicking } from './world/picking.js';
import { createGeoDeco } from './world/geo-deco.js';
import { createLandmarks } from './world/landmarks.js';
import { createFly } from './core/camera-fly.js';
import { createViewButtons } from './ui/view-buttons.js';
import { createRanking } from './ui/ranking.js';
import { createLayersPanel } from './ui/layers-panel.js';
import { createTimeBar } from './ui/time-bar.js';
import { createStationPanel } from './ui/station-panel.js';
import { createStationTooltip } from './ui/station-tooltip.js';
import { tick } from './sim/clock.js';

async function loadJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`読み込み失敗: ${url} (${res.status})`);
  return res.json();
}

function buildCredits(meta) {
  const el = document.createElement('div');
  el.id = 'credits';
  const src = meta.sources.map((s) => `・${s.name} — ${s.note}`).join('<br>');
  const notes = meta.notes.map((n) => `・${n}`).join('<br>');
  el.innerHTML = `<details><summary>データと注意事項</summary>
    <div class="box"><b>出典</b><br>${src}<br><br><b>注意</b><br>${notes}</div></details>`;
  document.body.appendChild(el);
}

async function boot() {
  const el = document.getElementById('app');
  try {
    const [stations, lines, meta, landmarks] = await Promise.all([
      loadJSON('data/stations.json'),
      loadJSON('data/lines.json'),
      loadJSON('data/meta.json'),
      loadJSON('data/landmarks.json'),
    ]);
    const data = { stations, lines, meta, landmarks };
    state.data = data;
    state.visibleLines = new Set(lines.map((l) => l.id));
    state.showRidership = false;
    state.showDecorations = true;

    const proj = createProjection(stations);
    const { renderer, labelRenderer, scene, camera, controls } = createScene(el);

    let extent = 0;
    for (const s of stations) {
      const { x, z } = proj.toXZ(s.lat, s.lng);
      extent = Math.max(extent, Math.abs(x), Math.abs(z));
    }
    createGround(scene, extent * 2);
    const geoDeco = createGeoDeco(scene, proj);
    const landmarksObj = createLandmarks(scene, landmarks, proj);
    const lineObjects = createLines(scene, data, proj);
    const stationsObj = createStations(scene, data, proj);
    const labels = createStationLabels(scene, data, proj);
    const trains = createTrains(scene, data, lineObjects);
    const bars = createRidershipBars(scene, data, proj);

    // UI
    createLayersPanel(data);
    const timeBar = createTimeBar();
    const panel = createStationPanel(data);
    const tooltip = createStationTooltip(data);
    const fly = createFly(camera, controls);
    const focus = (st) => { // 駅パネル表示+カメラフォーカス(F6/駅クリックとTOP10の共通動作)
      panel.show(st);
      const p = stationsObj.positionOf(st.id);
      if (p) fly.focusStation(p.x, p.y, p.z);
    };
    setupPicking(renderer, camera, stationsObj.mesh, stations, focus, (st, ev) => {
      if (st) tooltip.show(st, ev.clientX, ev.clientY);
      else tooltip.hide();
    });
    createRanking(data, focus);
    createViewButtons(fly, extent);
    buildCredits(meta);

    // レイヤ変更 → 路線チューブ・駅・人員バーへ一括反映(列車はtrainsが毎フレーム参照)
    on('layers', () => {
      for (const [id, o] of lineObjects) o.mesh.visible = state.visibleLines.has(id);
      stationsObj.apply();
      labels.update(camera, controls);
      bars.apply();
      geoDeco.apply();
      landmarksObj.apply();
    });

    let last = performance.now();
    renderer.setAnimationLoop(() => {
      const now = performance.now();
      tick((now - last) / 1000);
      last = now;
      const trainStats = trains.update(state.simTime);
      timeBar.refresh(trainStats);
      controls.update();
      labels.update(camera, controls);
      renderer.render(scene, camera);
      labelRenderer.render(scene, camera);
    });
  } catch (e) {
    el.innerHTML = `<div class="error">データの読み込みに失敗した。再読み込みしてみて。<br>${e.message}</div>`;
  }
}
boot();
