import type { ColumnFiltersState } from '@/components/Table';
import type { ColumnFilter } from '@/types/filterOperators.types';

import { OPERATOR_TO_SHORT } from '@/constants/filterOperators.constants';

type CompactFilterValue = boolean | unknown[];

const getSerializedOperator = (operator: string): string =>
  OPERATOR_TO_SHORT[operator] ?? operator;

const serializeBooleanFilter = ({
  filter,
}: {
  readonly filter: Extract<ColumnFilter, { readonly type: 'boolean' }>;
}): CompactFilterValue => filter.value;

const serializeDateFilter = ({
  filter,
}: {
  readonly filter: Extract<ColumnFilter, { readonly type: 'date' }>;
}): CompactFilterValue => {
  const op = getSerializedOperator(filter.operator);

  if (filter.operator === 'between' && filter.value2) {
    return [op, filter.value, filter.value2];
  }

  return [op, filter.value];
};

const serializeSelectFilter = ({
  filter,
}: {
  readonly filter: Extract<
    ColumnFilter,
    { readonly type: 'multiSelect' | 'select' }
  >;
}): CompactFilterValue => {
  const values = filter.values ?? (filter.value ? [filter.value] : []);

  if (filter.operator === 'notEquals') {
    return ['!', ...values];
  }

  return values;
};

const serializeNumberFilter = ({
  filter,
}: {
  readonly filter: Extract<ColumnFilter, { readonly type: 'number' }>;
}): CompactFilterValue => {
  const op = getSerializedOperator(filter.operator);

  if (filter.operator === 'between' && filter.value2 !== undefined) {
    return [op, filter.value, filter.value2];
  }

  return [op, filter.value];
};

const serializeTextFilter = ({
  filter,
}: {
  readonly filter: Extract<ColumnFilter, { readonly type: 'text' }>;
}): CompactFilterValue => {
  const op = getSerializedOperator(filter.operator);

  return [op, filter.value];
};

const serializeFilter = ({
  filter,
}: {
  readonly filter: ColumnFilter;
}): CompactFilterValue => {
  switch (filter.type) {
    case 'boolean': {
      return serializeBooleanFilter({ filter });
    }
    case 'date': {
      return serializeDateFilter({ filter });
    }
    case 'multiSelect':
    case 'select': {
      return serializeSelectFilter({ filter });
    }
    case 'number': {
      return serializeNumberFilter({ filter });
    }
    case 'text': {
      return serializeTextFilter({ filter });
    }
  }
};

/**
 * Serialize ColumnFiltersState to a compact URL-friendly string.
 *
 * Removes redundant `type` keys and uses short operator codes.
 * Returns undefined when there are no filters.
 */
export const serializeFiltersToURL = (
  filters: ColumnFiltersState,
): string | undefined => {
  const entries = Object.entries(filters);
  if (entries.length === 0) return undefined;

  const compact = Object.fromEntries(
    entries.map(([columnKey, filter]) => [
      columnKey,
      serializeFilter({ filter }),
    ]),
  );

  return JSON.stringify(compact);
};
