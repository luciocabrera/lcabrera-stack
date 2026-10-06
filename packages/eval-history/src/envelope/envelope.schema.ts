import { z } from 'zod';

import {
  DETAIL_SCHEMA_BY_SUITE,
  ENVELOPE_SCHEMA_VERSION,
  OUTCOMES,
  SUITES,
} from './envelope.constants.ts';
import { envelopeConsistencyIssues } from './envelopeConsistencyIssues.util.ts';

const sha256 = z.string().regex(/^[0-9a-f]{64}$/u);
const timestamp = z.iso.datetime();
const count = z.int().nonnegative();
const verdict = z.enum(['PASS', 'FAIL']).nullable();
const strings = z.array(z.string());

const suiteSchema = z.enum(SUITES);
const outcomeSchema = z.enum(OUTCOMES);
const subjectKindSchema = z.enum(['skill', 'rule', 'agent', 'prompt']);

const tokensSchema = z.object({
  cache_read: count,
  cache_write: count,
  input: count,
  output: count,
});

const rulesDetailSchema = z.object({
  check: z.enum(['indexed', 'covered', 'overlap']),
  findings: strings,
  schema: z.literal(DETAIL_SCHEMA_BY_SUITE['rules-consistency']),
});

const skillsDetailSchema = z.object({
  expected_skill: z.string(),
  fixture_read: z.boolean().nullable(),
  init_tools: strings,
  invoked: strings,
  schema: z.literal(DETAIL_SCHEMA_BY_SUITE.skills),
  should_trigger: z.boolean(),
});

const verifierDetailSchema = z.object({
  expected_not_met: z.array(count),
  fixture: z.string(),
  matched: z.boolean(),
  not_met: z.array(count),
  schema: z.literal(DETAIL_SCHEMA_BY_SUITE['verifier-fixtures']),
  verdict,
});

const verifierTooledDetailSchema = z.object({
  expected_not_met: z.array(count),
  fixture: z.string(),
  gate_proof_seen: z.boolean(),
  not_met: z.array(count),
  schema: z.literal(DETAIL_SCHEMA_BY_SUITE['verifier-tooled']),
  verdict,
});

const dimensionSchema = z.object({
  feedback: z.string(),
  name: z.string(),
  score: z.number(),
});

const qualityDetailSchema = z.object({
  dimensions: z.array(dimensionSchema),
  judge_model: z.string(),
  overall: z.number(),
  reply_sha256: sha256,
  schema: z.literal(DETAIL_SCHEMA_BY_SUITE['skill-quality']),
  summary: z.string(),
});

export const trialDetailSchema = z.discriminatedUnion('schema', [
  rulesDetailSchema,
  skillsDetailSchema,
  verifierDetailSchema,
  verifierTooledDetailSchema,
  qualityDetailSchema,
]);

const rate = z.number().min(0).max(1).nullable();

const settingsSchema = z.object({
  argv: strings,
  concurrency: z.int().positive(),
  hidden: strings,
  max_turns: z.int().positive().nullable(),
  runs: z.int().positive(),
  selection: strings,
  timeout_ms: z.int().positive().nullable(),
  tools: strings,
});

const environmentSchema = z.object({
  arch: z.string(),
  ci_runner: z.string().nullable(),
  node: z.string(),
  os: z.string(),
});

const passRateSchema = z.object({
  k: count,
  lower: rate,
  n: count,
  rate,
  upper: rate,
});

const totalsSchema = z.object({
  by_outcome: z.record(outcomeSchema, count),
  cost_usd_reported: z.number().nonnegative().nullable(),
  duration_ms: count,
  pass_rate: passRateSchema,
  tokens: tokensSchema,
  trials: count,
});

const runSchema = z.object({
  actor: z.string().min(1),
  baseline_id: z.uuid().nullable(),
  branch: z.string().min(1),
  catalog_hash: sha256.nullable(),
  env: environmentSchema,
  finished_at: timestamp,
  git_dirty: z.boolean(),
  git_sha: z.string().regex(/^[0-9a-f]{40}$/u),
  harness_version: z.string().regex(/^[0-9a-f]{12}$/u),
  model_id: z.string().nullable(),
  pr_number: z.int().positive().nullable(),
  project: z.literal('lcabrera-stack'),
  run_id: z.uuidv4(),
  sdk_version: z.string().nullable(),
  settings: settingsSchema,
  started_at: timestamp,
  status: z.enum(['complete', 'partial', 'aborted']),
  suite: suiteSchema,
  totals: totalsSchema,
  trigger: z.enum([
    'local',
    'ci-pr',
    'ci-push',
    'ci-scheduled',
    'ci-manual',
    'baseline',
  ]),
});

const subjectSchema = z.object({
  content_hash: sha256,
  kind: subjectKindSchema,
  name: z.string().min(1),
  path: z.string().min(1),
});

const subjectReferenceSchema = z.object({
  kind: subjectKindSchema,
  name: z.string().min(1),
});

const taskSchema = z.object({
  agent_prompt_hash: sha256.nullable(),
  expected_hash: sha256.nullable(),
  fixture_hash: sha256.nullable(),
  judge_prompt_hash: sha256.nullable(),
  kind: z.enum(['trigger', 'near-miss', 'fixture', 'quality', 'rule-check']),
  set: z.enum(['regression', 'capability']),
  source: z.literal('incident').nullable(),
  subject: subjectReferenceSchema,
  tags: strings,
  task_hash: sha256,
  task_key: z.string().min(1),
});

const transcriptSchema = z.object({
  bytes: count,
  sha256,
  uri: z.string().min(1),
});

const trialSchema = z.object({
  cost_usd_reported: z.number().nonnegative().nullable(),
  detail: trialDetailSchema,
  duration_api_ms: count.nullable(),
  duration_ms: count.nullable(),
  error_class: z.string().nullable(),
  finished_at: timestamp.nullable(),
  first_token_at: timestamp.nullable(),
  model_usage: z.record(z.string(), z.unknown()),
  outcome: outcomeSchema,
  queued_at: timestamp,
  started_at: timestamp.nullable(),
  task_key: z.string().min(1),
  tokens: tokensSchema,
  transcript: transcriptSchema.nullable(),
  trial_index: count,
});

export const envelopeShapeSchema = z.object({
  run: runSchema,
  schema_version: z.literal(ENVELOPE_SCHEMA_VERSION),
  subjects: z.array(subjectSchema),
  tasks: z.array(taskSchema),
  trials: z.array(trialSchema),
});

export const runEnvelopeSchema = envelopeShapeSchema.check((context) => {
  for (const issue of envelopeConsistencyIssues(context.value)) {
    context.issues.push({ ...issue, input: context.value });
  }
});
