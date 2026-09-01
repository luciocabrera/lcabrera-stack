import type { GroupingRefusalReason } from './errors.types.ts';

type GroupingRefusedErrorArgs = {
  readonly cause?: unknown;
  readonly column?: string;
  readonly estimatedRows?: number;
  readonly message: string;
  readonly reason: GroupingRefusalReason;
};

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
