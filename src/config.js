// 全体設定。単位は基本メートル(1 unit = 1m)
export const CONFIG = {
  EXAGGERATION: 14,       // 縦方向の誇張率(地下の深さを視覚的に読めるよう強める)
  BG_COLOR: 0x05070c,
  GROUND_COLOR: 0x0d1117,
  GROUND_OPACITY: 0.36,   // 半透明にして地下路線を透かして見せる
  TUBE_RADIUS: 22,        // 路線チューブの半径(m, 誇張込みの見た目値)
  STATION_RADIUS: 34,     // 駅マーカー球の半径
  DEPTH_GUIDE_RADIUS: 9,  // 地表から駅までの深さガイド柱
  TRAIN_Y_OFFSET: 58,     // 列車を路線チューブより少し浮かせて視認性を上げる
  MARGIN: 1500,           // 地面の外周余白
  STRUCTURE_EPS: 2,       // -2〜+2mは地上扱いに丸める
};
