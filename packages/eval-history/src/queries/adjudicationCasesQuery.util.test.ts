import { describe, expect, it } from 'vite-plus/test';

import { adjudicationCasesQuery } from './adjudicationCasesQuery.util.ts';

const CASE_COLUMNS = [
  'analyzer',
  'builder_model',
  'case_id',
  'created_at',
  'outcome',
  'pr',
  'rule',
].map((column) => `adjudication_case.${column}`);

const TRUTH_COLUMNS = ['case_id', 'id', 'recorded_at', 'source', 'truth'].map(
  (column) => `adjudication_ground_truth.${column}`,
);

describe('adjudicationCasesQuery', () => {
  const { text, values } = adjudicationCasesQuery({
    publicColumns: new Set([...CASE_COLUMNS, ...TRUTH_COLUMNS]),
  });

  it('reads every case newest first, with its latest true answer', () => {
    expect(values).toEqual([]);
    expect(text).toContain('left join lateral');
    expect(text).toContain(
      'order by ground_truth.recorded_at desc, ground_truth.id desc\n  limit 1',
    );
    expect(text).toMatch(
      /order by adjudication\.created_at desc, adjudication\.case_id desc$/u,
    );
  });

  it('stops at a builder model that is no longer public', () => {
    expect(() =>
      adjudicationCasesQuery({
        publicColumns: new Set([
          ...CASE_COLUMNS.filter((column) => !column.endsWith('builder_model')),
          ...TRUTH_COLUMNS,
        ]),
      }),
    ).toThrow(/builder_model is not on the public allow-list/u);
  });

  it('stops at a true answer that is no longer public', () => {
    expect(() =>
      adjudicationCasesQuery({
        publicColumns: new Set([
          ...CASE_COLUMNS,
          ...TRUTH_COLUMNS.filter((column) => !column.endsWith('truth')),
        ]),
      }),
    ).toThrow(/adjudication_ground_truth\.truth is not on the public/u);
  });
});
