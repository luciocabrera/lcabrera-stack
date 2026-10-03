#!/usr/bin/env node
/**
 * Scores every skill's SKILL.md with the judge prompt and rubric `waza quality`
 * uses, on a Claude session with no tools, and prints a markdown table. It is a
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

import { chunk, drain, runBatches } from '../agent-sessions.mjs';
import {
  finalResult,
  sessionProblem,
  withoutSeparator,
} from '../verifier-fixtures/verifier-fixtures.mjs';

import {
  baselineTable,
  judgePrompt,
  parseJudgement,
  selectedSkills,
} from './skill-quality.mjs';

const SKILLS_DIR = '.github/skills';
const REPORT_DIR = '.tmp/skill-quality';
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
  console.log(baselineTable(results));
  console.log(`\nJudge: ${values.model}. Replies: ${REPORT_DIR}/`);
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
