import { CONFIG } from '../config.js';

export const STRUCTURES = ['地下', '地上', '高架'];

export function classifyStructure(elevM, eps = CONFIG.STRUCTURE_EPS) {
  if (elevM < -eps) return '地下';
  if (elevM > eps) return '高架';
  return '地上';
}

export function hasVisibleStructure(classes, visibleStructures) {
  return classes.some((name) => visibleStructures.has(name));
}
