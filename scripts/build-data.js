// build-data.js — 元データ+パッチ → 検証 → public/data/*.json
// 実行: npm run build-data
// 入力系統B(開発用): japan-train-data (npm/MIT, 2017年時点)
// 入力系統A(正式): scripts/raw/N02*.geojson が存在すればそちらを優先(未実装: M1ではB系統のみ)
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { prefectures } = require('japan-train-data');

const DIR = import.meta.dirname;
const OUT = path.join(DIR, '..', 'public', 'data');

// ---- 路線定義(このプロジェクトのID ↔ 元データのID) ----
const LINE_DEFS = [
  { id: 'midosuji',    operator: 'Osaka Metro', ekidataId: 99618, name: '御堂筋線',   expectedBase: 20 },
  { id: 'tanimachi',   operator: 'Osaka Metro', ekidataId: 99619, name: '谷町線',     expectedBase: 26 },
  { id: 'yotsubashi',  operator: 'Osaka Metro', ekidataId: 99620, name: '四つ橋線',   expectedBase: 11 },
  { id: 'chuo',        operator: 'Osaka Metro', ekidataId: 99621, name: '中央線',     expectedBase: 14 },
  { id: 'sennichimae', operator: 'Osaka Metro', ekidataId: 99622, name: '千日前線',   expectedBase: 14 },
  { id: 'sakaisuji',   operator: 'Osaka Metro', ekidataId: 99623, name: '堺筋線',     expectedBase: 10 },
  { id: 'nagahori',    operator: 'Osaka Metro', ekidataId: 99624, name: '長堀鶴見緑地線', expectedBase: 17 },
  { id: 'imazatosuji', operator: 'Osaka Metro', ekidataId: 99652, name: '今里筋線',   expectedBase: 11 },
  { id: 'newtram',     operator: 'Osaka Metro', ekidataId: 99625, name: '南港ポートタウン線', expectedBase: 10 },
  { id: 'kita_kyuko',  operator: '北大阪急行', ekidataId: 99614, name: '南北線', expectedBase: 4 },
];

// ---- パッチ読込 ----
const loadJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const lineMeta   = loadJson(path.join(DIR, 'patches', 'line-meta.json'));
const elevations = loadJson(path.join(DIR, 'patches', 'elevations.json'));
const newSta     = loadJson(path.join(DIR, 'patches', 'new-stations.json'));
const rider      = loadJson(path.join(DIR, 'patches', 'ridership.json'));

const errors = [];
const warnings = [];

// ---- 抽出 ----
const osaka = prefectures.find((p) => p.id === 27);
if (!osaka) throw new Error('大阪府(id:27)が元データに見つからない');

/** 駅ノード。同gidでも駅名が異なる場合(梅田/東梅田/西梅田)は別ノードとして扱う */
const stations = new Map(); // key: `${gid}|${name}`
const byId = new Map();     // key: 出力用id
const gidNames = new Map(); // gid -> 登録済み駅名リスト(id接尾辞の採番用)

function addStation(gid, name, lat, lng, lineId) {
  const key = gid + '|' + name;
  if (!stations.has(key)) {
    const names = gidNames.get(gid) || [];
    const suffix = names.length === 0 ? '' : String.fromCharCode(97 + names.length); // 2つ目以降 b,c…
    names.push(name);
    gidNames.set(gid, names);
    const node = { id: 's' + gid + suffix, name, lat, lng, lines: [], ridership: null };
    stations.set(key, node);
    byId.set(node.id, node);
  }
  const node = stations.get(key);
  if (!node.lines.includes(lineId)) node.lines.push(lineId);
  return node.id;
}

