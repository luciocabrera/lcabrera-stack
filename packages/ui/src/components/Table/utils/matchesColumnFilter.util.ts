import type { ColumnFilter } from '#ui/types/filterOperators.types';

import { isEmptyCellValue } from '#ui/components/Table/cellRenderers/isEmptyCellValue.util';

import { matchesDateFilter } from './matchesDateFilter.util';
import { matchesNumberFilter } from './matchesNumberFilter.util';
import { matchesSelectFilter } from './matchesSelectFilter.util';
import { matchesTextFilter } from './matchesTextFilter.util';
import { toCellText } from './toCellText.util';

type MatchesColumnFilterArgs = {
  readonly filter: ColumnFilter;
  readonly value: unknown;
};

export const matchesColumnFilter = ({
  filter,
  value,
}: MatchesColumnFilterArgs) => {
  switch (filter.type) {
    case 'boolean': {
      return (
        !isEmptyCellValue(value) && toCellText(value) === String(filter.value)
      );
    }
    case 'date': {
      return matchesDateFilter({ filter, value });
    }
    case 'empty': {
      const isEmpty = (value ?? undefined) === undefined;

      return filter.operator === 'isEmpty' ? isEmpty : !isEmpty;
    }
    case 'number': {
      return matchesNumberFilter({ filter, value });
    }
    case 'text': {
      return matchesTextFilter({ filter, value });
    }
    default: {
      return matchesSelectFilter({ filter, value });
    }
  }
};
