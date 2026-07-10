import { describe, it, expect } from 'vitest';
import { classifyStructure } from '../src/sim/structure.js';

describe('classifyStructure', () => {
  it('EPS境界を含めて地下/地上/高架に分類する', () => {
    expect(classifyStructure(-3)).toBe('地下');
    expect(classifyStructure(-2)).toBe('地上');
    expect(classifyStructure(0)).toBe('地上');
    expect(classifyStructure(2)).toBe('地上');
    expect(classifyStructure(3)).toBe('高架');
  });
});
