import { EXCLUDED_COLUMNS, SQL_TYPE_NAMES } from './queries.constants.ts';

const IDENTIFIER = /(\.?)([a-z_][a-z\d_]*)/gi;

export const excludedColumnsNamed = (sql: string) => {
  const tokens = sql
    .matchAll(IDENTIFIER)
    .map(([, dot, name = '']) => ({
      isQualified: dot === '.',
      name: name.toLowerCase(),
    }))
    .filter(
      ({ isQualified, name }) =>
        isQualified || !(SQL_TYPE_NAMES as readonly string[]).includes(name),
    )
    .toArray();
  const named = new Set(tokens.map(({ name }) => name));

  return EXCLUDED_COLUMNS.filter((qualified) =>
    named.has(qualified.split('.', 2)[1] ?? qualified),
  );
};
