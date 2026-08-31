import { describe, expect, it } from 'vite-plus/test';

import {
  diffSurfaces,
  hasBreakingChange,
  isBreakingChange,
} from './api-surface-diff.mjs';

const surface = (entries) => entries;

describe('diffSurfaces', () => {
  it('reports an added export as additive', () => {
    const changes = diffSurfaces({
      base: surface({ './a': { foo: '[const] () => void' } }),
      next: surface({
        './a': { bar: '[type] string', foo: '[const] () => void' },
      }),
    });
    expect(changes).toEqual([
      {
        kind: 'added',
        name: 'bar',
        signature: '[type] string',
        subpath: './a',
      },
    ]);
    expect(hasBreakingChange(changes)).toBe(false);
  });

  it('reports a removed export as breaking', () => {
    const changes = diffSurfaces({
      base: surface({ './a': { foo: '[const] () => void' } }),
      next: surface({ './a': {} }),
    });
    expect(changes).toEqual([{ kind: 'removed', name: 'foo', subpath: './a' }]);
    expect(hasBreakingChange(changes)).toBe(true);
  });

  it('reports a changed signature as breaking, carrying both sides', () => {
    const changes = diffSurfaces({
      base: surface({ './a': { foo: '[const] (x: string) => void' } }),
      next: surface({ './a': { foo: '[const] (x: number) => void' } }),
    });
    expect(changes).toEqual([
      {
        from: '[const] (x: string) => void',
        kind: 'changed',
        name: 'foo',
        signature: '[const] (x: number) => void',
        subpath: './a',
      },
    ]);
    expect(hasBreakingChange(changes)).toBe(true);
  });

  it('treats a whole removed subpath as removed exports', () => {
    const changes = diffSurfaces({
      base: surface({ './gone': { a: '[type] 1', b: '[type] 2' } }),
      next: surface({}),
    });
    expect(changes.map((c) => c.kind)).toEqual(['removed', 'removed']);
  });

  it('lists every change, sorted by subpath then name', () => {
    const changes = diffSurfaces({
      base: surface({ './b': { z: '[type] 1' } }),
      next: surface({ './a': { m: '[type] 2' }, './b': {} }),
    });
    expect(changes.map((c) => `${c.subpath}:${c.name}`)).toEqual([
      './a:m',
      './b:z',
    ]);
  });

  it('flags a value→type flip as a change', () => {
    const changes = diffSurfaces({
      base: surface({ './a': { X: '[const] 1' } }),
      next: surface({ './a': { X: '[type] 1' } }),
    });
    expect(changes[0].kind).toBe('changed');
    expect(isBreakingChange(changes[0])).toBe(true);
  });
});
