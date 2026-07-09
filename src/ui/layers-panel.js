import { state, emit } from '../core/state.js';

// レイヤパネル: 事業者 > 路線 のON/OFF・ソロ・全表示切替・乗降人員バーのスイッチ
export function createLayersPanel(data) {
  const el = document.createElement('div');
  el.id = 'layers';
  el.innerHTML = `
    <h2>路線レイヤ</h2>
    <div class="tools"><button class="all">全表示</button><button class="none">全非表示</button></div>
    <div class="list"></div>
    <div class="sw row"><input type="checkbox" id="sw-rider"><label for="sw-rider" class="nm">乗降人員バー(√スケール)</label></div>`;
  document.body.appendChild(el);

  const list = el.querySelector('.list');
  let soloed = null;
  const change = () => emit('layers');
  const groups = new Map();
  for (const line of data.lines) {
    const operator = line.operator || 'Osaka Metro';
    if (!groups.has(operator)) groups.set(operator, []);
    groups.get(operator).push(line);
  }

  for (const [operator, lines] of groups) {
    const heading = document.createElement('h3');
    heading.textContent = operator;
    list.appendChild(heading);
    for (const line of lines) {
      const row = document.createElement('div');
      row.className = 'row';
      row.innerHTML = `
        <input type="checkbox" checked id="ck-${line.id}">
        <span class="chip" style="background:${line.color}"></span>
        <label class="nm" for="ck-${line.id}">${line.name}</label>
        <button class="solo">solo</button>`;
      list.appendChild(row);
      row.querySelector('input').onchange = (e) => {
        soloed = null;
        e.target.checked ? state.visibleLines.add(line.id) : state.visibleLines.delete(line.id);
        change();
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
    for (const line of data.lines)
      el.querySelector(`#ck-${line.id}`).checked = state.visibleLines.has(line.id);
  };
  el.querySelector('.all').onclick = () => {
    soloed = null; state.visibleLines = new Set(data.lines.map((l) => l.id)); sync(); change();
  };
  el.querySelector('.none').onclick = () => {
    soloed = null; state.visibleLines.clear(); sync(); change();
  };
  el.querySelector('#sw-rider').onchange = (e) => { state.showRidership = e.target.checked; change(); };

  // モバイル: 開閉ボタン
  document.getElementById('toggle-layers').onclick = () => el.classList.toggle('open');
}
