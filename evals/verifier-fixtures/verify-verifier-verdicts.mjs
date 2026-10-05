#!/usr/bin/env node
/**
 * Runs the refactor-verifier prompt, read verbatim from its agent definition,
 * over each fixture diff with no tools, and checks which criteria each report
 * marks not-met against the planted ones in expected.json. A run counts only
 * if its session held no tools, finished, and wrote a verdict line that is not
 * a PASS. Each fixture runs at least twice, and runs that disagree fail.
 *
 * Usage (from the repo root): vp run evals:verifier [-- --runs <n>]
 * Needs a Claude login, or CLAUDE_CODE_OAUTH_TOKEN in CI.
 * Exit codes: 0 = every fixture matched and was stable, 1 = otherwise.
 */
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
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
  agentBody,
  describeJudgement,
  judgeFixture,
  renderDispatch,
  runCount,
  suiteEnd,
} from './verifier-fixtures.mjs';

const MODEL = 'claude-opus-5-5';
const REPORT_DIR = '.tmp/verifier-evals';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

const runVerifier = async ({ dispatch, systemPrompt }) => {
  const session = query({
    options: {
      cwd: mkdtempSync(join(tmpdir(), 'verifier-eval-')),
      maxTurns: 1,
      mcpServers: {},
      model: MODEL,
      persistSession: false,
      settingSources: [],
      strictMcpConfig: true,
      systemPrompt,
      tools: [],
    },
    prompt: dispatch,
  });
  const { error, messages } = await drain(session);
  return {
    error: error ?? sessionProblem(messages),
    report: finalResult(messages)?.result ?? '',
  };
};

const CONCURRENCY = 4;

const saveReports = ({ fixture, sessions }) => {
  for (const [index, { error, report }] of sessions.entries()) {
    writeFileSync(
      join(REPORT_DIR, `${fixture}-${index + 1}.md`),
      error === undefined ? report : `(${error})\n\n${report}`,
    );
  }
};

const main = async () => {
  const { values } = parseArgs({
    args: withoutSeparator(process.argv.slice(2)),
    options: { runs: { default: '2', type: 'string' } },
  });
  const runs = runCount(values.runs);
  const shared = {
    contract: read('../../docs/agents/refactor-verified-contract.md'),
    issue: read('./issue.md'),
    systemPrompt: agentBody(read('../../.claude/agents/refactor-verifier.md')),
    template: read('./dispatch.md'),
  };
  mkdirSync(REPORT_DIR, { recursive: true });
  const fixtures = Object.entries(JSON.parse(read('./expected.json')));
  const jobs = fixtures.flatMap(([fixture]) => {
    const dispatch = renderDispatch({
      ...shared,
      diff: read(`./${fixture}/change.diff`),
    });
    return Array.from(
      { length: runs },
      () => () => runVerifier({ dispatch, systemPrompt: shared.systemPrompt }),
    );
  });
  const results = await runBatches(chunk(jobs, CONCURRENCY));
  const judgements = fixtures.map(([fixture, expectedNotMet], position) => {
    const sessions = results.slice(position * runs, (position + 1) * runs);
    saveReports({ fixture, sessions });
    return judgeFixture({ expectedNotMet, fixture, runs: sessions });
  });
  const { exitCode, footer } = suiteEnd({ judgements, reportDir: REPORT_DIR });
  console.log([...judgements.map(describeJudgement), footer].join('\n'));
  process.exitCode = exitCode;
};

try {
  await main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
