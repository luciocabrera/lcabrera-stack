/**
 * Runs the blind false-positive panel on an open case: two fp-judge sessions
 * and one fp-adversary, in parallel, each on its own model through the Claude
 * subscription, each given only the case file path. A unanimous
 * FALSE_POSITIVE is recorded; anything else is left for a fix or the owner.
 * Policy: docs/agents/public-package-suppressions.md.
 *
 * Usage: vp run adjudicate:panel -- <FP-nnnn> --builder-model <model> [--judge <model> --judge <model>] [--adversary <model>]
 * Exit codes: 0 = the panel ruled and its record is written; 1 = bad
 * arguments, a session failed, a verdict was malformed, or a verifier changed
 * the working tree.
 */
import { query } from '@anthropic-ai/claude-agent-sdk';
import { toCurrentAdjudication } from '@repo/eval-history/envelope/toCurrentAdjudication.util';
import { contentHash } from '@repo/eval-history/hashing/contentHash.util';
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { parseArgs } from 'node:util';

import {
  finalResult,
  sessionMetrics,
  sessionProblem,
  timedDrain,
} from '../evals/agent-sessions.mjs';
import { agentBody } from '../evals/verifier-fixtures/verifier-fixtures.mjs';
import { CASES_DIR, UNTRACKED_CASES_DIR } from './lib/adjudicate-command.mjs';
import {
  dispatchPrompt,
  envelopeFor,
  listEntryFor,
  parseVerdict,
  resolvedModelProblems,
  seatProblems,
  seatsFrom,
  upstreamDraft,
  verdictFileName,
} from './lib/adjudication-panel.mjs';
import { markerSpelling } from './lib/false-positive-markers.mjs';

const ROOT = process.cwd();
const LIST = 'docs/agents/false-positives.json';
const TOOLS = ['Read', 'Glob', 'Grep', 'Bash'];
const READ_ONLY_BASH = [
  'git log',
  'git show',
  'git diff',
  'git grep',
  'git blame',
  'grep',
  'rg',
  'ls',
  'cat',
  'head',
  'wc',
  'vp exec fallow explain',
  'vp exec fallow dead-code',
  'vp exec fallow dupes',
  'vp exec fallow health',
  'vp exec fallow security',
].map((command) => `Bash(${command}:*)`);
const ALLOWED = ['Read', 'Glob', 'Grep', ...READ_ONLY_BASH];
const MAX_TURNS = 80;

const read = (path) => readFileSync(join(ROOT, path), 'utf8');

const write = (path, text) => {
  mkdirSync(dirname(join(ROOT, path)), { recursive: true });
  writeFileSync(join(ROOT, path), text);
};

const treeState = () =>
  spawnSync('git', ['status', '--porcelain', '--untracked-files=all'], {
    cwd: ROOT,
    encoding: 'utf8',
  }).stdout;

const readInput = () => {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    args: process.argv
      .slice(2)
      .filter((arg, index) => index > 0 || arg !== '--'),
    options: {
      adversary: { type: 'string' },
      'builder-model': { type: 'string' },
      judge: { multiple: true, type: 'string' },
    },
    strict: true,
  });
  const [caseId] = positionals;
  const seats = seatsFrom({
    adversary: values.adversary,
    judges: values.judge,
  });
  const problems = [
    ...seatProblems({ builderModel: values['builder-model'], seats }),
    ...(/^FP-\d{4,}$/u.test(caseId ?? '') ? [] : ['name the case, FP-nnnn']),
  ];
  return { builderModel: values['builder-model'], caseId, problems, seats };
};

const sit = async ({ casePath, seat }) => {
  const definition = read(`.claude/agents/fp-${seat.role}.md`);
  const { error, messages, timestamps } = await timedDrain({
    open: () =>
      query({
        options: {
          allowedTools: ALLOWED,
          cwd: ROOT,
          maxTurns: MAX_TURNS,
          mcpServers: {},
          model: seat.model,
          permissionMode: 'dontAsk',
          persistSession: false,
          settingSources: ['project'],
          strictMcpConfig: true,
          systemPrompt: agentBody(definition),
          tools: TOOLS,
        },
        prompt: dispatchPrompt(casePath),
      }),
    queuedAt: Date.now(),
  });
  const metrics = sessionMetrics(messages, timestamps, error);
  const init = messages.find(
    (message) => message.type === 'system' && message.subtype === 'init',
  );
  return {
    error: error ?? sessionProblem(messages, TOOLS),
    hash: contentHash(definition),
    metrics,
    model: init?.model ?? seat.model,
    seat,
    text: finalResult(messages)?.result ?? '',
  };
};

