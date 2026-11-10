import type { AdjudicationEnvelope } from '@repo/eval-history/envelope/envelope.types';

import { adjudicationEnvelopeSchema } from '@repo/eval-history/envelope/adjudicationEnvelope.schema';
import { createHash } from 'node:crypto';

type SeedCase = {
  readonly analyzer: string;
  readonly builderModel?: string;
  readonly caseId: string;
  readonly createdAt: string;
  readonly outcome: AdjudicationEnvelope['outcome'];
  readonly pr?: number;
  readonly rule: string;
  readonly verdicts: readonly [Verdict, Verdict, Verdict];
};

type SeedTruth = {
  readonly caseId: string;
  readonly source: 'lucio' | 'reopened' | 'upstream-fix';
  readonly truth: Verdict;
};

type Verdict = AdjudicationEnvelope['verifiers'][number]['verdict'];

const JSON_NULL: unknown = JSON.parse('null');

const hash = (text: string) => createHash('sha256').update(text).digest('hex');

const SEATS = [
  {
    costUsd: 0.25,
    durationMs: 36_000,
    model: 'claude-opus-5-5',
    role: 'judge',
  },
  {
    costUsd: 0.08,
    durationMs: 23_000,
    model: 'claude-sonnet-5-5',
    role: 'judge',
  },
  {
    costUsd: 1.08,
    durationMs: 90_000,
    model: 'claude-fable-5-1',
    role: 'adversary',
  },
] as const;

const GRID_RULE = 'lint/a11y/noNoninteractiveElementToInteractiveRole';

export const SEED_CASES: readonly SeedCase[] = [
  {
    analyzer: 'biome',
    builderModel: 'claude-opus-5-5',
    caseId: 'FP-0101',
    createdAt: '2026-10-20T09:00:00.000Z',
    outcome: 'dismissed',
    pr: 1594,
    rule: GRID_RULE,
    verdicts: ['FALSE_POSITIVE', 'FALSE_POSITIVE', 'FALSE_POSITIVE'],
  },
  {
    analyzer: 'fallow',
    caseId: 'FP-0102',
    createdAt: '2026-10-22T09:00:00.000Z',
    outcome: 'split',
    rule: 'complexity',
    verdicts: ['FALSE_POSITIVE', 'FALSE_POSITIVE', 'REAL'],
  },
  {
    analyzer: 'biome',
    builderModel: 'claude-opus-5-5',
    caseId: 'FP-0103',
    createdAt: '2026-10-24T09:00:00.000Z',
    outcome: 'dismissed',
    pr: 1601,
    rule: GRID_RULE,
    verdicts: ['FALSE_POSITIVE', 'FALSE_POSITIVE', 'FALSE_POSITIVE'],
  },
  {
    analyzer: 'oxlint',
    builderModel: 'claude-sonnet-5-5',
    caseId: 'FP-0104',
    createdAt: '2026-10-26T09:00:00.000Z',
    outcome: 'fixed',
    pr: 1605,
    rule: 'unicorn/no-nested-ternary',
    verdicts: ['REAL', 'REAL', 'REAL'],
  },
];

export const SEED_TRUTHS: readonly SeedTruth[] = [
  { caseId: 'FP-0101', source: 'lucio', truth: 'FALSE_POSITIVE' },
  { caseId: 'FP-0102', source: 'lucio', truth: 'REAL' },
  { caseId: 'FP-0103', source: 'reopened', truth: 'REAL' },
];

const seedAdjudication = (seed: SeedCase) =>
  adjudicationEnvelopeSchema.parse({
    ...(seed.builderModel !== undefined && {
      builder_model: seed.builderModel,
    }),
    case: {
      analyzer: seed.analyzer,
      base_sha: hash(`${seed.caseId}:base`).slice(0, 40),
      case_id: seed.caseId,
      content_hash: hash(`${seed.caseId}:lines`),
      created_at: seed.createdAt,
      file: `src/${seed.caseId}.ts`,
      finding_id: `src/${seed.caseId}.ts:1:${seed.rule}`,
      head_sha: hash(`${seed.caseId}:head`).slice(0, 40),
      pr: seed.pr ?? JSON_NULL,
      rule: seed.rule,
    },
    outcome: seed.outcome,
    schema_version: 1,
    verifiers: SEATS.map((seat, index) => ({
      agent_prompt_hash: hash(`fp-${seat.role}`),
      cost_usd: seat.costUsd,
      duration_ms: seat.durationMs,
      evidence: `Evidence: seeded ${seat.role} verdict.`,
      model: seat.model,
      role: seat.role,
      tokens_in: 1000,
      tokens_out: 2000,
      verdict: seed.verdicts[index],
    })),
  });

export const seedAdjudicationFiles = () =>
  Object.fromEntries(
    SEED_CASES.map((seed) => [
      `/seed/${seed.caseId}.json`,
      JSON.stringify(seedAdjudication(seed)),
    ]),
  );

export const INSERT_SEED_TRUTH_SQL = `insert into evals.adjudication_ground_truth (case_id, truth, source)
select seeded.case_id, seeded.truth::evals.finding_verdict, seeded.source::evals.ground_truth_source
from unnest($1::text[], $2::text[], $3::text[]) as seeded (case_id, truth, source)`;

export const seedTruthValues = () => [
  SEED_TRUTHS.map(({ caseId }) => caseId),
  SEED_TRUTHS.map(({ truth }) => truth),
  SEED_TRUTHS.map(({ source }) => source),
];
