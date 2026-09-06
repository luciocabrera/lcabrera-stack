#!/usr/bin/env node
/**
 * `vp run pr:queue` — the autonomous PR queue operator.
 *
 * Why it exists: an open PR that is provably ready and still sitting there costs
 * the queue behind it, and the reason it sits is almost never judgement — it is
 * that nobody looked. This runs the look, on every open PR, against one written
 * standard (.claude/pr-queue-policy.md), and then acts on what it finds. The
 * policy's §5 stop list is what makes acting safe; the bias toward action is what
 * makes it worth running at all. An operator that only produces advice has
 * reproduced the problem it was built to solve.
 *
 * Two passes, deliberately separate — decide (read-only, structured verdict) and
 * apply (write, executes the authorised action list). The decision log is written
 * between them, so what ran can always be checked against what was authorised.
 *
 * Usage (from the repo root):
 *   vp run pr:queue                    # dry run — decide and log, change nothing
 *   vp run pr:queue -- --apply         # execute the decisions, in merge order
 *   vp run pr:queue -- --pr 531        # one PR, still judged in queue context
 *   vp run pr:queue -- --model opus    # default is the CLI default
 *
 * Writes reports/pr-queue/runs/<timestamp>/ (produced on demand, never committed
 * — ADR-049). Exit codes: 0 = the pass completed, 1 = it could not run.
 *
 * Governed by .claude/rules/scripts.md.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { flagValue } from '../packages/repo-standards/scripts/cli-input.mjs';
import { errorMessage } from '../packages/repo-standards/scripts/error-message.mjs';
import {
  buildDecisionPrompt,
  parseModelName,
  resolveClaudeBinary,
  runDecision,
} from './lib/pr-queue-claude.mjs';
import { buildExecutionPrompt, runExecution } from './lib/pr-queue-execute.mjs';
import { publicPackageDirs } from '../packages/repo-standards/scripts/public-package-dirs.mjs';
import {
  evaluateGate,
  forbiddenActions,
  isWithinCeiling,
} from './lib/pr-queue-gate.mjs';
import {
  checkConformance,
  fetchQueue,
  resolveRepository,
} from './lib/pr-queue-github.mjs';
import { toQueue } from './lib/pr-queue-facts.mjs';
import { renderLog, toJson } from './lib/pr-queue-log.mjs';
import { descendants, deriveOrder, edgesFor } from './lib/pr-queue-order.mjs';
import { deriveWorkspaceScopes } from '../packages/repo-standards/scripts/workspace-scopes.mjs';

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const POLICY_PATH = join(REPO_ROOT, '.claude/pr-queue-policy.md');
const RUNS_DIR = join(REPO_ROOT, 'reports/pr-queue/runs');
const DECIDE_TIMEOUT_MS = 10 * 60 * 1000;
const APPLY_TIMEOUT_MS = 30 * 60 * 1000;

const readOptions = () => ({
  apply: process.argv.includes('--apply'),
  limit: Number(flagValue('--limit') ?? 50),
  model: parseModelName(flagValue('--model') ?? 'sonnet'),
  only: flagValue('--pr'),
});

const failedDecision = (reason) => ({
  actions: [],
  evidence: [{ observation: reason, probe: 'headless claude decide pass' }],
  reasoning: `The decide pass produced no usable verdict: ${reason}. Policy S10 — absence of evidence escalates, it never defaults to merge.`,
  ruleIds: ['S10'],
  verdict: 'ESCALATE',
});

const forcedDecision = ({ reason, ruleIds }) => ({
  actions: [],
  evidence: [
    { observation: reason, probe: 'mechanical gate (pr-queue-gate.mjs)' },
  ],
  reasoning: reason,
  ruleIds,
  verdict: 'ESCALATE',
});

const decide = ({ binary, gate, model, policy, position, pr }) => {
  if (gate.stops.length > 0) {
    const triggers = gate.stops
      .map((stop) => `${stop.id} (${stop.detail})`)
      .join('; ');
    return forcedDecision({
      reason: `Mechanically certain §5 trigger — the model is not consulted: ${triggers}`,
      ruleIds: gate.stops.map((stop) => stop.id),
    });
  }

  const { decision, error } = runDecision({
    binary,
    cwd: REPO_ROOT,
    model,
    prompt: buildDecisionPrompt({ gate, policy, position, pr }),
    timeoutMs: DECIDE_TIMEOUT_MS,
  });
  if (error !== undefined) {
    return failedDecision(error);
  }
  const forbidden = forbiddenActions(decision.actions);
  if (forbidden.length > 0) {
    const named = forbidden
      .map((item) => `\`${item.command}\` — ${item.reason}`)
      .join('; ');
    return forcedDecision({
      reason: `The decide pass authorised a command the policy forbids, so nothing runs: ${named}`,
      ruleIds: ['A5', 'S10'],
    });
  }
  return isWithinCeiling(gate.verdict, decision.verdict)
    ? decision
    : {
        ...decision,
        reasoning: `${decision.reasoning}\n\n[operator] The model returned ${decision.verdict}, weaker than the mechanical ceiling ${gate.verdict}. The ceiling binds — see pr-queue-gate.mjs.`,
        verdict: gate.verdict,
      };
};

const propagateEscalations = (entries, edges) => {
  const roots = entries
    .filter((entry) => entry.decision.verdict === 'ESCALATE')
    .map((entry) => entry.pr.number);
  const downstream = descendants(edges, roots);
  return entries.map((entry) =>
    downstream.has(entry.pr.number) && entry.decision.verdict !== 'ESCALATE'
      ? {
          ...entry,
          decision: {
            ...entry.decision,
            reasoning: `${entry.decision.reasoning}\n\n[operator] Escalated by §1 propagation: a PR this one merges after has escalated, and merging a dependent without its base corrupts the queue.`,
            ruleIds: [...entry.decision.ruleIds, '§1'],
            verdict: 'ESCALATE',
          },
        }
      : entry,
  );
};

const applyDecisions = ({ entries, model, policy }) => {
  for (const entry of entries) {
    if (!['ACT', 'ENQUEUE'].includes(entry.decision.verdict)) {
      continue;
    }
    process.stdout.write(
      `\n▶ #${entry.pr.number} — executing ${entry.decision.verdict} (${entry.decision.actions.length} action(s))\n`,
    );
    const { error, outcome } = runExecution({
      cwd: REPO_ROOT,
      model,
      prompt: buildExecutionPrompt({
        decision: entry.decision,
        policy,
        pr: entry.pr,
      }),
      timeoutMs: APPLY_TIMEOUT_MS,
    });
    if (error !== undefined) {
      process.stdout.write(`  ✗ ${error}\n`);
      continue;
    }
    for (const step of outcome.performed ?? []) {
      process.stdout.write(
        `  ${step.outcome === 'done' ? '✓' : '·'} ${step.command} — ${step.detail}\n`,
      );
    }
    if ((outcome.aborted ?? '') !== '') {
      process.stdout.write(`  🛑 aborted: ${outcome.aborted}\n`);
    }
  }
};

const writeLog = ({ entries, mode, pass }) => {
  const directory = join(RUNS_DIR, pass.startedAt.replaceAll(':', '-'));
  mkdirSync(directory, { recursive: true });
  const markdown = renderLog({ entries, mode, pass });
  writeFileSync(join(directory, 'decision-log.md'), markdown);
  writeFileSync(
    join(directory, 'decisions.json'),
    `${JSON.stringify(toJson({ entries, mode, pass }), undefined, 2)}\n`,
  );
  return { directory, markdown };
};

const main = () => {
  const options = readOptions();
  const binary = resolveClaudeBinary();
  if (binary === undefined) {
    process.stderr.write('claude CLI not found — set CLAUDE_BIN.\n');
    process.exitCode = 1;
    return;
  }

  const policy = readFileSync(POLICY_PATH, 'utf8');
  const workspaces = deriveWorkspaceScopes(REPO_ROOT);
  const publicPackages = publicPackageDirs(REPO_ROOT);
  const { owner, repo } = resolveRepository();
  const queue = toQueue(fetchQueue({ limit: options.limit, owner, repo }));
  if (queue.length === 0) {
    process.stdout.write('No open pull requests — nothing to operate on.\n');
    return;
  }

  const { cycle, edges, order } = deriveOrder(queue);
  const byNumber = new Map(queue.map((pr) => [pr.number, pr]));
  const sequence = [...order, ...cycle]
    .map((number) => byNumber.get(number))
    .filter(
      (pr) => options.only === undefined || pr.number === Number(options.only),
    );

  const mergeOrder = sequence.map((pr) => `#${pr.number}`).join(' → ');
  process.stdout.write(
    `Queue: ${queue.length} open PR(s). Merge order: ${mergeOrder}\n`,
  );

  const decided = sequence.map((pr, index) => {
    const gate = evaluateGate(
      pr,
      checkConformance(pr, workspaces),
      publicPackages,
    );
    const position = {
      edges: edgesFor(edges, pr.number),
      index,
      number: pr.number,
      total: sequence.length,
    };
    process.stdout.write(
      `  · deciding #${pr.number} (ceiling ${gate.verdict})…\n`,
    );
    const cycleMembers = cycle.map((number) => `#${number}`).join(', ');
    const decision = cycle.includes(pr.number)
      ? forcedDecision({
          reason: `#${pr.number} is in a dependency cycle (${cycleMembers}) — policy §3 escalates every PR in one.`,
          ruleIds: ['O1', 'S10'],
        })
      : decide({ binary, gate, model: options.model, policy, position, pr });
    return { decision, gate, position, pr };
  });

  const entries = propagateEscalations(decided, edges);
  const mode = options.apply ? 'apply' : 'dry-run';
  const pass = {
    cycle,
    model: options.model,
    repository: `${owner}/${repo}`,
    startedAt: new Date().toISOString(),
  };
  const { directory, markdown } = writeLog({ entries, mode, pass });

  process.stdout.write(`\n${markdown}\n`);
  process.stdout.write(`Decision log: ${directory}\n`);

  if (options.apply) {
    applyDecisions({ entries, model: options.model, policy });
  } else {
    process.stdout.write('Dry run — nothing executed. Re-run with --apply.\n');
  }
};

try {
  main();
} catch (error) {
  process.stderr.write(`pr-queue-operator failed: ${errorMessage(error)}\n`);
  process.exitCode = 1;
}