const lines = [];
for (const def of LINE_DEFS) {
  const src = osaka.lines.find((l) => l.id === def.ekidataId);
  if (!src) { errors.push(`路線が元データに無い: ${def.name}(${def.ekidataId})`); continue; }

  // 駅を順序どおりに登録
  let ids = src.stations.map((s) =>
    addStation(s.gid, s.name.ja, s.location.lat, s.location.lng, def.id)
  );

  // 開業差分パッチ(座標がnullなら投入せずWARNING)
  for (const ins of newSta.inserts.filter((i) => i.lineId === def.id)) {
    if (ins.lat == null || ins.lng == null) {
      warnings.push(`開業差分 未投入(座標未確定): ${def.name} ${ins.name}`);
      continue;
    }
    const gid = 'patch-' + ins.name;
    const sid = addStation(gid, ins.name, ins.lat, ins.lng, def.id);
    const anchorIdx = ids.findIndex((x) => byId.get(x).name === ins.anchorName);
    if (anchorIdx < 0) { errors.push(`パッチのanchorが見つからない: ${ins.anchorName}`); continue; }
    ids.splice(ins.position === 'before' ? anchorIdx : anchorIdx + 1, 0, sid);
  }

  // 深さ: 路線×駅ごと(乗換駅で路線別の深さを表現するため)
  const defElev = elevations.defaults[def.id];
  if (defElev === undefined) errors.push(`深さの既定値が無い: ${def.id}`);
  const ovr = elevations.overrides[def.id] || {};
  const elev = ids.map((sid) => {
    const nm = byId.get(sid).name;
    return ovr[nm] !== undefined ? ovr[nm] : defElev;
  });

  // 路線メタ
  const meta = lineMeta[def.id];
  if (!meta) { errors.push(`line-meta.jsonに定義が無い: ${def.id}`); continue; }

  lines.push({
    id: def.id, operator: def.operator, name: def.name,
    color: meta.color, stations: ids, elev,
    avgSpeedKmh: meta.avgSpeedKmh, dwellSec: meta.dwellSec,
    service: meta.service, headways: meta.headways,
    _expected: def.expectedBase, // 検証用(出力前に削除)
  });
}

// ---- 乗降人員の投入(駅名で照合、ヶ/ケの表記ゆれを吸収) ----
const norm = (s) => s.replace(/ヶ/g, 'ケ');
const nameIndex = new Map([...byId.values()].map((n) => [norm(n.name), n]));
for (const [name, value] of Object.entries(rider.data)) {
  const node = nameIndex.get(norm(name));
  if (!node) { errors.push(`乗降人員: 駅名が一致しない「${name}」`); continue; }
  node.ridership = { value, year: rider.year, source: rider.source };
}
for (const [name, into] of Object.entries(rider.aggregatedInto)) {
  const node = nameIndex.get(norm(name));
  if (!node) { errors.push(`乗降人員(集計先): 駅名が一致しない「${name}」`); continue; }
  node.ridership = { value: null, year: rider.year, source: rider.source, note: `${into}駅で集計` };
}
for (const [name, note] of Object.entries(rider.stationNotes || {})) {
  const node = nameIndex.get(norm(name));
  if (!node) { errors.push(`乗降人員(注記): 駅名が一致しない「${name}」`); continue; }
  node.ridership = {
    value: null,
    year: note.year || rider.year,
    source: note.source || rider.source,
    note: note.note,
  };
}

