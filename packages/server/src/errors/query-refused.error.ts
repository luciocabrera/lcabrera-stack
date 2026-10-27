import type { QueryRefusalReason } from './errors.types.ts';

type QueryRefusedErrorArgs = {
  readonly column?: string;
  readonly message: string;
  readonly reason: QueryRefusalReason;
};

export class QueryRefusedError extends Error {
  public readonly column: string | undefined;
  public readonly reason: QueryRefusalReason;

  public constructor({ column, message, reason }: QueryRefusedErrorArgs) {
    super(message);
    this.name = 'QueryRefusedError';
    this.reason = reason;
    this.column = column;
  }
}
