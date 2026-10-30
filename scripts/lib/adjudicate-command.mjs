/**
 * The run behind `vp run adjudicate`, with every effect passed in so a test can
 * prove what reaches the case file and what cannot. Governed by
 * .claude/rules/scripts.md; the case shape is `./adjudication-case.mjs`.
 */
import { parseArgs } from 'node:util';

import {
  ADJUDICATED_ANALYZERS,
  buildCase,
  flaggedCode,
  matchingRecords,
  nextCaseId,
  parseFindingId,
} from './adjudication-case.mjs';

export const CASES_DIR = 'docs/agents/adjudications';

export const UNTRACKED_CASES_DIR = '.tmp/eval-results/adjudications';

const USAGE =
  'usage: vp run adjudicate -- <analyzer> <file>:<line>[-<end line>]:<rule> [--trace <target>] [--pr <number>]';

const readInput = (argv) => {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    args: argv[0] === '--' ? argv.slice(1) : argv,
    options: { pr: { type: 'string' }, trace: { type: 'string' } },
    strict: true,
  });
  const [analyzer, findingId, ...extra] = positionals;
  if (!ADJUDICATED_ANALYZERS.includes(analyzer) || extra.length > 0) {
    throw new Error(`${USAGE}\nanalyzers: ${ADJUDICATED_ANALYZERS.join(', ')}`);
  }
  const pr = values.pr === undefined ? null : Number(values.pr);
  if (pr !== null && !(Number.isSafeInteger(pr) && pr > 0)) {
    throw new Error(`--pr must be a pull request number; got "${values.pr}"`);
  }
  return { analyzer, findingId, pr, trace: values.trace };
};

const fallowIssue = ({ effects, rule }) => {
  const types = effects.fallowRegistry().issue_types ?? [];
  const issue = types.find(
    ({ aliases = [], id }) => id === rule || aliases.includes(rule),
  );
  const command =
    issue?.command ?? (rule.startsWith('security') ? 'security' : 'dead-code');
  const token =
    /fallow-ignore-(?:next-line|file) (\S+)/u.exec(
      issue?.suppress_comment ?? '',
    )?.[1] ?? rule;
  return { command, token };
};

const TRACEABLE = new Set(['dead-code', 'dupes']);

const fallowTrace = ({ command, effects, records, trace }) => {
  const target =
    trace ??
    records.map(({ fingerprint }) => fingerprint).find((value) => value);
  if (!TRACEABLE.has(command) || target === undefined) return null;
  return effects.run({
    args: [
      'exec',
      'fallow',
      command,
      '--trace',
      target,
      '--format',
      'json',
      '--quiet',
    ],
  }).stdout;
};

const ANALYZER_REPORTS = {
  biome: ({ finding }) => ({
    args: ['exec', 'biome', 'lint', '--reporter=json', finding.file],
  }),
  eslint: ({ effects, finding }) => {
    const cwd = effects.workspaceOf(finding.file);
    return {
      args: [
        'exec',
        'eslint',
        '--format',
        'json',
        finding.file.slice(cwd.length + 1),
      ],
      cwd,
    };
  },
  fallow: ({ issue }) => ({
    args: ['exec', 'fallow', issue.command, '--format', 'json', '--quiet'],
  }),
  oxlint: ({ finding }) => ({
    args: ['lint', '--format', 'json', finding.file],
  }),
};

const parseJsonOutput = (stdout) => {
  const start = stdout.search(/[[{]/u);
  if (start === -1) throw new Error('the analyzer printed no JSON report');
  return JSON.parse(stdout.slice(start));
};

const analyzerReport = ({ analyzer, effects, finding, issue }) =>
  analyzer === 'react-doctor'
    ? effects.readJson('reports/react-doctor/full-latest.json')
    : parseJsonOutput(
        effects.run(ANALYZER_REPORTS[analyzer]({ effects, finding, issue }))
          .stdout,
      );

const explanation = ({ analyzer, effects, finding }) => {
  if (analyzer === 'fallow') {
    return effects.run({ args: ['exec', 'fallow', 'explain', finding.rule] })
      .stdout;
  }
  if (analyzer === 'biome') {
    const name = finding.rule.split('/').at(-1);
    return effects.run({ args: ['exec', 'biome', 'explain', name] }).stdout;
  }
  return null;
};

export const openCase = ({ argv, effects }) => {
  const { analyzer, findingId, pr, trace } = readInput(argv);
  const finding = parseFindingId(findingId);
  const issue =
    analyzer === 'fallow'
      ? fallowIssue({ effects, rule: finding.rule })
      : { token: finding.rule };
  const records = matchingRecords({
    finding: {
      ...finding,
      ruleNeedle: analyzer === 'fallow' ? '' : finding.rule,
      whole: analyzer === 'fallow',
    },
    report: analyzerReport({ analyzer, effects, finding, issue }),
  });
  if (records.length === 0) {
    throw new Error(
      `${analyzer} does not report ${finding.rule} at ${finding.file}:${finding.start} now, so there is nothing to adjudicate.`,
    );
  }
  const caseId = nextCaseId(effects.caseNames());
  const body = buildCase({
    analyzer,
    caseId,
    code: flaggedCode({ ...finding, text: effects.readText(finding.file) }),
    createdAt: effects.now(),
    explain: explanation({ analyzer, effects, finding }),
    finding,
    findingId,
    markerRule: issue.token,
    pr,
    records,
    shas: effects.shas(),
    trace:
      analyzer === 'fallow'
        ? fallowTrace({ command: issue.command, effects, records, trace })
        : null,
  });
  const path = `${CASES_DIR}/${caseId}/case.json`;
  effects.writeJson(path, body);
  effects.write(
    `Opened ${caseId}: ${path}\nRun the panel next: vp run adjudicate:panel -- ${caseId} --builder-model <your model id>\n`,
  );
  return 0;
};
