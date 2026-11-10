/**
 * The pure half of the fp-panel eval: turn a fixture with a known true answer
 * into the case file a panel seat reads, score a seat's verdict against that
 * answer, and describe the run. Each fixture is one task per verifier role.
 * Usage: imported by `verify-fp-panel.mjs`.
 */
import { canonicalHash } from '@repo/eval-history/hashing/canonicalHash.util';
import { contentHash } from '@repo/eval-history/hashing/contentHash.util';
import { fileSetHash } from '@repo/eval-history/hashing/fileSetHash.util';

import {
  buildCase,
  flaggedCode,
} from '../../scripts/lib/adjudication-case.mjs';
import { wholeNumber } from '../agent-sessions.mjs';
import { sessionTrial, taskRecord } from '../run-envelope.mjs';

export const SUITE = 'fp-panel';
export const ROLES = ['judge', 'adversary'];
const FIXTURE_SUFFIX = '.fixture';

const FIRST_CASE_NUMBER = 9001;
const OPENED_AT = '2026-11-01T00:00:00.000Z';
const NO_COMMIT = '0'.repeat(40);
const SYSTEM_PROMPT_PATH = 'system-prompt';
const CASES_ROOT = 'evals/fp-panel/cases';

const agentOf = (role) => `fp-${role}`;

export const agentPath = (role) => `.claude/agents/${agentOf(role)}.md`;

export const caseIdOf = (index) => `FP-${String(FIRST_CASE_NUMBER + index)}`;

export const casePathOf = (caseId) =>
  `docs/agents/adjudications/${caseId}/case.json`;

export const treePathOf = (fixturePath) =>
  fixturePath.endsWith(FIXTURE_SUFFIX)
    ? fixturePath.slice(0, -FIXTURE_SUFFIX.length)
    : undefined;

export const fixtureCaseFile = ({ caseId, finding, text }) =>
  buildCase({
    analyzer: finding.analyzer,
    caseId,
    code: flaggedCode({ end: finding.end, start: finding.start, text }),
    completion: null,
    createdAt: OPENED_AT,
    explain: finding.explain,
    finding: { file: finding.file },
    findingId: `${finding.file}:${String(finding.start)}:${finding.rule}`,
    markerRule: finding.rule,
    pr: null,
    records: finding.records,
    shas: { base: NO_COMMIT, head: NO_COMMIT },
    trace: null,
  });

export const selectedFixtures = ({ expected, names }) => {
  const fixtures = Object.keys(expected).toSorted((left, right) =>
    left.localeCompare(right),
  );
  const unknown = names.filter((name) => !fixtures.includes(name));
  if (unknown.length > 0) {
    throw new Error(
      `no fp-panel fixture named ${unknown.join(', ')}; the fixtures are ${fixtures.join(', ')}`,
    );
  }
  return fixtures
    .map((fixture, index) => ({
      caseId: caseIdOf(index),
      fixture,
      truth: expected[fixture],
    }))
    .filter(({ fixture }) => names.length === 0 || names.includes(fixture));
};

export const seatRunCount = (value) => wholeNumber({ minimum: 1, value });

const taskKeyOf = ({ fixture, role }) => `${SUITE}/${fixture}/${role}`;

export const promptHashOf = ({ dispatch, systemPrompt }) =>
  fileSetHash([
    { bytes: systemPrompt, path: SYSTEM_PROMPT_PATH },
    { bytes: dispatch, path: 'dispatch' },
  ]);

export const panelSubject = ({ definition, role }) => ({
  content_hash: contentHash(definition),
  kind: 'agent',
  name: agentOf(role),
  path: agentPath(role),
});

export const panelTask = ({ fixture, promptHash, role, tree, truth }) =>
  taskRecord({
    agent_prompt_hash: promptHash,
    expected_hash: canonicalHash({ truth }),
    fixture_hash: canonicalHash(tree),
    kind: 'fixture',
    subject: { kind: 'agent', name: agentOf(role) },
    task_hash: canonicalHash({ case: `${CASES_ROOT}/${fixture}`, role }),
    task_key: taskKeyOf({ fixture, role }),
  });

export const seatScore = ({ error, parsed, truth }) => {
  if (error !== undefined) {
    return { error, matched: false, verdict: null };
  }
  if (parsed.problem !== undefined) {
    return { error: undefined, matched: false, verdict: null };
  }
  return {
    error: undefined,
    matched: parsed.verdict === truth,
    verdict: parsed.verdict,
  };
};

export const panelTrial = ({
  fixture,
  metrics,
  queuedAt,
  role,
  score,
  transcript,
  trialIndex,
  truth,
}) =>
  sessionTrial({
    detail: {
      fixture,
      matched: score.matched,
      role,
      schema: 'fp-panel/1',
      truth,
      verdict: score.verdict,
    },
    error: score.error,
    metrics,
    passed: score.matched,
    queuedAt,
    taskKey: taskKeyOf({ fixture, role }),
    transcript,
    trialIndex,
  });

const seatOutcome = ({ problem = 'no verdict', score }) => {
  if (score.error !== undefined) {
    return `error: ${score.error}`;
  }
  return score.verdict === null ? `malformed: ${problem}` : score.verdict;
};

export const seatLine = ({ fixture, role, sessions, truth }) => {
  const outcomes = sessions.map((session) => seatOutcome(session));
  const status = sessions.every(({ score }) => score.matched)
    ? 'ok'
    : `FAIL (expected ${truth} in every run)`;
  return `${fixture} ${role}: ${outcomes.join(' | ')} -> ${status}`;
};

export const suiteExitCode = (sessions) =>
  sessions.every(({ score }) => score.matched) ? 0 : 1;
