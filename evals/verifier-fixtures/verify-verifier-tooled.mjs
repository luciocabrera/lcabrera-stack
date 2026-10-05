#!/usr/bin/env node
/**
 * Runs the refactor-verifier with its own tools against each fixture applied
 * in a scratch worktree, one fixture at a time, and checks the report: clean
 * work earns a plain PASS, each violation a FAIL on its planted criterion, and
 * every report carries a fail-to-pass gate proof. A run whose worktree or main
 * checkout changed fails too.
 *
 * Usage (from the repo root): vp run evals:verifier:tooled [-- <fixture> ...] [--runs <n>] [--keep]
 * Needs a Claude login and the local database the full quality gate uses.
 * Exit codes: 0 = every fixture matched, 1 = otherwise.
 */
import { execFileSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';

import { query } from '@anthropic-ai/claude-agent-sdk';

import { runGit } from '../../packages/repo-standards/scripts/git-exec.mjs';
import {
  drain,
  errorText,
  finalResult,
  sessionProblem,
  withoutSeparator,
} from '../agent-sessions.mjs';

import {
  agentTools,
  describeTooledJudgement,
  judgeTooledFixture,
  nextAdrNumber,
  tooledDispatch,
  tooledRunCount,
  withAdrNumber,
} from './tooled-fixtures.mjs';
import { agentBody, suiteEnd } from './verifier-fixtures.mjs';

const MODEL = 'claude-opus-5-5';
const MAX_TURNS = 200;
const REPO_ROOT = resolve('.');
const REPORT_DIR = join(REPO_ROOT, '.tmp', 'verifier-evals-tooled');
const VP_BIN = join(REPO_ROOT, 'node_modules', '.bin', 'vp');
const BLOCKED = ['Bash(git commit:*)', 'Bash(git push:*)', 'Bash(gh:*)'];
const IDENTITY = [
  '-c',
  'core.hooksPath=/dev/null',
  '-c',
  'user.name=verifier-eval',
  '-c',
  'user.email=verifier-eval@example.invalid',
];

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

const git = (args, cwd = REPO_ROOT) => {
  const output = runGit({ args, cwd });
  if (output === undefined) {
    throw new Error(`git ${args.join(' ')} failed in ${cwd}`);
  }
  return output;
};

const vp = (args, cwd) =>
  execFileSync(VP_BIN, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });

const applyFixture = ({ diff, worktree }) => {
  const number = nextAdrNumber(
    readdirSync(join(worktree, 'docs', 'decisions')),
  );
  const patch = join(worktree, '..', `${worktree.split('/').at(-1)}.diff`);
  writeFileSync(patch, withAdrNumber({ diff, number }));
  git(['apply', patch], worktree);
  git(['add', '-A'], worktree);
  git(
    [...IDENTITY, 'commit', '-q', '-m', 'test(evals): verifier fixture'],
    worktree,
  );
  return readFileSync(patch, 'utf8');
};

const prepare = ({ base, branch, diff }) => {
  const worktree = mkdtempSync(join(tmpdir(), 'verifier-tooled-'));
  git(['worktree', 'add', '-q', '-b', branch, worktree, base]);
  const applied = applyFixture({ diff, worktree });
  vp(['install', '--frozen-lockfile'], worktree);
  vp(['run', 'typegen:all'], worktree);
  vp(['run', 'worktree:env'], worktree);
  return { applied, head: git(['rev-parse', 'HEAD'], worktree), worktree };
};

const treeProblem = ({ before, head, worktree }) => {
  const dirty = git(['status', '--porcelain'], worktree);
  if (dirty !== '') return `the worktree was left dirty: ${dirty}`;
  if (git(['rev-parse', 'HEAD'], worktree) !== head)
    return 'the worktree HEAD moved';
  return git(['status', '--porcelain']) === before
    ? undefined
    : 'the main checkout changed during the run';
};

