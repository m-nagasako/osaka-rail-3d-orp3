// 緯度経度(WGS84) → ローカル直交座標(m) の等距円筒近似。
// 原点は全駅の外接矩形の中心を自動算出(座標のハードコードをしない)
export function createProjection(stations) {
  const lats = stations.map((s) => s.lat);
  const lngs = stations.map((s) => s.lng);
  const lat0 = (Math.min(...lats) + Math.max(...lats)) / 2;
  const lng0 = (Math.min(...lngs) + Math.max(...lngs)) / 2;
  const kx = 111320 * Math.cos((lat0 * Math.PI) / 180); // 経度1度あたりのm
  const kz = 110540;                                    // 緯度1度あたりのm
  return {
    lat0, lng0,
    toXZ(lat, lng) {
      return { x: (lng - lng0) * kx, z: -(lat - lat0) * kz }; // 北=−Z
    },
  };
}
