/**
 * The pure half of the verifier-fixtures eval: build the dispatch a fixture
 * sends, read the verdict a report states, and judge a fixture's runs.
 * Usage: imported by `verify-verifier-verdicts.mjs`.
 */
const FRONTMATTER = /^---\r?\n[\s\S]*?\r?\n---\r?\n/;
const VERDICT_LINE = /^VERDICT:(.*)$/m;

export const agentBody = (definition) => definition.replace(FRONTMATTER, '');

export const renderDispatch = ({ contract, diff, issue, template }) =>
  template
    .replace('{{ issue }}', () => issue.trim())
    .replace('{{ diff }}', () => diff.trim())
    .replace('{{ contract }}', () => contract.trim());

export const verdictOf = (report) => VERDICT_LINE.exec(report)?.[1].trim();

const UNVERIFIED =
  /unverified|not verified|could(?:n't| not) (?:run|verify|check)/i;

const criterionNumber = (row) => {
  const cell = row.split('|')[1]?.trim().replace(/^C/i, '');
  return /^\d+$/.test(cell ?? '') ? Number(cell) : undefined;
};

const OUTCOME = /\b(?:met|unverified|not verified)\b/i;

const isFinding = (row) => {
  const outcome = row
    .split('|')
    .slice(3)
    .find((cell) => OUTCOME.test(cell));
  return (
    outcome !== undefined &&
    /\bnot-met\b/i.test(outcome) &&
    !UNVERIFIED.test(outcome)
  );
};

export const definiteNotMet = (report) =>
  report
    .split('\n')
    .filter((line) => line.startsWith('|') && isFinding(line))
    .map(criterionNumber)
    .filter((number) => number !== undefined)
    .toSorted((a, b) => a - b);

const sameNumbers = (a, b) => a.join(',') === b.join(',');

const PASS_VERDICT = /^PASS\b/;

const runCounts = ({ expectedNotMet, run }) =>
  run.error === undefined &&
  run.verdict !== undefined &&
  !PASS_VERDICT.test(run.verdict) &&
  sameNumbers(run.notMet, expectedNotMet);

export const judgeFixture = ({ expectedNotMet, fixture, runs: sessions }) => {
  const runs = sessions.map(({ error, report = '' }) => ({
    error,
    notMet: definiteNotMet(report),
    verdict: verdictOf(report),
  }));
  const matched = runs.every((run) => runCounts({ expectedNotMet, run }));
  const stable = runs.every(({ notMet }) =>
    sameNumbers(notMet, runs[0].notMet),
  );
  return { expectedNotMet, fixture, matched, runs, stable };
};

const describeRun = ({ error, notMet, verdict }) =>
  error === undefined
    ? `not-met [${notMet.join(',')}], verdict ${(verdict ?? '(no verdict line)').slice(0, 30)}`
    : `error: ${error}`;

export const describeJudgement = ({
  expectedNotMet,
  fixture,
  matched,
  runs,
  stable,
}) => {
  const problems = [
    ...(matched
      ? []
      : [
          `expected not-met [${expectedNotMet.join(',')}], a verdict line that is not a PASS, and no session error`,
        ]),
    ...(stable ? [] : ['runs disagree']),
  ];
  const status = problems.length === 0 ? 'ok' : `FAIL (${problems.join('; ')})`;
  return `${fixture}: ${runs.map(describeRun).join(' | ')} -> ${status}`;
};

export const runCount = (value) => {
  const runs = Number(value);
  if (!Number.isInteger(runs) || runs < 2) {
    throw new Error(
      `--runs must be a whole number of at least 2, so the runs can be compared; got "${value}"`,
    );
  }
  return runs;
};
