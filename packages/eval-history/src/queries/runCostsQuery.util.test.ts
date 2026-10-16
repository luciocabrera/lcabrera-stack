import { describe, expect, it } from 'vite-plus/test';

import { columnsNamed } from './columnsNamed.util.ts';
import { EXCLUDED_COLUMNS } from './queries.constants.ts';
import { runCostsQuery } from './runCostsQuery.util.ts';

const publicColumns = new Set([
  ...['model_id', 'run_id', 'started_at', 'suite'].map(
    (column) => `eval_run.${column}`,
  ),
  ...['id', 'kind', 'name'].map((column) => `eval_subject.${column}`),
  'eval_subject_version.id',
  'eval_subject_version.subject_id',
  ...[
    'cost_usd_reported',
    'duration_ms',
    'id',
    'run_id',
    'subject_version_id',
    'tokens_cache_read',
    'tokens_cache_write',
    'tokens_in',
    'tokens_out',
  ].map((column) => `eval_trial.${column}`),
  ...[
    'model_id',
    'usd_per_mtok_cache_read',
    'usd_per_mtok_cache_write',
    'usd_per_mtok_in',
    'usd_per_mtok_out',
    'valid_from',
  ].map((column) => `model_price.${column}`),
]);

describe('runCostsQuery', () => {
  it('keys each grouping by its own columns', () => {
    expect(
      runCostsQuery({ groupBy: 'run', perSuite: 30, publicColumns }).text,
    ).toContain('group by priced.run_id, priced.suite');
    expect(
      runCostsQuery({ groupBy: 'suite', perSuite: 30, publicColumns }).text,
    ).toContain('group by priced.suite\n');
    expect(
      runCostsQuery({ groupBy: 'subject', perSuite: 30, publicColumns }).text,
    ).toContain('group by subject.kind::text, subject.name');
  });

  it('scopes every grouping to the recent runs of each suite', () => {
    const query = runCostsQuery({
      groupBy: 'suite',
      perSuite: 12,
      publicColumns,
    });

    expect(query.values).toEqual([12]);
    expect(query.text).toContain('where ranked.recency <= $1');
  });

  it('prices a trial from the price in force when its run started', () => {
    const { text } = runCostsQuery({
      groupBy: 'run',
      perSuite: 30,
      publicColumns,
    });

    expect(text).toContain(
      'where price.model_id = run.model_id and price.valid_from <= run.started_at',
    );
    expect(text).toContain('order by price.valid_from desc');
  });

  it('keeps the reported and the computed cost apart', () => {
    const { text } = runCostsQuery({
      groupBy: 'run',
      perSuite: 30,
      publicColumns,
    });

    expect(text).toContain('sum(priced.cost_usd_reported)');
    expect(text).toContain('sum(priced.cost_usd_computed)');
    expect(text).not.toContain('coalesce(sum(');
  });

  it('reads the base tables only through their projections', () => {
    const { text } = runCostsQuery({
      groupBy: 'subject',
      perSuite: 30,
      publicColumns,
    });

    expect(text).not.toMatch(/from evals\.\w+ (?!\))/u);
    expect(columnsNamed({ columns: EXCLUDED_COLUMNS, sql: text })).toEqual([]);
  });

  it('refuses to build when a price column stops being public', () => {
    const narrowed = new Set(publicColumns);

    narrowed.delete('model_price.usd_per_mtok_out');

    expect(() =>
      runCostsQuery({ groupBy: 'run', perSuite: 30, publicColumns: narrowed }),
    ).toThrow('model_price.usd_per_mtok_out is not on the public allow-list');
  });
});
