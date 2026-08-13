import { describe, expect, it } from 'vite-plus/test';

import { getInitialExpansionState } from './getInitialExpansionState.util';

describe('getInitialExpansionState', () => {
  it('starts with nothing collapsed, so a grouped read paints every level it returned', () => {
    expect(getInitialExpansionState()).toStrictEqual({
      collapsedGroupPaths: new Set<string>(),
    });
  });

  it('hands every call its own set, so two tables cannot collapse each other', () => {
    // The discriminating assertion, and the reason this is a function rather
    // than a module constant: a shared `Set` is mutable state two mounted
    // Tables would both write through, so collapsing a group in one would fold
    // the same path in the other.
    const first = getInitialExpansionState();
    const second = getInitialExpansionState();

    expect(first.collapsedGroupPaths).not.toBe(second.collapsedGroupPaths);

    (first.collapsedGroupPaths as Set<string>).add('grp:[["city","Paris"]]');

    expect(second.collapsedGroupPaths.size).toBe(0);
  });
});
