import type { GroupingRefusalReason } from './errors.types.ts';

type GroupingRefusedErrorArgs = {
  readonly cause?: unknown;
  readonly column?: string;
  readonly estimatedRows?: number;
  readonly message: string;
  readonly reason: GroupingRefusalReason;
};

/**
 * Deliberately **not** a `PersistenceError`: nothing here came from the driver, there are
 * no pg diagnostics to carry, and most of these are raised before any connection is
 * borrowed.
 * Widening `PersistenceError` to cover them would make `instanceof PersistenceError` stop
 * meaning "the database rejected this", which is the one thing it is for (ADR-050).
 */
export class GroupingRefusedError extends Error {
  public readonly column: string | undefined;
  public readonly estimatedRows: number | undefined;
  public readonly reason: GroupingRefusalReason;

  public constructor({
    cause,
    column,
    estimatedRows,
    message,
    reason,
  }: GroupingRefusedErrorArgs) {
    super(message, { cause });
    this.name = 'GroupingRefusedError';
    this.reason = reason;
    this.column = column;
    this.estimatedRows = estimatedRows;
  }
}
