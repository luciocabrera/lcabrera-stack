import { sqlWithoutTypes } from './sqlWithoutTypes.util.ts';

type ColumnsNamedArgs = {
  readonly columns: readonly string[];
  readonly sql: string;
};

const IDENTIFIER = /[a-z_][a-z\d_]*/gi;

export const columnsNamed = ({ columns, sql }: ColumnsNamedArgs) => {
  const named = new Set(sqlWithoutTypes(sql).toLowerCase().match(IDENTIFIER));

  return columns.filter((qualified) =>
    named.has(qualified.split('.', 2)[1] ?? qualified),
  );
};
