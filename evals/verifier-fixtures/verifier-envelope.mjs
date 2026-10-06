/**
 * The two verifier runs as envelope records: the verifier agent is the one
 * subject, each fixture a task, and each session a trial holding the verdict
 * and the criteria it marked not-met. The hashes follow the plan's §5
 * (docs/agents/planning/eval-history-plan.md).
 * Usage: imported by `verify-verifier-verdicts.mjs` and `verify-verifier-tooled.mjs`.
 */
import { canonicalHash } from '@repo/eval-history/hashing/canonicalHash.util';
import { contentHash } from '@repo/eval-history/hashing/contentHash.util';
import { fileSetHash } from '@repo/eval-history/hashing/fileSetHash.util';

import { sessionTrial, taskRecord } from '../run-envelope.mjs';

const AGENT = 'refactor-verifier';
const AGENT_PATH = `.claude/agents/${AGENT}.md`;
export const CONTRACT_PATH = 'docs/agents/refactor-verified-contract.md';
const FIXTURES_ROOT = 'evals/verifier-fixtures';
const SYSTEM_PROMPT_PATH = 'system-prompt';

const PASS = /^PASS\b/u;
const FAIL = /^FAIL\b/u;

export const verdictLabel = (verdict = '') => {
  if (PASS.test(verdict)) {
    return 'PASS';
  }
  return FAIL.test(verdict) ? 'FAIL' : null;
};

export const verifierSubject = (definition) => ({
  content_hash: contentHash(definition),
  kind: 'agent',
  name: AGENT,
  path: AGENT_PATH,
});

export const agentPromptHash = ({ files, systemPrompt }) =>
  fileSetHash([{ bytes: systemPrompt, path: SYSTEM_PROMPT_PATH }, ...files]);

const fixtureTaskKey = ({ fixture, suite }) => `${suite}/${fixture}`;

export const fixtureTask = ({
  agentPromptHash: promptHash,
  diff,
  expectedNotMet,
  fixture,
  issue,
  suite,
}) =>
  taskRecord({
    agent_prompt_hash: promptHash,
    expected_hash: canonicalHash(expectedNotMet),
    fixture_hash: contentHash(diff),
    kind: 'fixture',
    subject: { kind: 'agent', name: AGENT },
    task_hash: canonicalHash({
      diff: `${FIXTURES_ROOT}/${fixture}/change.diff`,
      issue: contentHash(issue),
    }),
    task_key: fixtureTaskKey({ fixture, suite }),
  });

const runDetail = ({ expectedNotMet, fixture, run }) => ({
  expected_not_met: expectedNotMet,
  fixture,
  not_met: run.notMet,
  verdict: verdictLabel(run.verdict),
});

export const verifierTrial = ({
  error,
  expectedNotMet,
  fixture,
  matched,
  metrics,
  queuedAt,
  run,
  transcript,
  trialIndex,
}) =>
  sessionTrial({
    detail: {
      ...runDetail({ expectedNotMet, fixture, run }),
      matched,
      schema: 'verifier/1',
    },
    error,
    metrics,
    passed: matched,
    queuedAt,
    taskKey: fixtureTaskKey({ fixture, suite: 'verifier-fixtures' }),
    transcript,
    trialIndex,
  });

export const tooledTrial = ({
  expectedNotMet,
  fixture,
  matched,
  metrics,
  queuedAt,
  run,
  setupFailed,
  transcript,
  trialIndex,
}) =>
  sessionTrial({
    detail: {
      ...runDetail({ expectedNotMet, fixture, run }),
      gate_proof_seen: run.proof,
      schema: 'verifier-tooled/1',
    },
    error: run.error,
    fallbackClass: setupFailed ? 'setup' : 'harness',
    metrics,
    passed: matched,
    queuedAt,
    taskKey: fixtureTaskKey({ fixture, suite: 'verifier-tooled' }),
    transcript,
    trialIndex,
  });
