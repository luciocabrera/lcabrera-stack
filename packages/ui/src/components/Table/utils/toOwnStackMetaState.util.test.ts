import { describe, expect, it } from 'vite-plus/test';

import { toOwnStackMetaState } from './toOwnStackMetaState.util';

describe('toOwnStackMetaState', () => {
  it('names the rows after the title', () => {
    expect(toOwnStackMetaState('Orders')).toStrictEqual({
      title: { plural: 'Orders', singular: 'Row' },
    });
  });

  it('sets nothing without a title', () => {
    expect(toOwnStackMetaState(undefined)).toStrictEqual({});
  });
});
