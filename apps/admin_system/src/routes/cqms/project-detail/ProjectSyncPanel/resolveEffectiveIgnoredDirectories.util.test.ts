import { describe, expect, it } from 'vitest';

import { resolveEffectiveIgnoredDirectories } from './resolveEffectiveIgnoredDirectories.util';

const baseIgnored = new Set(['.git', 'build', 'dist', 'node_modules']);

describe('resolveEffectiveIgnoredDirectories', () => {
  it('excludes node_modules by default (returns the base set)', () => {
    const result = resolveEffectiveIgnoredDirectories({
      baseIgnored,
      includeNodeModules: false,
    });
    expect(result.has('node_modules')).toBe(true);
    expect(result).toBe(baseIgnored);
  });

  it('drops only node_modules when opting it in, keeping the rest ignored', () => {
    const result = resolveEffectiveIgnoredDirectories({
      baseIgnored,
      includeNodeModules: true,
    });
    expect(result.has('node_modules')).toBe(false);
    expect(result.has('.git')).toBe(true);
    expect(result.has('dist')).toBe(true);
    expect(result.has('build')).toBe(true);
  });

  it('never mutates the shared base set', () => {
    resolveEffectiveIgnoredDirectories({
      baseIgnored,
      includeNodeModules: true,
    });
    expect(baseIgnored.has('node_modules')).toBe(true);
  });
});
