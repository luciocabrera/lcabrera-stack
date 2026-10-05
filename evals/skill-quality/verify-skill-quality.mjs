#!/usr/bin/env node
/**
 * Scores every skill's SKILL.md with the judge prompt and rubric `waza quality`
 * uses, on a Claude session with no tools, prints a markdown table, and writes
 * an interactive report to .tmp/skill-quality/report.html on every run. It is a
 * baseline to read, not a gate: no score fails it.
 *
 * Usage (from the repo root): vp run evals:skills:quality [-- <skill> ...] [--model <id>]
 * Needs a Claude login, or CLAUDE_CODE_OAUTH_TOKEN.
 * Exit codes: 0 = every skill was judged, 1 = a session failed or a reply did
 * not parse, or a name is no skill.
 */
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  existsSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseArgs } from 'node:util';

import { query } from '@anthropic-ai/claude-agent-sdk';

import {
  chunk,
  drain,
  finalResult,
  runBatches,
  sessionProblem,
  withoutSeparator,
} from '../agent-sessions.mjs';

import {
  baselineTable,
  judgePrompt,
  parseJudgement,
  selectedSkills,
} from './skill-quality.mjs';

import {
  parseRun,
  renderReport,
  reportData,
  runRecord,
} from './quality-report.mjs';

const SKILLS_DIR = '.github/skills';
const REPORT_DIR = '.tmp/skill-quality';
const RUNS_DIR = join(REPORT_DIR, 'runs');
const REPORT_FILE = join(REPORT_DIR, 'report.html');
const TEMPLATE = new URL('report-template.html', import.meta.url);
const CONCURRENCY = 4;

const catalog = () =>
  readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => existsSync(join(SKILLS_DIR, name, 'SKILL.md')))
    .toSorted();

const judged = ({ reply, skill }) => {
  const { judgement, problems } = parseJudgement(reply);
  return judgement === undefined
    ? { error: problems.join('; '), skill }
    : { judgement, skill };
};

const replyOf = (messages) => finalResult(messages)?.result ?? '';

const outcome = ({ error, messages, skill }) => {
  const reply = replyOf(messages);
  writeFileSync(join(REPORT_DIR, `${skill}.json`), reply);
  const problem = error ?? sessionProblem(messages);
  return problem === undefined
    ? judged({ reply, skill })
    : { error: problem, skill };
};

const judgeSkill = async ({ model, skill }) => {
  const session = query({
    options: {
      cwd: mkdtempSync(join(tmpdir(), 'skill-quality-')),
      maxTurns: 1,
      mcpServers: {},
      model,
      persistSession: false,
      settingSources: [],
      strictMcpConfig: true,
      tools: [],
    },
    prompt: judgePrompt(
      readFileSync(join(SKILLS_DIR, skill, 'SKILL.md'), 'utf8'),
    ),
  });
  return outcome({ ...(await drain(session)), skill });
};

const readHistory = () =>
  existsSync(RUNS_DIR)
    ? readdirSync(RUNS_DIR)
        .filter((name) => name.endsWith('.json'))
        .toSorted()
        .map((name) => parseRun(readFileSync(join(RUNS_DIR, name), 'utf8')))
        .filter((run) => run !== undefined)
    : [];

const writeReport = ({ model, results }) => {
  const generatedAt = new Date().toISOString();
  const history = readHistory();
  mkdirSync(RUNS_DIR, { recursive: true });
  writeFileSync(
    join(RUNS_DIR, `${generatedAt.replaceAll(':', '-')}.json`),
    JSON.stringify(runRecord({ generatedAt, model, results })),
  );
  writeFileSync(
    REPORT_FILE,
    renderReport({
      data: reportData({ generatedAt, history, model, results }),
      template: readFileSync(TEMPLATE, 'utf8'),
    }),
  );
};

const main = async () => {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    args: withoutSeparator(process.argv.slice(2)),
    options: { model: { default: 'claude-opus-5-5', type: 'string' } },
  });
  const skills = selectedSkills({ catalog: catalog(), requested: positionals });
  mkdirSync(REPORT_DIR, { recursive: true });
  const results = await runBatches(
    chunk(
      skills.map((skill) => () => judgeSkill({ model: values.model, skill })),
      CONCURRENCY,
    ),
  );
  writeReport({ model: values.model, results });
  console.log(baselineTable(results));
  console.log(`\nJudge: ${values.model}. Replies: ${REPORT_DIR}/`);
  console.log(`Report: ${REPORT_FILE}`);
  if (results.some(({ judgement }) => judgement === undefined)) {
    process.exitCode = 1;
  }
};

try {
  await main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
