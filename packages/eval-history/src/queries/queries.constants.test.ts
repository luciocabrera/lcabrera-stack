import { describe, expect, it } from 'vite-plus/test';

import { excludedColumnsNamed } from './excludedColumnsNamed.util.ts';
import { flakyTasksQuery } from './flakyTasksQuery.util.ts';
import { REPORTING_RELATIONS } from './queries.constants.ts';
import { runCompareQuery } from './runCompareQuery.util.ts';
import { subjectTrendQuery } from './subjectTrendQuery.util.ts';
import { taskPassRatesQuery } from './taskPassRatesQuery.util.ts';

const GENERATED = [
  taskPassRatesQuery({ runId: 'run-a' }),
  subjectTrendQuery({ kind: 'skill', limit: 30, name: 'react-19' }),
  flakyTasksQuery({ disagreeFraction: 0.2, window: 10 }),
  runCompareQuery({ a: 'run-a', b: 'run-b' }),
].map(({ text }) => text);

const PRIVATE_TEXT_PREFIXES = [
  'transcript',
  'detail',
  'reply',
  'summary',
  'feedback',
  'settings',
  'argv',
  'env',
];

const words = (sql: string) =>
  sql.toLowerCase().match(/[a-z_][a-z\d_]*/g) ?? [];

describe('the generated reporting SQL', () => {
  it.each(GENERATED)('names no excluded column: %s', (sql) => {
    expect(excludedColumnsNamed(sql)).toEqual([]);
  });

  it.each(GENERATED)('names no transcript or judge-reply field: %s', (sql) => {
    expect(
      words(sql).filter((word) =>
        PRIVATE_TEXT_PREFIXES.some((prefix) => word.startsWith(prefix)),
      ),
    ).toEqual([]);
  });

  it.each(GENERATED)(
    'reads only the reporting views and functions: %s',
    (sql) => {
      const relations = sql
        .matchAll(/\bevals\.(\w+)/g)
        .map(([, name]) => name)
        .toArray();

      expect(relations).not.toEqual([]);
      expect(
        relations.filter(
          (name) =>
            !(REPORTING_RELATIONS as readonly (string | undefined)[]).includes(
              name,
            ),
        ),
      ).toEqual([]);
    },
  );
});
