import type { QueryRefusalReason } from './errors.types.ts';

type QueryRefusedErrorArgs<TReason extends string> = {
  readonly cause?: unknown;
  readonly column?: string;
  readonly message: string;
  readonly reason: TReason;
};

export class QueryRefusedError<
  TReason extends string = QueryRefusalReason,
> extends Error {
  public readonly column: string | undefined;
  public readonly reason: TReason;

  public constructor({
    cause,
    column,
    message,
    reason,
  }: QueryRefusedErrorArgs<TReason>) {
    super(message, { cause });
    this.name = 'QueryRefusedError';
    this.reason = reason;
    this.column = column;
  }
}
