// 列車運行の純ロジック(three非依存 → Vitestで単体テスト可能)
// 考え方: 列車に状態を持たせず「出発時刻d」と「経過秒e=simT-d」から位置を毎回計算する

export const hmsToSec = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 3600 + m * 60;
};

// 運行プロファイル: 起点をe=0秒に出発した列車の、各駅の{到着秒, 出発秒, 起点からの距離m}
export function buildProfile(stationDistances, avgSpeedKmh, dwellSec) {
  const v = avgSpeedKmh / 3.6; // m/s
  const n = stationDistances.length;
  const profile = [{ arr: 0, dep: 0, dist: 0 }];
  for (let i = 1; i < n; i++) {
    const seg = stationDistances[i] - stationDistances[i - 1];
    const arr = profile[i - 1].dep + seg / v;
    const dep = i === n - 1 ? arr : arr + dwellSec; // 終点は停車せず消滅
    profile.push({ arr, dep, dist: stationDistances[i] });
  }
  return profile;
}

// サービス時間をヘッドウェイ表に従って出発時刻(秒)に展開
export function buildDepartures(service, headways) {
  const start = hmsToSec(service.start), end = hmsToSec(service.end);
  const bands = headways.map((h) => ({ from: hmsToSec(h.from), to: hmsToSec(h.to), sec: h.min * 60 }));
  const deps = [];
  let t = start;
  while (t < end) {
    deps.push(t);
    const b = bands.find((x) => t >= x.from && t < x.to);
    t += b ? b.sec : 600; // 表に穴があれば10分間隔(build-dataの検証で穴は弾いている)
  }
  return deps;
}

// 経過秒e → { dist: 起点からの距離m, stopped: 停車中か } / 運行範囲外はnull
export function positionAt(profile, e) {
  const last = profile[profile.length - 1];
  if (e < 0 || e > last.arr) return null;
  if (e === 0) return { dist: 0, stopped: true };
  // dep_i <= e を満たす最大の i を二分探索
  let lo = 0, hi = profile.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (profile[mid].dep <= e) lo = mid; else hi = mid - 1;
  }
  const cur = profile[lo], next = profile[lo + 1];
  if (!next) return { dist: cur.dist, stopped: true }; // 終点到着の瞬間
  if (e <= next.arr) { // 駅間を走行中: 距離を線形補間
    const r = (e - cur.dep) / (next.arr - cur.dep);
    return { dist: cur.dist + (next.dist - cur.dist) * r, stopped: false };
  }
  return { dist: next.dist, stopped: true }; // 次駅に停車中(arr〜depの間)
}

export function buildSchedule(stationDistances, line) {
  const profile = buildProfile(stationDistances, line.avgSpeedKmh, line.dwellSec);
  return {
    profile,
    departures: buildDepartures(line.service, line.headways),
    T: profile[profile.length - 1].arr, // 全区間所要秒
  };
}
