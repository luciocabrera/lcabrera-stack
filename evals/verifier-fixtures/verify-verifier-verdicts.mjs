#!/usr/bin/env node
/**
 * Runs the refactor-verifier prompt, read verbatim from its agent definition,
 * over each fixture diff with no tools, and checks the VERDICT line of every
 * report against expected.json. Each fixture runs more than once: runs that
 * disagree fail too, because an unstable fixture proves nothing.
 *
 * Usage (from the repo root): vp run evals:verifier [-- --runs <n>]
 * Needs a Claude login, or CLAUDE_CODE_OAUTH_TOKEN in CI.
 * Exit codes: 0 = every verdict matched and was stable, 1 = otherwise.
 */
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseArgs } from 'node:util';

import { query } from '@anthropic-ai/claude-agent-sdk';

import {
  agentBody,
  describeJudgement,
  judgeFixture,
  renderDispatch,
  runCount,
  withoutSeparator,
} from './verifier-fixtures.mjs';

const MODEL = 'claude-opus-5-5';
const REPORT_DIR = '.tmp/verifier-evals';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

const runVerifier = async ({ dispatch, systemPrompt }) => {
  const session = query({
    options: {
      cwd: mkdtempSync(join(tmpdir(), 'verifier-eval-')),
      maxTurns: 1,
      model: MODEL,
      persistSession: false,
      settingSources: [],
      systemPrompt,
      tools: [],
    },
    prompt: dispatch,
  });
  for await (const message of session) {
    if (message.type === 'result') {
      return message.subtype === 'success'
        ? message.result
        : `(session ${message.subtype})`;
    }
  }
  return '(no result message)';
};

const runFixture = async ({ expectedNotMet, fixture, runs, shared }) => {
  const dispatch = renderDispatch({
    ...shared,
    diff: read(`./${fixture}/change.diff`),
  });
  const reports = await Promise.all(
    Array.from({ length: runs }, () =>
      runVerifier({ dispatch, systemPrompt: shared.systemPrompt }),
    ),
  );
  for (const [index, report] of reports.entries()) {
    writeFileSync(join(REPORT_DIR, `${fixture}-${index + 1}.md`), report);
  }
  return judgeFixture({ expectedNotMet, fixture, reports });
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
  const judgements = await Promise.all(
    Object.entries(JSON.parse(read('./expected.json'))).map(
      ([fixture, expectedNotMet]) =>
        runFixture({ expectedNotMet, fixture, runs, shared }),
    ),
  );
  console.log(judgements.map(describeJudgement).join('\n'));
  console.log(`Full reports: ${REPORT_DIR}/`);
  if (judgements.some(({ matched, stable }) => !matched || !stable)) {
    process.exitCode = 1;
  }
};

try {
  await main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
