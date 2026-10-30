import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vite-plus/test';

import { adjudicationEnvelopeSchema } from './adjudicationEnvelope.schema.ts';
import { envelopeJsonSchema } from './envelopeJsonSchema.util.ts';
import { readJsonFiles } from './readJsonFiles.service.ts';

const files = await readJsonFiles({
  directory: fileURLToPath(new URL('.', import.meta.url)),
});

const SQL_NULL: unknown = JSON.parse('null');

const fixture = adjudicationEnvelopeSchema.parse(
  files.get('fixtures/adjudication.json'),
);
const [judge, secondJudge, adversary] = fixture.verifiers;

const issuePaths = (input: unknown) =>
  adjudicationEnvelopeSchema
    .safeParse(input)
    .error?.issues.map(({ path }) => path.join('.')) ?? [];

const withCase = (fields: object) => ({
  ...fixture,
  case: { ...fixture.case, ...fields },
});

describe('adjudicationEnvelopeSchema', () => {
  it('accepts the fixture: one case, every verifier, and its outcome', () => {
    expect(fixture.case.case_id).toBe('FP-0001');
    expect(fixture.verifiers.map(({ role }) => role)).toEqual([
      'judge',
      'judge',
      'adversary',
    ]);
    expect(fixture.outcome).toBe('dismissed');
  });

  it.each(['fixed', 'escalated'])(
    'accepts a %s case whatever its verdicts',
    (outcome) => {
      expect(
        issuePaths({
          ...fixture,
          outcome,
          verifiers: [judge, { ...adversary, verdict: 'REAL' }],
        }),
      ).toEqual([]);
    },
  );

  it('accepts a verifier that reported no cost, and a case outside a pull request', () => {
    expect(adversary?.cost_usd).toBeNull();
    expect(issuePaths(withCase({ pr: SQL_NULL }))).toEqual([]);
  });

  it.each([
    { field: 'case_id', value: 'FP-1' },
    { field: 'case_id', value: 'fp-0001' },
    { field: 'base_sha', value: 'abc' },
    { field: 'head_sha', value: '2'.repeat(41) },
    { field: 'content_hash', value: 'A'.repeat(64) },
    { field: 'created_at', value: '30 October 2026' },
    { field: 'pr', value: 0 },
    { field: 'analyzer', value: '' },
    { field: 'rule', value: '' },
    { field: 'file', value: '' },
    { field: 'finding_id', value: '' },
  ])('rejects a case whose $field is $value', ({ field, value }) => {
    expect(issuePaths(withCase({ [field]: value }))).toEqual([`case.${field}`]);
  });

  it.each([
    { field: 'role', value: 'reviewer' },
    { field: 'verdict', value: 'MAYBE' },
    { field: 'agent_prompt_hash', value: 'short' },
    { field: 'duration_ms', value: -1 },
    { field: 'tokens_in', value: 1.5 },
    { field: 'tokens_out', value: -3 },
    { field: 'cost_usd', value: -0.01 },
    { field: 'model', value: '' },
  ])('rejects a verifier whose $field is $value', ({ field, value }) => {
    expect(
      issuePaths({
        ...fixture,
        verifiers: [{ ...judge, [field]: value }, secondJudge, adversary],
      }),
    ).toEqual([`verifiers.0.${field}`]);
  });

  it('rejects an outcome it does not know, and a case with no verifier', () => {
    expect(issuePaths({ ...fixture, outcome: 'ignored' })).toEqual(['outcome']);
    expect(issuePaths({ ...fixture, verifiers: [] })).toEqual(['verifiers']);
  });

  it('rejects a schema_version it does not know', () => {
    expect(issuePaths({ ...fixture, schema_version: 2 })).toEqual([
      'schema_version',
    ]);
  });

  it('rejects a dismissal that any verifier called REAL', () => {
    expect(
      issuePaths({
        ...fixture,
        verifiers: [judge, secondJudge, { ...adversary, verdict: 'REAL' }],
      }),
    ).toEqual(['verifiers.2.verdict']);
  });

  it('rejects a split case on which every verifier agreed', () => {
    expect(issuePaths({ ...fixture, outcome: 'split' })).toEqual(['outcome']);
    expect(
      issuePaths({
        ...fixture,
        outcome: 'split',
        verifiers: [judge, { ...adversary, verdict: 'REAL' }],
      }),
    ).toEqual([]);
  });

  it('rejects the same model sitting twice in one role', () => {
    expect(
      issuePaths({ ...fixture, verifiers: [judge, judge, adversary] }),
    ).toEqual(['verifiers.1.model']);
  });
});

describe('adjudication.schema.json', () => {
  it('matches the Zod schema; run schema:write when this fails', () => {
    expect(files.get('adjudication.schema.json')).toEqual(
      envelopeJsonSchema(adjudicationEnvelopeSchema),
    );
  });
});
