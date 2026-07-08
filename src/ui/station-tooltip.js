// 駅ホバー時の軽量ツールチップ。クリック用パネルより短く、カーソル付近で駅の要点だけ出す
export function createStationTooltip(data) {
  const linesById = new Map(data.lines.map((l) => [l.id, l]));
  const el = document.createElement('div');
  el.id = 'station-tooltip';
  document.body.appendChild(el);

  const ridershipText = (st) => {
    const r = st.ridership;
    if (!r) return '乗降人員: データなし';
    if (r.value == null) return `乗降人員: ${r.note}`;
    return `乗降人員: ${r.value.toLocaleString()}人/日`;
  };

  const depthText = (st) => st.lines.map((lid) => {
    const ln = linesById.get(lid);
    const idx = ln.stations.indexOf(st.id);
    const e = ln.elev[idx];
    return `<div class="tip-line"><span class="tip-chip" style="background:${ln.color}"></span>${ln.name}: ${e > 0 ? '+' + e : e}m (概算)</div>`;
  }).join('');

  function move(x, y) {
    const pad = 14;
    const rect = el.getBoundingClientRect();
    const left = Math.min(x + pad, window.innerWidth - rect.width - 8);
    const top = Math.min(y + pad, window.innerHeight - rect.height - 8);
    el.style.left = `${Math.max(8, left)}px`;
    el.style.top = `${Math.max(8, top)}px`;
  }

  return {
    show(st, x, y) {
      el.innerHTML = `
        <div class="tip-name">${st.name}</div>
        <div class="tip-rider">${ridershipText(st)}</div>
        <div class="tip-depth">${depthText(st)}</div>`;
      el.style.display = 'block';
      move(x, y);
    },
    hide() {
      el.style.display = 'none';
    },
  };
}
