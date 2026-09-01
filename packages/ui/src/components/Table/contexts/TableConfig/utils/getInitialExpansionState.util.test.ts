import { describe, expect, it } from 'vite-plus/test';

import { getInitialExpansionState } from './getInitialExpansionState.util';

describe('getInitialExpansionState', () => {
  it('starts with nothing folded away from the default, which is expanded', () => {
    expect(getInitialExpansionState()).toStrictEqual({
      defaultFold: 'expanded',
      toggledGroupPaths: new Set<string>(),
    });
  });

  it("takes the reader's default and still starts with no exception to it", () => {
    expect(
      getInitialExpansionState({ defaultFold: 'collapsed' }),
    ).toStrictEqual({
      defaultFold: 'collapsed',
      toggledGroupPaths: new Set<string>(),
    });
  });

  it('hands every call its own set, so two tables cannot collapse each other', () => {
    const first = getInitialExpansionState();
    const second = getInitialExpansionState();

    expect(first.toggledGroupPaths).not.toBe(second.toggledGroupPaths);

    (first.toggledGroupPaths as Set<string>).add('grp:[["city","Paris"]]');

    expect(second.toggledGroupPaths.size).toBe(0);
  });
});
