import type { SortingState } from '@lcabrera/ui/components/Table';

import type { SkillScoreRow } from './SkillScores.types';

type SortSkillScoreRowsArgs = {
  readonly rows: readonly SkillScoreRow[];
  readonly sorting: SortingState<SkillScoreRow>;
};

export const sortSkillScoreRows = ({ rows, sorting }: SortSkillScoreRowsArgs) =>
  rows.toSorted((left, right) => {
    const leftFields: Readonly<Record<string, unknown>> = left;
    const rightFields: Readonly<Record<string, unknown>> = right;

    for (const { columnKey, direction = 'asc' } of sorting) {
      const a = leftFields[columnKey];
      const b = rightFields[columnKey];
      const order =
        typeof a === 'number' && typeof b === 'number'
          ? a - b
          : String(a).localeCompare(String(b));

      if (order !== 0) return direction === 'asc' ? order : -order;
    }

    return 0;
  });
