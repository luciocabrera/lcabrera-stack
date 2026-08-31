import { describe, expect, it } from 'vite-plus/test';

import { resolveFoldAllTarget } from './resolveFoldAllTarget.util';

const foldableGroupPaths = new Set(['["a"]', '["b"]']);

describe('resolveFoldAllTarget', () => {
  it('empties the set to open everything under an expanded default', () => {
    expect(
      resolveFoldAllTarget({
        defaultFold: 'expanded',
        foldableGroupPaths,
        isExpanded: true,
      }).size,
    ).toBe(0);
  });

  it('names every foldable path to close everything under an expanded default', () => {
    expect(
      resolveFoldAllTarget({
        defaultFold: 'expanded',
        foldableGroupPaths,
        isExpanded: false,
      }),
    ).toBe(foldableGroupPaths);
  });

  it('names every foldable path to open everything under a collapsed default', () => {
    expect(
      resolveFoldAllTarget({
        defaultFold: 'collapsed',
        foldableGroupPaths,
        isExpanded: true,
      }),
    ).toBe(foldableGroupPaths);
  });

  it('empties the set to close everything under a collapsed default', () => {
    expect(
      resolveFoldAllTarget({
        defaultFold: 'collapsed',
        foldableGroupPaths,
        isExpanded: false,
      }).size,
    ).toBe(0);
  });
});
