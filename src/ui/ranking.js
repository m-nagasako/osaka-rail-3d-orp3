// 乗降人員TOP10ランキング。レイヤパネル内に表示し、行クリックで駅へフォーカス
export function createRanking(data, onSelect) {
  const host = document.getElementById('layers');
  const sec = document.createElement('div');
  sec.className = 'sw';
  sec.innerHTML = `
    <div class="row"><input type="checkbox" id="sw-rank"><label for="sw-rank" class="nm">乗降人員 TOP10</label></div>
    <div class="ranklist" style="display:none"></div>`;
  host.appendChild(sec);

  const top = data.stations
    .filter((s) => s.ridership && s.ridership.value)
    .sort((a, b) => b.ridership.value - a.ridership.value)
    .slice(0, 10);
  const max = top[0].ridership.value;
  const list = sec.querySelector('.ranklist');
  list.innerHTML = top.map((s, i) => `
    <div class="rankrow" data-id="${s.id}">
      <span class="rk">${i + 1}</span><span class="rnm">${s.name}</span>
      <span class="bar" style="width:${Math.max(5, (s.ridership.value / max) * 68)}px"></span>
      <span class="rv">${(s.ridership.value / 10000).toFixed(1)}万</span>
    </div>`).join('');

  sec.querySelector('#sw-rank').onchange = (e) => (list.style.display = e.target.checked ? 'block' : 'none');
  list.querySelectorAll('.rankrow').forEach((row) =>
    (row.onclick = () => onSelect(data.stations.find((s) => s.id === row.dataset.id))));
}
