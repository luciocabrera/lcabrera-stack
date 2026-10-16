import { describe, expect, it } from 'vite-plus/test';

import { toTrialSorting } from './toTrialSorting.util';

describe('toTrialSorting', () => {
  it('renames the table sorting to the shape the trial query takes', () => {
    expect(
      toTrialSorting([
        { columnKey: 'durationMs', direction: 'desc' },
        { columnKey: 'taskKey', direction: 'asc' },
      ]),
    ).toEqual([
      { column: 'durationMs', direction: 'desc' },
      { column: 'taskKey', direction: 'asc' },
    ]);
  });

  it('drops an entry without a direction', () => {
    expect(toTrialSorting([{ columnKey: 'turns' }])).toEqual([]);
  });
});
