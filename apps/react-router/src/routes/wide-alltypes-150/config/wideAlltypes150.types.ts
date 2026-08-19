import type { GroupCardinalityWarning } from '@lcabrera/server/db/group-query-builder/group-query-builder.types';
import type { SerializableDbError } from '@lcabrera/server/errors/errors.types';
import type { TableGroupRow } from '@lcabrera/ui/components/Table/Table.types';

import type { WideAlltypes150 } from '@/services';

/**
 * A group row of this table, typed so it cannot be read as a data row.
 *
 * Declaring every data column as `never` is what makes the union below
 * discriminated: reading a column off a row TypeScript has not narrowed is an
 * error rather than a silent `T | undefined`. Same shape the enterprise-orders
 * route uses, and deliberately restated rather than shared — the two tables have
 * different row types and the only thing in common is the pattern.
 */
export type WideAlltypes150GroupRow = TableGroupRow & {
  readonly [K in keyof WideAlltypes150]?: never;
};

/**
 * What this route's reads answer with, grouped or not.
 *
 * Wider than the external endpoint's `WideAlltypes150Response`, and only on the
 * self-hosted path: grouping reaches Postgres in this process, so an external
 * deployment never produces these fields and never declares the capability that
 * would ask for them.
 */
export type WideAlltypes150TableResponse = {
  readonly data: readonly WideAlltypes150TableRow[];
  /**
   * Why a read returned nothing, as plain data. A grouped read can be refused
   * or cut off by its statement timeout, and `@lcabrera/server` raises each as a
   * class — which single fetch strips of its prototype on the way here, so the
   * loader edge maps it to a discriminant instead (ADR-050, ADR-066).
   */
  readonly error?: SerializableDbError;
  /**
   * The grouped read ran and something about it is worth saying: the estimate
   * was above the warn threshold, or the table has no statistics to estimate
   * from. The data is real either way — this is not an error.
   */
  readonly groupingWarning?: GroupCardinalityWarning;
  readonly hasMore: boolean;
  readonly total?: number;
};

/** A row as this table renders it: a data row, or a group row over them. */
export type WideAlltypes150TableRow =
  | (WideAlltypes150 & { readonly tableGroup?: never })
  | WideAlltypes150GroupRow;
