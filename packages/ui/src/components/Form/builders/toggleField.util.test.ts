import { describe, expect, it } from 'vite-plus/test';

import { toggleField } from './toggleField.util';

type TestValues = {
  readonly isGift: boolean;
  readonly isRushOrder: boolean;
};

describe('toggleField', () => {
  it('builds a boolean toggle field', () => {
    expect(
      toggleField<TestValues>({ accessor: 'isRushOrder', label: 'Rush order' }),
    ).toStrictEqual({
      accessor: 'isRushOrder',
      label: 'Rush order',
      type: 'boolean',
      variant: 'toggle',
    });
  });
});
