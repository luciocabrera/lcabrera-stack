import type { ColumnReference } from './query-builder.types.ts';

type IsSameColumnReferenceArgs = {
  readonly left: ColumnReference;
  readonly right: ColumnReference;
};

export const isSameColumnReference = ({
  left,
  right,
}: IsSameColumnReferenceArgs) =>
  typeof left === 'string' || typeof right === 'string'
    ? left === right
    : left.source === right.source && left.column === right.column;
