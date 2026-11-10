import { describe, expect, it } from 'vite-plus/test';

import { adjudicationVerdictsQuery } from './adjudicationVerdictsQuery.util.ts';

const VERDICT_COLUMNS = [
  'agent_prompt_hash',
  'case_id',
  'cost_usd',
  'duration_ms',
  'model',
  'tokens_in',
  'tokens_out',
  'verdict',
  'verifier_role',
].map((column) => `adjudication_verdict.${column}`);

describe('adjudicationVerdictsQuery', () => {
  it('reads every verdict with its cost as a number, never its evidence', () => {
    const { text, values } = adjudicationVerdictsQuery({
      publicColumns: new Set(VERDICT_COLUMNS),
    });

    expect(values).toEqual([]);
    expect(text).toContain('verdict.cost_usd::double precision as "costUsd"');
    expect(text).not.toContain('evidence');
    expect(text).toMatch(
      /order by verdict\.case_id, verdict\.verifier_role, verdict\.model$/u,
    );
  });

  it('stops at a model that is no longer public', () => {
    expect(() =>
      adjudicationVerdictsQuery({
        publicColumns: new Set(
          VERDICT_COLUMNS.filter((column) => !column.endsWith('.model')),
        ),
      }),
    ).toThrow(/adjudication_verdict\.model is not on the public allow-list/u);
  });
});
