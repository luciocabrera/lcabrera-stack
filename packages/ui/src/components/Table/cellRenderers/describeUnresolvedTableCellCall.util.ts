import type { TableCellCallOutcome } from './cellRenderers.types';

type DescribeUnresolvedTableCellCallArgs = {
  readonly columnKey: string;
  readonly outcome: TableCellCallOutcome;
};

export const describeUnresolvedTableCellCall = ({
  columnKey,
  outcome,
}: DescribeUnresolvedTableCellCallArgs) => {
  const prefix = `[Table] column "${columnKey}": cell kind "${outcome.kind}"`;

  if (outcome.status === 'unregistered') {
    return `${prefix} is not registered; rendering its dataType default.`;
  }

  if (outcome.status === 'invalid') {
    const reasons = outcome.issues.map((issue) => issue.message).join('; ');

    return `${prefix} has invalid params (${reasons}); rendering its dataType default.`;
  }
};
