#!/usr/bin/env node
/**
 * Runs each skill's Waza trigger tasks through Claude Code, via the Agent SDK,
 * and checks whether the session invoked the skill. The session sees the whole
 * catalog and nothing else: no CLAUDE.md, no hooks, no MCP, and only the Skill
 * tool, plus Read when a task copies in a fixture for a path-scoped skill.
 *
 * Usage (from the repo root): vp run evals:skills [-- <skill> ...] [--model <id>]
 *   [--hide <skill>]  leave a skill out of the session, to prove its trigger task can fail
 * Needs a Claude login, or CLAUDE_CODE_OAUTH_TOKEN in CI.
 * Exit codes: 0 = every task passed, 1 = otherwise.
 */
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  renameSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';

import { query } from '@anthropic-ai/claude-agent-sdk';

import {
  describeResult,
  errorText,
  invokedSkills,
  readTask,
  sessionScope,
  taskPassed,
} from './skill-triggers.mjs';

const EVALS_ROOT = 'evals/skills';
const SKILLS_ROOT = '.github/skills';
const REPORT_DIR = '.tmp/skill-evals';
const FIXTURE_SUFFIX = '.fixture';
const CONCURRENCY = 4;

const evalDirectories = (only) =>
  readdirSync(EVALS_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => existsSync(join(EVALS_ROOT, name, 'eval.yaml')))
    .filter((name) => only.length === 0 || only.includes(name))
    .toSorted((a, b) => a.localeCompare(b));

const tasksOf = (skill) => {
  const directory = join(EVALS_ROOT, skill, 'tasks');
  return readdirSync(directory)
    .filter((name) => name.endsWith('.yaml'))
    .toSorted((a, b) => a.localeCompare(b))
    .map((name) => readTask(readFileSync(join(directory, name), 'utf8')));
};

const workspaceFor = ({ skill, task }) => {
  const cwd = mkdtempSync(join(tmpdir(), 'skill-eval-'));
  mkdirSync(join(cwd, '.claude'));
  symlinkSync(resolve(SKILLS_ROOT), join(cwd, '.claude', 'skills'));
  if (task.fixture !== undefined) {
    cpSync(join(EVALS_ROOT, skill, 'fixtures', task.fixture), cwd, {
      recursive: true,
    });
    for (const path of readdirSync(cwd, { recursive: true })) {
      if (String(path).endsWith(FIXTURE_SUFFIX)) {
        renameSync(
          join(cwd, path),
          join(cwd, String(path).slice(0, -FIXTURE_SUFFIX.length)),
        );
      }
    }
  }
  return cwd;
};

const catalog = () =>
  readdirSync(SKILLS_ROOT).filter((name) =>
    existsSync(join(SKILLS_ROOT, name, 'SKILL.md')),
  );

const drain = async (session) => {
  const messages = [];
  try {
    for await (const message of session) {
      messages.push(message);
    }
    return { messages };
  } catch (error) {
    return { error: errorText(error), messages };
  }
};

const runTask = async ({ hidden, model, skill, task }) => {
  const session = query({
    options: {
      ...sessionScope({ catalog: catalog(), hidden, task }),
      cwd: workspaceFor({ skill, task }),
      maxTurns: 8,
      mcpServers: {},
      model,
      persistSession: false,
      settingSources: ['project'],
      strictMcpConfig: true,
    },
    prompt: task.prompt,
  });
  const { error, messages } = await drain(session);
  writeFileSync(
    join(REPORT_DIR, `${skill}-${task.id}.json`),
    JSON.stringify(messages, null, 2),
  );
  const invoked = invokedSkills(messages);
  return {
    error,
    invoked,
    passed: taskPassed({ error, invoked, skill, task }),
    skill,
    task,
  };
};

const inBatches = async (jobs, size) => {
  const results = [];
  for (let start = 0; start < jobs.length; start += size) {
    results.push(
      ...(await Promise.all(
        jobs.slice(start, start + size).map((job) => job()),
      )),
    );
  }
  return results;
};

const main = async () => {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      hide: { default: [], multiple: true, type: 'string' },
      model: { default: 'claude-opus-5-5', type: 'string' },
    },
  });
  mkdirSync(REPORT_DIR, { recursive: true });
  const jobs = evalDirectories(positionals).flatMap((skill) =>
    tasksOf(skill).map(
      (task) => () =>
        runTask({ hidden: values.hide, model: values.model, skill, task }),
    ),
  );
  const results = await inBatches(jobs, CONCURRENCY);
  console.log(results.map(describeResult).join('\n'));
  console.log(`Transcripts: ${REPORT_DIR}/`);
  if (results.some(({ passed }) => !passed)) {
    process.exitCode = 1;
  }
};

try {
  await main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
