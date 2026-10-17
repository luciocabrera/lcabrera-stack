/**
 * The judging half of the tooled verifier tier: the dispatch the verifier gets,
 * the fixture diff renumbered to the next free ADR, and the rule a report must
 * meet. With tools the verifier can run the gates, so clean work must earn a
 * plain PASS, each violation a FAIL on its planted criterion, and every report
 * a fail-to-pass gate proof.
 * Usage: imported by verify-verifier-tooled.mjs.
 */
import { parse as parseYaml } from 'yaml';

import { wholeNumber } from '../agent-sessions.mjs';
import {
  agentFrontmatter,
  definiteNotMet,
  describeRun,
  fixtureLine,
  haveSameNumbers,
  verdictOf,
} from './verifier-fixtures.mjs';

export const agentTools = (definition) => {
  const { tools } = parseYaml(agentFrontmatter(definition)) ?? {};
  if (!Array.isArray(tools) || tools.length === 0) {
    throw new Error('the agent definition lists no tools');
  }
  return tools;
};

const FIXTURE_ADR = 'ADR-130';

const ADR_NUMBER = /^ADR-(\d+)-/;

export const nextAdrNumber = (fileNames) =>
  Math.max(
    0,
    ...fileNames
      .map((name) => ADR_NUMBER.exec(name)?.[1])
      .filter((digits) => digits !== undefined)
      .map(Number),
  ) + 1;

export const withAdrNumber = ({ diff, number }) =>
  diff.replaceAll(FIXTURE_ADR, () => `ADR-${String(number).padStart(3, '0')}`);

export const tooledDispatch = ({ base, branch, diff, issue, worktree }) =>
  [
    `Certify the change in ${worktree} against issue #9999.`,
    '',
    `Base: ${base}    Branch: ${branch}`,
    '',
    issue.trim(),
    '',
    '## The diff',
    '',
    '```diff',
    diff.trim(),
    '```',
    '',
    'Read docs/agents/refactor-verified-contract.md, then follow it. Return the §5 schema.',
    'Post nothing — this flow reads your report in-band.',
    '',
    'This is an eval run. Issue #9999 is not on GitHub: its §5 and §6 are above, verbatim.',
    'There is no pull request, so skip the verdict document, which needs a pull request head.',
    `Diff against ${base}, not origin/main: the branch was made from that commit.`,
  ].join('\n');

const FAILED_GATE = /^Failed:.*\bexit\s+[1-9]\d*/m;
const PASSED_GATE = /^Passed:.*\bexit\s+0\b/m;

export const hasGateProof = (report) =>
  FAILED_GATE.test(report) && PASSED_GATE.test(report);

export const expectedVerdict = (expectedNotMet) =>
  expectedNotMet.length === 0 ? 'PASS' : 'FAIL';

const isVerdictMatching = ({ expected, verdict = '' }) =>
  expected === 'PASS' ? verdict === 'PASS' : /^FAIL\b/.test(verdict);

export const readTooledRun = ({ error, report = '', treeProblem }) => ({
  error: error ?? treeProblem,
  notMet: definiteNotMet(report),
  proof: hasGateProof(report),
  verdict: verdictOf(report),
});

export const tooledRunCounts = ({ expectedNotMet, run }) =>
  run.error === undefined &&
  run.proof &&
  isVerdictMatching({
    expected: expectedVerdict(expectedNotMet),
    verdict: run.verdict,
  }) &&
  haveSameNumbers(run.notMet, expectedNotMet);

export const judgeTooledFixture = ({ expectedNotMet, fixture, runs }) => {
  const read = runs.map((run) => readTooledRun(run));
  return {
    expectedNotMet,
    fixture,
    matched:
      read.length > 0 &&
      read.every((run) => tooledRunCounts({ expectedNotMet, run })),
    runs: read,
    stable: read.every(({ notMet }) => haveSameNumbers(notMet, read[0].notMet)),
  };
};

const proofText = (proof) => (proof ? 'yes' : 'no');

const describeTooledRun = (run) =>
  run.error === undefined
    ? `${describeRun(run)}, gate proof ${proofText(run.proof)}`
    : describeRun(run);

export const describeTooledJudgement = ({
  expectedNotMet,
  fixture,
  matched,
  runs,
  stable,
}) =>
  fixtureLine({
    fixture,
    lines: runs.map((run) => describeTooledRun(run)),
    matched,
    stable,
    wanted: `expected ${expectedVerdict(expectedNotMet)} with not-met [${expectedNotMet.join(',')}] and a fail-to-pass gate proof`,
  });

export const tooledRunCount = (value) => wholeNumber({ minimum: 1, value });
