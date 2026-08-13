import type { GroupingRefusalReason } from './errors.types.ts';

type GroupingRefusedErrorArgs = {
  /**
   * The rejection this replaces, when it replaces one — the shared identifier
   * and allow-list assertions throw a bare `Error`, and the refusal that wraps
   * them keeps it here for a server log.
   */
  readonly cause?: unknown;
  /** The column the refusal is about, when exactly one is. */
  readonly column?: string;
  /** The pre-flight row bound, when a bound is what refused the request. */
  readonly estimatedRows?: number;
  readonly message: string;
  readonly reason: GroupingRefusalReason;
};

/**
 * A grouped read this package refused to run — depth, an illegal key or
 * aggregate, or a result bound past the ceiling.
 *
 * Deliberately **not** a `PersistenceError`: nothing here came from the driver,
 * there are no pg diagnostics to carry, and most of these are raised before any
 * connection is borrowed. Widening `PersistenceError` to cover them would make
 * `instanceof PersistenceError` stop meaning "the database rejected this",
 * which is the one thing it is for (ADR-050).
 *
 * `reason` exists so the loader edge has something to map on that is not the
 * message: `toSerializableDbError` turns it into a plain union member, because
 * this class — like every other — is silently flattened by React Router single
 * fetch (ADR-066).
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
