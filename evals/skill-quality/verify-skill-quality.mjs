#!/usr/bin/env node
import { query } from '@anthropic-ai/claude-agent-sdk';
import { readFileSet } from '@repo/eval-history/hashing/readFileSet.service';
import { skillHashes } from '@repo/eval-history/hashing/skillHashes.util';
/**
 * Scores every skill's SKILL.md with the judge prompt and rubric `waza quality`
 * uses, on a Claude session with no tools, prints a markdown table, and writes
 * an interactive report to .tmp/skill-quality/report.html on every run. It is a
 * baseline to read, not a gate: no score fails it.
 *
 * The report is built from the run envelope written under
 * .tmp/eval-results/skill-quality/.
 *
 * Usage (from the repo root): vp run evals:skills:quality [-- <skill> ...] [--model <id>]
 * Needs a Claude login, or CLAUDE_CODE_OAUTH_TOKEN.
 * Exit codes: 0 = every skill was judged, 1 = a session failed or a reply did
 * not parse, or a name is no skill, 130/143 = interrupted.
 */
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseArgs } from 'node:util';

import {
  chunk,
  finalResult,
  runBatches,
  sessionMetrics,
  sessionProblem,
  timedDrain,
  withoutSeparator,
} from '../agent-sessions.mjs';
import { runSettings, skillSubjects } from '../run-envelope.mjs';
import {
  recordRun,
  runIdentity,
  runnerHarnessVersion,
  sdkVersion,
} from '../run-record.mjs';
import { qualityTask, qualityTrial } from './quality-envelope.mjs';
import {
  envelopeResults,
  parseRun,
  renderReport,
  reportDataFromEnvelope,
  runRecord,
} from './quality-report.mjs';
import {
  baselineTable,
  judgePrompt,
  parseJudgement,
  selectedSkills,
} from './skill-quality.mjs';

const SKILLS_DIR = '.github/skills';
const REPORT_DIR = '.tmp/skill-quality';
const RUNS_DIR = join(REPORT_DIR, 'runs');
const REPORT_FILE = join(REPORT_DIR, 'report.html');
const TEMPLATE = new URL('report-template.html', import.meta.url);
const CONCURRENCY = 4;
const MAX_TURNS = 1;

const catalog = () =>
  readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => existsSync(join(SKILLS_DIR, name, 'SKILL.md')))
    .toSorted((a, b) => a.localeCompare(b));

const judged = ({ reply, skill }) => {
  const { judgement, problems } = parseJudgement(reply);
  return judgement === undefined
    ? { error: problems.join('; '), skill }
    : { judgement, skill };
};

const replyOf = (messages) => finalResult(messages)?.result ?? '';

const outcome = ({ error, messages, skill, timestamps }) => {
  const reply = replyOf(messages);
  writeFileSync(join(REPORT_DIR, `${skill}.json`), reply);
  const problem = error ?? sessionProblem(messages);
  const metrics = sessionMetrics(messages, timestamps, error);
  return problem === undefined
    ? { ...judged({ reply, skill }), metrics, reply, sessionFailed: false }
    : { error: problem, metrics, reply, sessionFailed: true, skill };
};

const recordJudgement = ({ model, queuedAt, record, result }) => {
  record.addTrial(
    qualityTrial({
      ...result,
      model,
      queuedAt,
      transcript: record.transcript({
        name: `${result.skill}.json`,
        text: result.reply,
      }),
    }),
  );
  return result;
};

const judgeSkill = async ({ model, queuedAt, skill }) => {
  const open = () =>
    query({
      options: {
        cwd: mkdtempSync(join(tmpdir(), 'skill-quality-')),
        maxTurns: MAX_TURNS,
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
  return outcome({ ...(await timedDrain({ open, queuedAt })), skill });
};

const readHistory = () =>
  existsSync(RUNS_DIR)
    ? readdirSync(RUNS_DIR)
        .filter((name) => name.endsWith('.json'))
        .toSorted((a, b) => a.localeCompare(b))
        .map((name) => parseRun(readFileSync(join(RUNS_DIR, name), 'utf8')))
        .filter((run) => run !== undefined)
    : [];

const writeReport = (envelope) => {
  const history = readHistory();
  const generatedAt = envelope.run.finished_at;
  mkdirSync(RUNS_DIR, { recursive: true });
  writeFileSync(
    join(RUNS_DIR, `${generatedAt.replaceAll(':', '-')}.json`),
    JSON.stringify(
      runRecord({
        generatedAt,
        model: envelope.run.model_id,
        results: envelopeResults(envelope),
      }),
    ),
  );
  writeFileSync(
    REPORT_FILE,
    renderReport({
      data: reportDataFromEnvelope({ envelope, history }),
      template: readFileSync(TEMPLATE, 'utf8'),
    }),
  );
};

const qualityPlan = async ({ model, skills }) => {
  const hashes = skillHashes(await readFileSet({ directory: SKILLS_DIR }));
  return {
    catalogHash: hashes.catalog_hash,
    harnessVersion: runnerHarnessVersion(import.meta.url),
    modelId: model,
    sdkVersion: sdkVersion(),
    settings: runSettings({
      argv: process.argv.slice(2),
      concurrency: CONCURRENCY,
      maxTurns: MAX_TURNS,
      runs: 1,
      selection: skills,
    }),
    subjects: skillSubjects({ hashes, selected: skills }),
    suite: 'skill-quality',
    tasks: skills.map((skill) => qualityTask(skill)),
  };
};

const judgeAll = ({ model, record, skills }) =>
  runBatches(
    chunk(
      skills.map((skill) => {
        const queuedAt = Date.now();
        return async () =>
          recordJudgement({
            model,
            queuedAt,
            record,
            result: await judgeSkill({ model, queuedAt, skill }),
          });
      }),
      CONCURRENCY,
    ),
  );

const main = async () => {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    args: withoutSeparator(process.argv.slice(2)),
    options: { model: { default: 'claude-opus-5-5', type: 'string' } },
  });
  const skills = selectedSkills({ catalog: catalog(), requested: positionals });
  mkdirSync(REPORT_DIR, { recursive: true });
  const { envelope, result: results } = await recordRun({
    execute: (record) => judgeAll({ model: values.model, record, skills }),
    identity: runIdentity(),
    plan: await qualityPlan({ model: values.model, skills }),
  });
  writeReport(envelope);
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
