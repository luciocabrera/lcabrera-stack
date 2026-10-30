import { z } from 'zod';

import { adjudicationIssues } from './adjudicationIssues.util.ts';
import {
  ADJUDICATION_CASE_ID,
  ADJUDICATION_OUTCOMES,
  ADJUDICATION_SCHEMA_VERSION,
  ADJUDICATION_VERDICTS,
  VERIFIER_ROLES,
} from './envelope.constants.ts';

const sha256 = z.string().regex(/^[0-9a-f]{64}$/u);
const gitSha = z.string().regex(/^[0-9a-f]{40}$/u);
const count = z.int().nonnegative();
const name = z.string().min(1);

const caseSchema = z.object({
  analyzer: name,
  base_sha: gitSha,
  case_id: z.string().regex(ADJUDICATION_CASE_ID),
  content_hash: sha256,
  created_at: z.iso.datetime(),
  file: name,
  finding_id: name,
  head_sha: gitSha,
  pr: z.int().positive().nullable(),
  rule: name,
});

const verifierSchema = z.object({
  agent_prompt_hash: sha256,
  cost_usd: z.number().nonnegative().nullable(),
  duration_ms: count,
  evidence: z.string(),
  model: name,
  role: z.enum(VERIFIER_ROLES),
  tokens_in: count,
  tokens_out: count,
  verdict: z.enum(ADJUDICATION_VERDICTS),
});

export const adjudicationShapeSchema = z.object({
  case: caseSchema,
  outcome: z.enum(ADJUDICATION_OUTCOMES),
  schema_version: z.literal(ADJUDICATION_SCHEMA_VERSION),
  verifiers: z.array(verifierSchema).min(1),
});

export const adjudicationEnvelopeSchema = adjudicationShapeSchema.check(
  (context) => {
    for (const issue of adjudicationIssues(context.value)) {
      context.issues.push({ ...issue, input: context.value });
    }
  },
);
