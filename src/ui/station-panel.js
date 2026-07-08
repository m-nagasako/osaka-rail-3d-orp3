// 駅クリックで出る情報パネル + ピン留め比較(最大5駅)
export function createStationPanel(data) {
  const linesById = new Map(data.lines.map((l) => [l.id, l]));
  const el = document.createElement('div');
  el.id = 'station-panel';
  document.body.appendChild(el);
  const pinned = []; // {name, value}
  let current = null;

  const depthText = (st) => st.lines.map((lid) => {
    const ln = linesById.get(lid);
    const i = ln.stations.indexOf(st.id);
    const e = ln.elev[i];
    return `<div class="lr"><span class="chip" style="background:${ln.color};width:11px;height:11px;border-radius:3px"></span>
      ${ln.name} <span style="color:var(--dim)">${e > 0 ? '高架 +' + e : '地下 ' + e}m(概算)</span></div>`;
  }).join('');

  const riderBlock = (st) => {
    const r = st.ridership;
    if (!r) return `<div class="src">乗降人員データなし</div>`;
    if (r.value == null) return `<div class="src">乗降人員: ${r.note}(${r.year})</div>`;
    return `<div class="num">${r.value.toLocaleString()}<span style="font-size:12px;color:var(--dim)"> 人/日</span></div>
      <div class="src">${r.source} / ${r.year}</div>`;
  };

  function render() {
    if (!current) { el.style.display = 'none'; return; }
    const st = current;
    const canPin = st.ridership && st.ridership.value != null;
    el.style.display = 'block';
    el.innerHTML = `
      <button class="close">×</button>
      <h2>${st.name}</h2>
      ${riderBlock(st)}
      <div class="sec">${depthText(st)}</div>
      <div class="sec">
        <button class="pin" ${canPin ? '' : 'disabled'}>📌 比較に追加</button>
        <div class="pins"></div>
      </div>`;
    el.querySelector('.close').onclick = () => { current = null; render(); };
    el.querySelector('.pin').onclick = () => {
      if (!pinned.some((p) => p.name === st.name)) {
        pinned.push({ name: st.name, value: st.ridership.value });
        if (pinned.length > 5) pinned.shift(); // 最大5駅
      }
      render();
    };
    renderPins();
  }

  function renderPins() {
    const box = el.querySelector('.pins');
    if (!box) return;
    if (!pinned.length) { box.innerHTML = '<div class="src">駅をピン留めすると乗降人員を並べて比較できる</div>'; return; }
    const max = Math.max(...pinned.map((p) => p.value));
    box.innerHTML = pinned.map((p, i) => `
      <div class="pinrow">
        <span style="width:86px;flex:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.name}</span>
        <span class="bar" style="width:${Math.max(4, (p.value / max) * 90)}px"></span>
        <span style="color:var(--dim)">${p.value.toLocaleString()}</span>
        <button data-i="${i}" style="padding:0 6px;font-size:11px">×</button>
      </div>`).join('');
    box.querySelectorAll('button').forEach((b) => (b.onclick = () => { pinned.splice(Number(b.dataset.i), 1); render(); }));
  }

  return { show(st) { current = st; render(); } };
}
