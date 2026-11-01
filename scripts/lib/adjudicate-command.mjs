/**
 * The run behind `vp run adjudicate`, with every effect passed in so a test can
 * prove what reaches the case file and what cannot. Governed by
 * .claude/rules/scripts.md; the case shape is `./adjudication-case.mjs`.
 */
import { parseArgs } from 'node:util';

import {
  ADJUDICATED_ANALYZERS,
  fallowScope,
  buildCase,
  flaggedCode,
  matchingRecords,
  nextCaseId,
  parseFindingId,
} from './adjudication-case.mjs';

export const CASES_DIR = 'docs/agents/adjudications';

const USAGE =
  'usage: vp run adjudicate -- <analyzer> <file>:<line>[-<end line>]:<rule> [--trace <target>] [--pr <number>]';

const TRACE_TARGET = /^[\w@.][\w@./:-]*$/u;

const readInput = (argv) => {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    args: argv[0] === '--' ? argv.slice(1) : argv,
    options: { pr: { type: 'string' }, trace: { type: 'string' } },
    strict: true,
  });
  const [analyzer, findingId, ...extra] = positionals;
  if (!ADJUDICATED_ANALYZERS.includes(analyzer) || extra.length !== 0) {
    throw new Error(`${USAGE}\nanalyzers: ${ADJUDICATED_ANALYZERS.join(', ')}`);
  }
  const pr = values.pr === undefined ? null : Number(values.pr);
  if (pr !== null && !(Number.isSafeInteger(pr) && pr > 0)) {
    throw new Error(`--pr must be a pull request number; got "${values.pr}"`);
  }
  return { analyzer, findingId, pr, trace: values.trace };
};

const SUPPRESS_TOKEN = /fallow-ignore-(?:next-line|file) (\S+)/u;

const fallowIssue = ({ effects, rule }) => {
  const issue = effects
    .fallowRegistry()
    .issue_types.find(
      ({ aliases = [], id }) => id === rule || aliases.includes(rule),
    );
  const scope = issue === undefined ? undefined : fallowScope(issue);
  if (scope === undefined) {
    throw new Error(
      `fallow's issue registry gives no report section for "${rule}", so its finding cannot be matched exactly`,
    );
  }
  const token = SUPPRESS_TOKEN.exec(issue.suppress_comment)?.[1] ?? rule;
  return { command: issue.command, scope, token };
};

const TRACEABLE = new Set(['dead-code', 'dupes']);

const fallowTrace = ({ command, effects, records, trace }) => {
  const target =
    trace ?? records.map(({ fingerprint }) => fingerprint).find(Boolean);
  if (!TRACEABLE.has(command) || target === undefined) return;
  if (!TRACE_TARGET.test(target)) {
    throw new Error(
      `--trace takes a fallow trace target such as dup:<fingerprint> or <file>:<export>; got "${target}"`,
    );
  }
  return effects.run({
    args: [command, `--trace=${target}`, '--format', 'json', '--quiet'],
    tool: 'fallow',
  }).stdout;
};

const ANALYZER_REPORTS = {
  biome: ({ finding }) => ({
    args: ['lint', '--reporter=json', '--', finding.file],
    tool: 'biome',
  }),
  eslint: ({ effects, finding }) => {
    const cwd = effects.workspaceOf(finding.file);
    return {
      args: ['--format', 'json', '--', finding.file.slice(cwd.length + 1)],
      cwd,
      tool: 'eslint',
    };
  },
  fallow: ({ issue }) => ({
    args: [issue.command, '--format', 'json', '--quiet'],
    tool: 'fallow',
  }),
  oxlint: ({ finding }) => ({
    args: ['lint', '--format', 'json', '--', finding.file],
    tool: 'vp',
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
    return effects.run({ args: ['explain', finding.rule], tool: 'fallow' })
      .stdout;
  }
  if (analyzer === 'biome') {
    const name = finding.rule.split('/').at(-1);
    return effects.run({ args: ['explain', name], tool: 'biome' }).stdout;
  }
};

export const openCase = ({ argv, effects }) => {
  const { analyzer, findingId, pr, trace } = readInput(argv);
  const finding = parseFindingId(findingId);
  if (!effects.isRepoFile(finding.file)) {
    throw new Error(`${finding.file} is not a file inside this repository`);
  }
  const text = effects.readText(finding.file);
  const issue =
    analyzer === 'fallow'
      ? fallowIssue({ effects, rule: finding.rule })
      : { token: finding.rule };
  const records = matchingRecords({
    finding: {
      ...finding,
      ruleNeedle: analyzer === 'fallow' ? '' : finding.rule,
      scope: issue.scope,
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
    code: flaggedCode({ ...finding, text }),
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
        : undefined,
  });
  const path = `${CASES_DIR}/${caseId}/case.json`;
  effects.writeJson(path, body);
  effects.write(
    `Opened ${caseId}: ${path}\nRun the panel next: vp run adjudicate:panel -- ${caseId} --builder-model <your model id>\n`,
  );
  return 0;
};
