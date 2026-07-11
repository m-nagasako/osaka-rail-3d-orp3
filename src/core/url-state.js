import { STRUCTURES } from '../sim/structure.js';

const VERSION = 'v1';
const SPEEDS = [1, 10, 60, 300];
const DEFAULT_TIME = 8 * 3600;
const MAX_TIME = 25 * 3600;

export function defaultShareState(lineIds = []) {
  return {
    visibleLines: new Set(lineIds),
    visibleStructures: new Set(STRUCTURES),
    simTime: DEFAULT_TIME,
    speed: 60,
    running: true,
    showRidership: false,
    showDecorations: true,
  };
}

const normalizeHash = (str) => String(str || '').replace(/^#/, '');

function encodeLineSet(visibleLines, lineIds) {
  const known = new Set(lineIds);
  const visible = new Set([...visibleLines].filter((id) => known.has(id)));
  const on = lineIds.filter((id) => visible.has(id));
  const off = lineIds.filter((id) => !visible.has(id));
  const mode = on.length <= off.length ? 'i' : 'x';
  const ids = mode === 'i' ? on : off;
  return `${mode}${ids.length}:${ids.map(encodeURIComponent).join(',')}`;
}

function decodeLineSet(token, lineIds) {
  const match = /^([ix])(\d+):(.*)$/.exec(token);
  if (!match) return null;
  const [, mode, countText, payload] = match;
  const count = Number(countText);
  if (!Number.isInteger(count) || count < 0 || count > lineIds.length) return null;

  const ids = payload ? payload.split(',').map((id) => decodeURIComponent(id)) : [];
  if (ids.length !== count) return null;
  const known = new Set(lineIds);
  if (ids.some((id) => !known.has(id))) return null;
  const selected = new Set(ids);
  return mode === 'i'
    ? selected
    : new Set(lineIds.filter((id) => !selected.has(id)));
}

function encodeStructures(visibleStructures) {
  return STRUCTURES.reduce((bits, name, idx) =>
    visibleStructures.has(name) ? bits | (1 << idx) : bits, 0).toString(16);
}

function decodeStructures(token) {
  const bits = Number.parseInt(token, 16);
  if (!Number.isInteger(bits) || bits < 0 || bits > 7) return null;
  return new Set(STRUCTURES.filter((_, idx) => bits & (1 << idx)));
}

function encodeFlags(source) {
  let bits = 0;
  if (source.running) bits |= 1;
  if (source.showRidership) bits |= 2;
  if (source.showDecorations) bits |= 4;
  return bits.toString(16);
}

function decodeFlags(token) {
  const bits = Number.parseInt(token, 16);
  if (!Number.isInteger(bits) || bits < 0 || bits > 7) return null;
  return {
    running: Boolean(bits & 1),
    showRidership: Boolean(bits & 2),
    showDecorations: Boolean(bits & 4),
  };
}

export function encodeState(source, lineIds = []) {
  const speedIndex = SPEEDS.indexOf(source.speed);
  const safeSpeedIndex = speedIndex >= 0 ? speedIndex : SPEEDS.indexOf(60);
  const simTime = Math.min(MAX_TIME, Math.max(0, Math.round(source.simTime || 0)));
  return [
    VERSION,
    encodeLineSet(source.visibleLines || new Set(lineIds), lineIds),
    encodeStructures(source.visibleStructures || new Set(STRUCTURES)),
    String(safeSpeedIndex),
    encodeFlags(source),
    simTime.toString(36),
  ].join('.');
}

export function decodeState(str, lineIds = []) {
  const defaults = defaultShareState(lineIds);
  try {
    const parts = normalizeHash(str).split('.');
    if (parts.length !== 6 || parts[0] !== VERSION) return defaults;

    const visibleLines = decodeLineSet(parts[1], lineIds);
    const visibleStructures = decodeStructures(parts[2]);
    const speedIndex = Number(parts[3]);
    const flags = decodeFlags(parts[4]);
    const simTime = Number.parseInt(parts[5], 36);

    if (!visibleLines || !visibleStructures || !flags) return defaults;
    if (!Number.isInteger(speedIndex) || speedIndex < 0 || speedIndex >= SPEEDS.length) return defaults;
    if (!Number.isFinite(simTime) || simTime < 0 || simTime > MAX_TIME) return defaults;

    return {
      visibleLines,
      visibleStructures,
      simTime,
      speed: SPEEDS[speedIndex],
      ...flags,
    };
  } catch {
    return defaults;
  }
}
