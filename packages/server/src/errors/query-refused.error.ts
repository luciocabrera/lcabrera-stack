import type {
  GroupingRefusalReason,
  QueryRefusalReason,
} from './errors.types.ts';

type QueryRefusedErrorArgs = {
  readonly cause?: unknown;
  readonly column?: string;
  readonly message: string;
  readonly reason: GroupingRefusalReason | QueryRefusalReason;
};

export class QueryRefusedError extends Error {
  public readonly column: string | undefined;
  public readonly reason: GroupingRefusalReason | QueryRefusalReason;

  public constructor({
    cause,
    column,
    message,
    reason,
  }: QueryRefusedErrorArgs) {
    super(message, { cause });
    this.name = 'QueryRefusedError';
    this.reason = reason;
    this.column = column;
  }
}
