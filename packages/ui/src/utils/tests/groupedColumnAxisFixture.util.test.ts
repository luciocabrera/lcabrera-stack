import { describe, expect, it } from 'vite-plus/test';

import { collectColumnAxisEmitted } from '#ui/components/Table/utils/collectColumnAxisEmitted.util';

import { groupedColumnAxisFixture } from './groupedColumnAxisFixture.util';

describe('groupedColumnAxisFixture', () => {
  it('emits one alias per axis value', () => {
    expect(
      collectColumnAxisEmitted(groupedColumnAxisFixture.rows).map(
        (entry) => entry.alias,
      ),
    ).toStrictEqual(['sum_total_amount_c0', 'sum_total_amount_c1']);
  });
});