// ---- 検証 ----
const toMin = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
const haversineKm = (a, b) => {
  const R = 6371, rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

for (const ln of lines) {
  // 駅数(ベース+適用済みパッチ数)
  const applied = newSta.inserts.filter(
    (i) => i.lineId === ln.id && i.lat != null && i.lng != null
  ).length;
  if (ln.stations.length !== ln._expected + applied) {
    errors.push(`${ln.name}: 駅数不一致 期待${ln._expected + applied} 実際${ln.stations.length}`);
  }
  // 色の形式
  if (!/^#[0-9a-fA-F]{6}$/.test(ln.color)) errors.push(`${ln.name}: 色が不正 ${ln.color}`);
  // elev配列長
  if (ln.elev.length !== ln.stations.length) errors.push(`${ln.name}: elev配列長不一致`);
  // 参照整合+座標範囲+隣接駅間距離
  for (let i = 0; i < ln.stations.length; i++) {
    const st = byId.get(ln.stations[i]);
    if (!st) { errors.push(`${ln.name}: 参照切れ ${ln.stations[i]}`); continue; }
    if (st.lat < 34.3 || st.lat > 34.9 || st.lng < 135.2 || st.lng > 135.7) {
      errors.push(`${st.name}: 座標が大阪近辺の範囲外 (${st.lat}, ${st.lng})`);
    }
    if (i > 0) {
      const prev = byId.get(ln.stations[i - 1]);
      const d = haversineKm(prev, st);
      if (d < 0.25 || d > 4.5) {
        errors.push(`${ln.name}: ${prev.name}→${st.name} 駅間距離が異常 ${d.toFixed(2)}km`);
      }
    }
  }
  // ヘッドウェイがサービス時間を隙間なく覆うか
  const s = toMin(ln.service.start), e = toMin(ln.service.end);
  let cur = s;
  for (const hw of ln.headways) {
    if (toMin(hw.from) !== cur) { errors.push(`${ln.name}: ヘッドウェイに隙間/重複 (${hw.from})`); break; }
    if (!(hw.min > 0)) errors.push(`${ln.name}: 間隔が不正 ${hw.min}`);
    cur = toMin(hw.to);
  }
  if (cur !== e) errors.push(`${ln.name}: ヘッドウェイが終端まで届かない`);
}

// 距離サニティ: 梅田〜なんば(直線で約4km)
const umeda = [...byId.values()].find((s) => s.name === '梅田');
const namba = [...byId.values()].find((s) => s.name === 'なんば');
if (umeda && namba) {
  const d = haversineKm(umeda, namba);
  if (d < 3.0 || d > 5.5) errors.push(`距離サニティNG: 梅田〜なんば ${d.toFixed(2)}km`);
  else console.log(`距離サニティOK: 梅田〜なんば ${d.toFixed(2)}km`);
} else {
  errors.push('距離サニティ: 梅田またはなんばが見つからない');
}

// 乗降人員の未投入数(工程②までは警告)
const noRider = [...byId.values()].filter((s) => s.ridership == null).length;
if (noRider) warnings.push(`乗降人員 未投入: ${noRider}駅(工程②で投入)`);

// ---- 出力 ----
const pending = [];
if (lineMeta._colorsVerified !== true) pending.push('ラインカラーは仮値(未確定)');
if (lineMeta._headwaysVerified !== true) pending.push('運転間隔は概算(未確定)');
if (elevations._verified === false) pending.push('深さは概算値(未確定)');
if (warnings.some((w) => w.includes('開業差分'))) pending.push('夢洲駅 未投入');
if (noRider) pending.push('乗降人員 未投入');

const meta = {
  project: 'OSAKA RAIL 3D',
  dataTrack: 'bootstrap',
  sources: [
    { name: 'japan-train-data v0.6.0 (npm)', license: 'MIT', note: '駅座標・路線構成(2017年時点)。公開時はN02系統への差し替え推奨' },
    { name: 'Osaka Metro 路線別駅別乗降人員(2025年11月11日交通調査)', license: '公表資料', note: '乗降人員' },
    { name: '北大阪急行電鉄 路線図・各駅情報', license: '公式サイト', note: '南北線の駅構成・時刻表(2026-07-09取得)' },
    { name: 'colordic.org メトロカラー', license: '参照(色名は複数ソースで照合)', note: 'ラインカラー' },
    { name: 'Googleプレイス検索/Wikipedia', license: '参照', note: '夢洲駅の座標・開業情報(2026-07-07取得)' },
    { name: 'Wikipedia/GeoHack', license: 'CC BY-SA等', note: '箕面萱野・箕面船場阪大前の概略座標(2026-07-09取得)' },
  ],
  generatedAt: new Date().toISOString(),
  notes: [
    '列車の運行は実ダイヤではなく運転間隔ベースの近似',
    '深さは概算・縦方向は誇張表示',
    '線形は駅間を滑らかに補間した近似(実際の線路形状ではない)',
    '直通運転は非対応(各路線内で折返し)',
    '中央線の夢洲〜コスモスクエア間は実際は約半数運行だが、全列車直通として近似',
    ...pending.map((p) => `[未確定] ${p}`),
  ],
};

console.log('--- 検証結果 ---');
console.log(`路線: ${lines.length} / ユニーク駅: ${byId.size} / 延べ駅: ${lines.reduce((a, l) => a + l.stations.length, 0)}`);
const totalRider = [...byId.values()].reduce((a, s) => a + ((s.ridership && s.ridership.value) || 0), 0);
console.log(`乗降人員 合計: ${totalRider.toLocaleString()}人/日`);
warnings.forEach((w) => console.log('WARN:', w));
if (errors.length) {
  errors.forEach((e) => console.error('ERROR:', e));
  console.error(`検証エラー ${errors.length}件 → 出力を中止`);
  process.exit(1);
}

fs.mkdirSync(OUT, { recursive: true });
for (const ln of lines) delete ln._expected;
fs.writeFileSync(path.join(OUT, 'stations.json'), JSON.stringify([...byId.values()], null, 1));
fs.writeFileSync(path.join(OUT, 'lines.json'), JSON.stringify(lines, null, 1));
fs.writeFileSync(path.join(OUT, 'meta.json'), JSON.stringify(meta, null, 1));
console.log(`出力完了 → ${OUT}`);
