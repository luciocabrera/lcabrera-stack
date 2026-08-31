import type { OlapDrillGroup } from '@lcabrera/api/olap/olap.types';

import type {
  QueryFilter,
  QuerySort,
} from '../query-builder/query-builder.types';
import type { GroupKeyTruncation, OlapDrillTranslation } from './olap.types';

import { AGGREGATE_SQL } from '../group-query-builder/group-query-builder.constants.ts';
import { advanceGroupPeriod } from './advance-group-period.util.ts';
import { resolveDrillRefusal } from './resolve-drill-refusal.util.ts';

type ToDrillReadArgs = {
  readonly filters: readonly QueryFilter[];
  readonly group: OlapDrillGroup;
  readonly groupKeys: readonly string[];
  readonly limit: number;
  readonly maxLimit: number;
  readonly primaryKey: string;
  readonly sort: readonly QuerySort[];
  readonly truncations?: Readonly<Record<string, GroupKeyTruncation>>;
};

const toKeyFilter = ({
  columnKey,
  value,
}: OlapDrillGroup['path'][number]): QueryFilter =>
  value === null || value === undefined
    ? { column: columnKey, operator: 'isNull' }
    : { column: columnKey, operator: 'eq', value };

const toPeriodStart = (value: unknown) => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value;
  }

  if (typeof value !== 'string' && typeof value !== 'number') return;

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const toPeriodFilters = ({
  entry,
  truncation,
}: {
  readonly entry: OlapDrillGroup['path'][number];
  readonly truncation: GroupKeyTruncation;
}): readonly QueryFilter[] => {
  const { columnKey, value } = entry;

  if (value === null || value === undefined) {
    return [{ column: columnKey, operator: 'isNull' }];
  }

  const start = toPeriodStart(value);

  if (start === undefined) {
    return [toKeyFilter(entry)];
  }

  return [
    { column: columnKey, operator: 'gte', value: start },
    {
      column: columnKey,
      operator: 'lt',
      value: advanceGroupPeriod({ ...truncation, start }),
    },
  ];
};

const isMeasureSortTerm = (column: string) => {
  const separator = column.lastIndexOf(':');

  return (
    separator > 0 && Object.hasOwn(AGGREGATE_SQL, column.slice(separator + 1))
  );
};

export const toDrillRead = ({
  filters,
  group,
  groupKeys,
  limit,
  maxLimit,
  primaryKey,
  sort,
  truncations,
}: ToDrillReadArgs): OlapDrillTranslation => {
  const refusal = resolveDrillRefusal({ group, groupKeys });

  if (refusal !== undefined) {
    return { kind: 'refused', reason: refusal };
  }

  const groupedColumns = new Set(group.path.map(({ columnKey }) => columnKey));
  const remainingSort = sort.filter(
    ({ column }) => !groupedColumns.has(column) && !isMeasureSortTerm(column),
  );
  const hasTiebreaker = remainingSort.some(
    ({ column }) => column === primaryKey,
  );

  return {
    kind: 'drillable',
    read: {
      filters: [
        ...filters,
        ...group.path.flatMap((entry) => {
          const truncation = truncations?.[entry.columnKey];

          return truncation === undefined
            ? [toKeyFilter(entry)]
            : toPeriodFilters({ entry, truncation });
        }),
      ],
      includeTotal: false,
      limit: Math.min(maxLimit, Math.max(1, limit)),
      offset: 0,
      sort: hasTiebreaker
        ? remainingSort
        : [...remainingSort, { column: primaryKey, direction: 'asc' }],
    },
  };
};
