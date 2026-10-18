import { describe, expect, it } from 'vite-plus/test';

import { judgeAgreementQuery } from '../grades/judgeAgreementQuery.util.ts';
import { columnsNamed } from './columnsNamed.util.ts';
import { flakyTasksQuery } from './flakyTasksQuery.util.ts';
import {
  EXCLUDED_COLUMNS,
  PUBLIC_FIELD_PATHS,
  PUBLIC_JSONB_COLUMNS,
  REPORTING_RELATIONS,
} from './queries.constants.ts';
import { runCompareQuery } from './runCompareQuery.util.ts';
import { subjectTrendQuery } from './subjectTrendQuery.util.ts';
import { taskPassRatesQuery } from './taskPassRatesQuery.util.ts';

const GENERATED = [
  taskPassRatesQuery({ runId: 'run-a' }),
  subjectTrendQuery({ kind: 'skill', limit: 30, name: 'react-19' }),
  flakyTasksQuery({ disagreeFraction: 0.2, window: 10 }),
  runCompareQuery({ a: 'run-a', b: 'run-b' }),
  judgeAgreementQuery(),
].map(({ text }) => text);

describe('the generated reporting SQL', () => {
  it.each(GENERATED)('names no excluded column: %s', (sql) => {
    expect(columnsNamed({ columns: EXCLUDED_COLUMNS, sql })).toEqual([]);
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

describe('the public jsonb copies', () => {
  it('give every jsonb column with an allowed field a public copy, and no other', () => {
    const sources = new Set(
      PUBLIC_FIELD_PATHS.map((path) => path.split('.', 2).join('.')),
    );

    expect(new Set(Object.keys(PUBLIC_JSONB_COLUMNS))).toEqual(sources);
  });
});
