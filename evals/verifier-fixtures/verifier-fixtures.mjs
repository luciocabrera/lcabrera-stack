/**
 * The pure half of the verifier-fixtures eval: build the dispatch a fixture
 * sends, read the verdict a report states, and judge a fixture's runs.
 * Usage: imported by `verify-verifier-verdicts.mjs`.
 */
const FRONTMATTER = /^---\r?\n[\s\S]*?\r?\n---\r?\n/;
const VERDICT_LINE = /^VERDICT:[ \t]*(.+?)[ \t]*$/m;

export const agentBody = (definition) => definition.replace(FRONTMATTER, '');

export const renderDispatch = ({ contract, diff, issue, template }) =>
  template
    .replace('{{ issue }}', () => issue.trim())
    .replace('{{ diff }}', () => diff.trim())
    .replace('{{ contract }}', () => contract.trim());

export const verdictOf = (report) => VERDICT_LINE.exec(report)?.[1];

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

export const judgeFixture = ({ expectedNotMet, fixture, reports }) => {
  const runs = reports.map((report) => ({
    notMet: definiteNotMet(report),
    verdict: verdictOf(report) ?? '(no verdict line)',
  }));
  const matched = runs.every(
    ({ notMet, verdict }) =>
      sameNumbers(notMet, expectedNotMet) && verdict !== 'PASS',
  );
  const stable = runs.every(({ notMet }) =>
    sameNumbers(notMet, runs[0].notMet),
  );
  return { expectedNotMet, fixture, matched, runs, stable };
};

const describeRun = ({ notMet, verdict }) =>
  `not-met [${notMet.join(',')}], verdict ${verdict.slice(0, 30)}`;

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
      : [`expected not-met [${expectedNotMet.join(',')}] and no plain PASS`]),
    ...(stable ? [] : ['runs disagree']),
  ];
  const status = problems.length === 0 ? 'ok' : `FAIL (${problems.join('; ')})`;
  return `${fixture}: ${runs.map(describeRun).join(' | ')} -> ${status}`;
};

export const withoutSeparator = (args) =>
  args[0] === '--' ? args.slice(1) : args;

export const runCount = (value) => {
  const runs = Number(value);
  if (!Number.isInteger(runs) || runs < 1) {
    throw new Error(
      `--runs must be a whole number of at least 1, got "${value}"`,
    );
  }
  return runs;
};
