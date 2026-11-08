/**
 * The run behind `vp run adjudicate`, with every effect passed in so a test can
 * prove what reaches the case file and what cannot. Governed by
 * .claude/rules/scripts.md; the case shape is `./adjudication-case.mjs`.
 */
import { parseArgs } from 'node:util';

import { incompleteReason } from '../../packages/repo-standards/scripts/fallow-gate-report.mjs';
import {
  ADJUDICATED_ANALYZERS,
  fallowScope,
  buildCase,
  flaggedCode,
  matchingRecords,
  nextCaseId,
  parseFindingId,
} from './adjudication-case.mjs';
import { caseCommit } from './case-snapshot.mjs';

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

const SIMILAR_CODE = {
  command: 'similar-code',
  scope: { section: 'candidates' },
  token: 'similar-code',
};

const fallowIssue = ({ effects, rule }) => {
  if (rule === SIMILAR_CODE.token) return SIMILAR_CODE;
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
  fallow: ({ finding, issue }) => ({
    args: [
      issue.command,
      '--format',
      'json',
      '--quiet',
      ...(issue === SIMILAR_CODE ? [`--file=${finding.file}`] : []),
    ],
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

const assertModelReady = (effects) => {
  const status = parseJsonOutput(
    effects.run({
      args: ['similar-code', 'status', '--format', 'json', '--quiet'],
      tool: 'fallow',
    }).stdout,
  );
  if (status.model_ready !== true) {
    throw new Error(
      "similar-code has no local model installed, so it compared nothing. Installing it is the repository owner's decision; this command never fetches it.",
    );
  }
};

const similarCodeReport = ({ effects, finding, issue }) => {
  assertModelReady(effects);
  const report = parseJsonOutput(
    effects.run(ANALYZER_REPORTS.fallow({ finding, issue })).stdout,
  );
  return report;
};

const completionOf = (report) => ({
  partial: (report.completion?.phases ?? [])
    .filter(({ status }) => status !== 'complete')
    .map(({ phase, reason, status }) => ({ phase, reason, status })),
  status: report.completion?.status ?? 'missing',
});

const analyzerReport = ({ analyzer, effects, finding, issue }) => {
  if (analyzer === 'react-doctor') {
    return effects.readJson('reports/react-doctor/full-latest.json');
  }
  return issue === SIMILAR_CODE
    ? similarCodeReport({ effects, finding, issue })
    : parseJsonOutput(
        effects.run(ANALYZER_REPORTS[analyzer]({ effects, finding, issue }))
          .stdout,
      );
};

const explanation = ({ analyzer, effects, finding, issue }) => {
  if (issue === SIMILAR_CODE) return;
  if (analyzer === 'fallow') {
    return effects.run({ args: ['explain', finding.rule], tool: 'fallow' })
      .stdout;
  }
  if (analyzer === 'biome') {
    const name = finding.rule.split('/').at(-1);
    return effects.run({ args: ['explain', name], tool: 'biome' }).stdout;
  }
};

const snapshotNote = (sha) =>
  `The flagged lines are not committed, so the panel reads ${sha}, a snapshot of the working tree made with git stash create; no ref moved.\n`;

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
  const report = analyzerReport({ analyzer, effects, finding, issue });
  const records = matchingRecords({
    finding: {
      ...finding,
      ruleNeedle: analyzer === 'fallow' ? '' : finding.rule,
      scope: issue.scope,
      whole: analyzer === 'fallow',
    },
    report,
  });
  if (records.length === 0) {
    throw new Error(
      (issue === SIMILAR_CODE &&
        incompleteReason({ analysis: 'similar-code', report })) ||
        `${analyzer} does not report ${finding.rule} at ${finding.file}:${finding.start} now, so there is nothing to adjudicate.`,
    );
  }
  const code = flaggedCode({ ...finding, text });
  const shas = effects.shas();
  const commit = caseCommit({
    code,
    file: finding.file,
    head: shas.head,
    snapshot: effects.snapshot,
    textAt: (sha) => effects.textAt({ file: finding.file, sha }),
  });
  const caseId = nextCaseId(effects.caseNames());
  const body = buildCase({
    analyzer,
    caseId,
    code,
    createdAt: effects.now(),
    completion: issue === SIMILAR_CODE ? completionOf(report) : undefined,
    explain: explanation({ analyzer, effects, finding, issue }),
    finding,
    findingId,
    markerRule: issue.token,
    pr,
    records,
    shas: { ...shas, head: commit.sha },
    trace:
      analyzer === 'fallow'
        ? fallowTrace({ command: issue.command, effects, records, trace })
        : undefined,
  });
  const path = `${CASES_DIR}/${caseId}/case.json`;
  effects.writeJson(path, body);
  effects.write(
    `Opened ${caseId}: ${path}\n${commit.snapshot ? snapshotNote(commit.sha) : ''}Run the panel next: vp run adjudicate:panel -- ${caseId} --builder-model <your model id>\n`,
  );
  return 0;
};
