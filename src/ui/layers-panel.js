import { state, emit } from '../core/state.js';
import { encodeState } from '../core/url-state.js';
import { STRUCTURES } from '../sim/structure.js';

// レイヤパネル: 事業者 > 路線 のON/OFF・ソロ・全表示切替・乗降人員バーのスイッチ
export function createLayersPanel(data) {
  const el = document.createElement('div');
  el.id = 'layers';
  el.innerHTML = `
    <h2>路線レイヤ</h2>
    <div class="tools"><button class="all">全表示</button><button class="none">全非表示</button></div>
    <div class="list"></div>
    <h2 class="filter-title">構造フィルタ</h2>
    <div class="structure-list"></div>
    <div class="sw row"><input type="checkbox" id="sw-deco" checked><label for="sw-deco" class="nm">装飾(海岸線・淀川・ランドマーク)</label></div>
    <div class="sw row"><input type="checkbox" id="sw-rider"><label for="sw-rider" class="nm">乗降人員バー(√スケール)</label></div>
    <div class="sw share-row"><button class="share-url">共有</button><span class="share-status" aria-live="polite"></span></div>`;
  document.body.appendChild(el);

  const list = el.querySelector('.list');
  let soloed = null;
  const change = () => emit('layers');
  const lineInputs = new Map();
  const operatorControls = [];
  const structureInputs = new Map();
  const groups = new Map();
  for (const line of data.lines) {
    const operator = line.operator || 'Osaka Metro';
    if (!groups.has(operator)) groups.set(operator, []);
    groups.get(operator).push(line);
  }

  let operatorIndex = 0;
  for (const [operator, lines] of groups) {
    const heading = document.createElement('div');
    const operatorId = `op-${operatorIndex++}`;
    heading.className = 'operator-row';
    heading.innerHTML = `<input type="checkbox" checked id="${operatorId}"><label for="${operatorId}">${operator}</label>`;
    list.appendChild(heading);
    const operatorInput = heading.querySelector('input');
    const lineIds = lines.map((line) => line.id);
    operatorControls.push({ input: operatorInput, lineIds });
    operatorInput.onchange = (e) => {
      soloed = null;
      for (const id of lineIds) {
        if (e.target.checked) state.visibleLines.add(id);
        else state.visibleLines.delete(id);
      }
      sync(); change();
    };
    for (const line of lines) {
      const row = document.createElement('div');
      row.className = 'row';
      row.innerHTML = `
        <input type="checkbox" checked id="ck-${line.id}">
        <span class="chip" style="background:${line.color}"></span>
        <label class="nm" for="ck-${line.id}">${line.name}</label>
        <button class="solo">solo</button>`;
      list.appendChild(row);
      const input = row.querySelector('input');
      lineInputs.set(line.id, input);
      input.onchange = (e) => {
        soloed = null;
        e.target.checked ? state.visibleLines.add(line.id) : state.visibleLines.delete(line.id);
        sync(); change();
      };
      row.querySelector('.solo').onclick = () => {
        if (soloed === line.id) { // 2回目で解除=全表示に戻す
          soloed = null;
          state.visibleLines = new Set(data.lines.map((l) => l.id));
        } else {
          soloed = line.id;
          state.visibleLines = new Set([line.id]);
        }
        sync(); change();
      };
    }
  }
  const sync = () => {
    for (const line of data.lines) {
      const input = lineInputs.get(line.id);
      if (input) input.checked = state.visibleLines.has(line.id);
    }
    for (const control of operatorControls) {
      const visibleCount = control.lineIds.filter((id) => state.visibleLines.has(id)).length;
      control.input.checked = visibleCount === control.lineIds.length;
      control.input.indeterminate = visibleCount > 0 && visibleCount < control.lineIds.length;
    }
    for (const name of STRUCTURES) {
      const input = structureInputs.get(name);
      if (input) input.checked = state.visibleStructures.has(name);
    }
    el.querySelector('#sw-rider').checked = state.showRidership;
    el.querySelector('#sw-deco').checked = state.showDecorations;
  };
  el.querySelector('.all').onclick = () => {
    soloed = null; state.visibleLines = new Set(data.lines.map((l) => l.id)); sync(); change();
  };
  el.querySelector('.none').onclick = () => {
    soloed = null; state.visibleLines.clear(); sync(); change();
  };
  const structureList = el.querySelector('.structure-list');
  for (const name of STRUCTURES) {
    const row = document.createElement('div');
    row.className = 'row structure-row';
    row.innerHTML = `<input type="checkbox" checked id="st-${name}"><label for="st-${name}" class="nm">${name}</label>`;
    structureList.appendChild(row);
    const input = row.querySelector('input');
    structureInputs.set(name, input);
    input.onchange = (e) => {
      e.target.checked ? state.visibleStructures.add(name) : state.visibleStructures.delete(name);
      sync();
      change();
    };
  }
  el.querySelector('#sw-rider').onchange = (e) => { state.showRidership = e.target.checked; sync(); change(); };
  el.querySelector('#sw-deco').onchange = (e) => { state.showDecorations = e.target.checked; sync(); change(); };

  const status = el.querySelector('.share-status');
  let statusTimer = null;
  const showStatus = (message) => {
    status.textContent = message;
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => { status.textContent = ''; }, 2200);
  };
  el.querySelector('.share-url').onclick = async () => {
    const url = new URL(window.location.href);
    url.hash = encodeState(state, data.lines.map((l) => l.id));
    history.replaceState(null, '', url);
    try {
      await copyText(url.toString());
      showStatus('コピー済み');
    } catch {
      showStatus('コピー失敗');
    }
  };

  sync();

  // モバイル: 開閉ボタン
  document.getElementById('toggle-layers').onclick = () => el.classList.toggle('open');
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  const ok = document.execCommand('copy');
  ta.remove();
  if (!ok) throw new Error('copy failed');
}
