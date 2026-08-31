import { OLAP_GROUP_ROW_FIELD } from '@lcabrera/api/olap/olap.constants';

import type { AggregateFn } from '../group-query-builder/group-query-builder.types';
import type { GroupKeyTruncation } from './olap.types';

import { toGroupLabel } from './to-group-label.util';
import { toGroupPeriodLabel } from './to-group-period-label.util';

type GroupRowAggregate = {
  readonly alias: string;
  readonly columnKey: string;
  readonly fn: AggregateFn;
};

type IsKeyRolledUpArgs = {
  readonly index: number;
  readonly keyCount: number;
  readonly mask: number;
};

type ToGroupRowArgs = {
  readonly aggregates: readonly GroupRowAggregate[];
  readonly columnKeys: readonly string[];
  readonly countAlias: string;
  readonly maskAlias: string;
  readonly row: Record<string, unknown>;
  readonly truncations?: Readonly<Record<string, GroupKeyTruncation>>;
};

const isKeyRolledUp = ({ index, keyCount, mask }: IsKeyRolledUpArgs) =>
  Math.trunc(mask / 2 ** (keyCount - 1 - index)) % 2 === 1;

export const toGroupRow = ({
  aggregates,
  columnKeys,
  countAlias,
  maskAlias,
  row,
  truncations,
}: ToGroupRowArgs) => {
  const count = Number(row[countAlias]);
  const mask = Number(row[maskAlias]);
  const groupingMask = Number.isFinite(mask) ? mask : 0;

  const groupedKeys = columnKeys.filter(
    (_columnKey, index) =>
      !isKeyRolledUp({
        index,
        keyCount: columnKeys.length,
        mask: groupingMask,
      }),
  );

  return {
    [OLAP_GROUP_ROW_FIELD]: {
      aggregates: aggregates.map(({ alias, columnKey, fn }) => ({
        columnKey,
        fn,
        value: row[alias],
      })),
      count: Number.isFinite(count) ? count : 0,
      isSubtotal: groupedKeys.length < columnKeys.length,
      path: groupedKeys.map((columnKey) => {
        const truncation = truncations?.[columnKey];
        const value = row[columnKey];
        const periodLabel =
          truncation === undefined
            ? undefined
            : toGroupPeriodLabel({ ...truncation, value });

        return {
          columnKey,
          label: periodLabel ?? toGroupLabel(value),
          value,
        };
      }),
    },
  };
};
