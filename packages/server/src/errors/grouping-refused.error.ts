import type { GroupingRefusalReason } from './errors.types.ts';

import { QueryRefusedError } from './query-refused.error.ts';

type GroupingRefusedErrorArgs = {
  readonly cause?: unknown;
  readonly column?: string;
  readonly estimatedRows?: number;
  readonly message: string;
  readonly reason: GroupingRefusalReason;
};

export class GroupingRefusedError extends QueryRefusedError {
  public readonly estimatedRows: number | undefined;
  declare public readonly reason: GroupingRefusalReason;

  public constructor({ estimatedRows, ...refusal }: GroupingRefusedErrorArgs) {
    super(refusal);
    this.name = 'GroupingRefusedError';
    this.estimatedRows = estimatedRows;
  }
}