const certify = async ({ dispatch, systemPrompt, tools, worktree }) => {
  const { error, messages } = await drain(
    query({
      options: {
        allowDangerouslySkipPermissions: true,
        cwd: worktree,
        disallowedTools: BLOCKED,
        maxTurns: MAX_TURNS,
        mcpServers: {},
        model: MODEL,
        permissionMode: 'bypassPermissions',
        persistSession: false,
        settingSources: ['project'],
        strictMcpConfig: true,
        systemPrompt,
        tools,
      },
      prompt: dispatch,
    }),
  );
  return {
    error: error ?? sessionProblem(messages, tools),
    report: finalResult(messages)?.result ?? '',
  };
};

const cleanUp = ({ branch, keep, worktree }) => {
  if (keep || worktree === undefined) return;
  runGit({ args: ['worktree', 'remove', '--force', worktree], cwd: REPO_ROOT });
  runGit({ args: ['branch', '-D', branch], cwd: REPO_ROOT });
};

const runOnce = async ({ fixture, index, keep, shared }) => {
  const branch = `eval/verifier-tooled/${fixture}-${Date.now()}-${index}`;
  const before = git(['status', '--porcelain']);
  let worktree;
  try {
    const prepared = prepare({
      base: shared.base,
      branch,
      diff: read(`./${fixture}/change.diff`),
    });
    worktree = prepared.worktree;
    const dispatch = tooledDispatch({
      ...shared,
      branch,
      diff: prepared.applied,
      worktree,
    });
    const run = await certify({ ...shared, dispatch, worktree });
    return {
      ...run,
      treeProblem: treeProblem({ before, head: prepared.head, worktree }),
    };
  } catch (error) {
    return { error: `setup failed: ${errorText(error)}`, report: '' };
  } finally {
    cleanUp({ branch, keep, worktree });
  }
};

const save = ({ fixture, runs }) => {
  for (const [
    index,
    { error, report, treeProblem: problem },
  ] of runs.entries()) {
    const notes = [error, problem].filter(Boolean).map((note) => `(${note})`);
    writeFileSync(
      join(REPORT_DIR, `${fixture}-${index + 1}.md`),
      [...notes, report].join('\n\n'),
    );
  }
};

const runFixture = async ({ fixture, keep, runs, shared }) => {
  const results = [];
  for (const index of Array.from({ length: runs }, (_, at) => at)) {
    results.push(await runOnce({ fixture, index, keep, shared }));
  }
  save({ fixture, runs: results });
  return results;
};

const selected = ({ expected, names }) => {
  const unknown = names.filter((name) => !(name in expected));
  if (unknown.length > 0) {
    throw new Error(`no fixture named ${unknown.join(', ')} in expected.json`);
  }
  return names.length === 0 ? Object.keys(expected) : names;
};

const main = async () => {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    args: withoutSeparator(process.argv.slice(2)),
    options: {
      keep: { type: 'boolean' },
      runs: { default: '1', type: 'string' },
    },
  });
  const expected = JSON.parse(read('./expected.json'));
  const fixtures = selected({ expected, names: positionals });
  const runs = tooledRunCount(values.runs);
  const definition = read('../../.claude/agents/refactor-verifier.md');
  const shared = {
    base: git(['rev-parse', 'main']),
    issue: read('./issue.md'),
    systemPrompt: agentBody(definition),
    tools: agentTools(definition),
  };
  mkdirSync(REPORT_DIR, { recursive: true });
  const judgements = [];
  for (const fixture of fixtures) {
    const results = await runFixture({
      fixture,
      keep: values.keep,
      runs,
      shared,
    });
    const judgement = judgeTooledFixture({
      expectedNotMet: expected[fixture],
      fixture,
      runs: results,
    });
    console.log(describeTooledJudgement(judgement));
    judgements.push(judgement);
  }
  const { exitCode, footer } = suiteEnd({ judgements, reportDir: REPORT_DIR });
  console.log(footer);
  process.exitCode = exitCode;
};

try {
  await main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
