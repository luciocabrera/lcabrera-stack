import { describe, expect, it } from 'vite-plus/test';

import { columnsNamed } from './columnsNamed.util.ts';
import { EXCLUDED_COLUMNS } from './queries.constants.ts';

const excluded = (sql: string) =>
  columnsNamed({ columns: EXCLUDED_COLUMNS, sql });

describe('columnsNamed', () => {
  it('names an excluded column selected bare or qualified', () => {
    expect(
      excluded(
        'select trial.transcript_uri, detail from evals.eval_trial trial',
      ),
    ).toEqual(['eval_trial.transcript_uri', 'eval_trial_detail.detail']);
  });

  it('names a bare column whose name is also a type', () => {
    expect(excluded('select text from evals.eval_annotation')).toEqual([
      'eval_annotation.text',
    ]);
    expect(
      excluded('select at, kind, text from evals.eval_annotation'),
    ).toEqual(['eval_annotation.text']);
  });

  it('ignores a type that appears only in a cast or a function header', () => {
    expect(excluded('select a::text, b::text[] from x')).toEqual([]);
    expect(
      excluded(
        'CREATE FUNCTION f(a text)\n RETURNS TABLE(suite text)\nAS $function$ select suite from x $function$',
      ),
    ).toEqual([]);
  });

  it('ignores a column whose name only starts like an excluded one', () => {
    expect(excluded('select content_hash, actor_count from evals.x')).toEqual(
      [],
    );
  });
});
