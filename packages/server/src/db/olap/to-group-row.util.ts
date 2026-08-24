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
  /**
   * The alias comes from the builder's own result rather than being spelled here, so the
   * name the SQL projected and the name this decodes by are one string.
   */
  readonly aggregates: readonly GroupRowAggregate[];
  readonly columnKeys: readonly string[];
  readonly countAlias: string;
  /** The alias the builder projected `GROUPING(k₁, …, kₙ)` under. */
  readonly maskAlias: string;
  readonly row: Record<string, unknown>;
  /** How each truncated key was derived, by column. Absent for an untruncated grouping. */
  readonly truncations?: Readonly<Record<string, GroupKeyTruncation>>;
};

/** `GROUPING()` puts the first key in the MSB, so key `i` owns `2 ** (n - 1 - i)`. */
const isKeyRolledUp = ({ index, keyCount, mask }: IsKeyRolledUpArgs) =>
  Math.trunc(mask / 2 ** (keyCount - 1 - index)) % 2 === 1;

/**
 * Decode `GROUPING()` here (ADR-082): a set bit means "not keyed by that column", never
 * "no value here".
 */
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
  // A mask that did not arrive as a number decodes as "nothing rolled up" —
  // the flat reading, and the only one that cannot invent a subtotal.
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