const toVerifier = ({ hash, metrics, model, parsed, seat }) => ({
  agent_prompt_hash: hash,
  cost_usd: metrics.cost_usd_reported,
  duration_ms: metrics.duration_ms ?? 0,
  evidence: parsed.evidence,
  model,
  role: seat.role,
  tokens_in: metrics.tokens.input ?? 0,
  tokens_out: metrics.tokens.output ?? 0,
  verdict: parsed.verdict,
});

const recordDismissal = ({ caseDir, caseFile, envelope }) => {
  const evidence = `${CASES_DIR}/${caseFile.case.case_id}.json`;
  write(evidence, `${JSON.stringify(envelope, null, 2)}\n`);
  write(
    `${caseDir}/upstream.md`,
    upstreamDraft({ caseFile, verifiers: envelope.verifiers }),
  );
  const list = existsSync(join(ROOT, LIST)) ? JSON.parse(read(LIST)) : [];
  write(
    LIST,
    `${JSON.stringify([...list, listEntryFor({ caseFile, evidence })], null, 2)}\n`,
  );
  return `Dismissed unanimously. Recorded ${evidence} and the ${LIST} entry. Add this marker above line ${caseFile.code.start} of ${caseFile.case.file}:\n  ${markerSpelling({ analyzer: caseFile.case.analyzer, caseId: caseFile.case.case_id, reason: '<one-line reason>', rule: caseFile.case.rule })}\nThe upstream draft is ${caseDir}/upstream.md; never post it without the owner's explicit yes.\n`;
};

const recordOther = ({ caseDir, caseFile, envelope }) => {
  const caseId = caseFile.case.case_id;
  write(
    `${UNTRACKED_CASES_DIR}/${caseId}.json`,
    `${JSON.stringify(envelope, null, 2)}\n`,
  );
  renameSync(join(ROOT, caseDir), join(ROOT, UNTRACKED_CASES_DIR, caseId));
  const next =
    envelope.outcome === 'fixed'
      ? 'The panel ruled REAL. Apply a fix from the verdicts; no marker.'
      : 'The panel split. Stop and ask the repository owner; do not mark or dismiss it.';
  return `${next}\nThe record is ${UNTRACKED_CASES_DIR}/${caseId}.json, for vp run evals:ingest.\n`;
};

const main = async () => {
  const { builderModel, caseId, problems, seats } = readInput();
  if (problems.length > 0) throw new Error(problems.join('\n'));
  const caseDir = `${CASES_DIR}/${caseId}`;
  const casePath = `${caseDir}/case.json`;
  const caseFile = JSON.parse(read(casePath));
  const before = treeState();
  const sessions = await Promise.all(
    seats.map((seat) => sit({ casePath, seat })),
  );
  if (treeState() !== before)
    throw new Error('a verifier changed the working tree; the panel is void');
  const failed = sessions.filter(({ error }) => error !== undefined);
  if (failed.length > 0)
    throw new Error(
      failed
        .map(({ error, seat }) => `${seat.role} on ${seat.model}: ${error}`)
        .join('\n'),
    );
  const parsed = sessions.map((session) => ({
    ...session,
    parsed: parseVerdict(session.text),
  }));
  for (const session of parsed)
    write(
      `${caseDir}/${verdictFileName({ model: session.model, role: session.seat.role })}`,
      `${session.text.trim()}\n`,
    );
  const malformed = parsed.filter(
    ({ parsed: verdict }) => verdict.problem !== undefined,
  );
  if (malformed.length > 0)
    throw new Error(
      malformed
        .map(
          ({ parsed: verdict, seat }) =>
            `${seat.role} on ${seat.model}: ${verdict.problem}`,
        )
        .join('\n'),
    );
  const verifiers = parsed.map((session) => toVerifier(session));
  const resolved = resolvedModelProblems({ builderModel, verifiers });
  if (resolved.length > 0) throw new Error(resolved.join('\n'));
  const envelope = envelopeFor({ caseFile, verifiers });
  const checked = toCurrentAdjudication({ input: envelope });
  if (!checked.ok)
    throw new Error(
      `the panel record is not a valid envelope: ${checked.problems.join('; ')}`,
    );
  const summary = verifiers
    .map(({ model, role, verdict }) => `  ${role} (${model}): ${verdict}`)
    .join('\n');
  process.stdout.write(`${caseId}\n${summary}\n\n`);
  process.stdout.write(
    envelope.outcome === 'dismissed'
      ? recordDismissal({ caseDir, caseFile, envelope })
      : recordOther({ caseDir, caseFile, envelope }),
  );
};

try {
  await main();
} catch (error) {
  process.stderr.write(
    `adjudicate:panel: ${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
}
