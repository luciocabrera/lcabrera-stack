/**
 * Drives headless Claude against the queue policy: the prompt, the response
 * schema, the argv, and the parse back.
 *
 * Why the prompt is built here and not inlined at the call site: it is the whole
 * interface between a policy written in prose and an action taken on a real PR,
 * so it needs to be readable and testable on its own. Two properties it must
 * hold, both asserted in the sibling test — the policy text is passed in full
 * (never summarised, or the operator is following a paraphrase of its own rules),
 * and the mechanical ceiling from `pr-queue-gate.mjs` is stated as a hard bound
 * the model may only tighten.
 *
 * Structured output is forced with `--json-schema` rather than parsed out of
 * prose: a verdict recovered by regex from a paragraph is a verdict that can be
 * misread, and this one moves code into main.
 *
 * The claude binary is resolved to an absolute path, never a bare name: a bare
 * command resolved through the inherited PATH lets a writable directory earlier
 * in the list shadow the real binary (Sonar S4036). The interpreter's own
 * directory is the reliable non-PATH answer, since node and the claude CLI are
 * installed side by side by every version manager.
 *
 * The parse back is defensive on three counts: the envelope's `result` is a
 * string even under `--json-schema`, a model that ignores the schema tends to
 * fence its JSON, and nothing on that path enforces the schema's own verdict
 * enum. The first two recover to a real object; a verdict outside policy §1 is
 * reported as a failed run rather than carried, because one the operator cannot
 * read is S10.
 *
 * `DECIDE_TOOLS` holds `gh api`, which takes a method, so the allow-list cannot
 * make this pass read-only. #1040 records that hole for the apply pass.
 *
 * Governed by .claude/rules/scripts.md.
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { isVerdict, PRECEDENCE } from './pr-queue-gate.mjs';

export const resolveClaudeBinary = () =>
  [
    process.env.CLAUDE_BIN,
    join(dirname(process.execPath), 'claude'),
    '/usr/local/bin/claude',
    '/usr/bin/claude',
  ].find((path) => path !== undefined && existsSync(path));

export const DECIDE_TOOLS = [
  'Read',
  'Grep',
  'Glob',
  'Bash(gh pr view:*)',
  'Bash(gh pr diff:*)',
  'Bash(gh pr checks:*)',
  'Bash(gh run view:*)',
  'Bash(gh api:*)',
  'Bash(git log:*)',
  'Bash(git diff:*)',
  'Bash(git show:*)',
];

export const DECISION_SCHEMA = {
  additionalProperties: false,
  properties: {
    actions: {
      description: 'The §4 actions to take, in order, each with the command',
      items: {
        additionalProperties: false,
        properties: {
          command: { type: 'string' },
          rule: { type: 'string' },
          why: { type: 'string' },
        },
        required: ['rule', 'command', 'why'],
        type: 'object',
      },
      type: 'array',
    },
    evidence: {
      description: 'Re-runnable probes and what each returned (policy §6)',
      items: {
        additionalProperties: false,
        properties: {
          observation: { type: 'string' },
          probe: { type: 'string' },
        },
        required: ['probe', 'observation'],
        type: 'object',
      },
      type: 'array',
    },
    reasoning: { type: 'string' },
    ruleIds: {
      description: 'Policy rule ids this verdict rests on, e.g. E4, S2, O3',
      items: { type: 'string' },
      type: 'array',
    },
    verdict: { enum: [...PRECEDENCE], type: 'string' },
  },
  required: ['verdict', 'ruleIds', 'reasoning', 'evidence', 'actions'],
  type: 'object',
};

const renderChecks = (checks) =>
  checks.all.length === 0
    ? '  (none reported)'
    : checks.all
        .map((check) => `  ${check.state.padEnd(12)} ${check.name}`)
        .join('\n');

const renderThreads = (threads) =>
  threads.unresolved.length === 0
    ? '  (none)'
    : threads.unresolved
        .map((thread, index) => {
          const where = thread.path === '' ? '' : ` on ${thread.path}`;
          const outdated = thread.isOutdated ? ' (outdated)' : '';
          const body = thread.body.replaceAll('\n', '\n      ').slice(0, 700);
          return `  [${index + 1}] ${thread.author}${where}${outdated}\n      ${body}`;
        })
        .join('\n');

const parenthesised = (text) => (text === '' ? '' : ` (${text})`);

const renderQueue = (queue) => {
  if (!queue.enabled) {
    return 'not required on this base branch — landing is a direct squash merge';
  }
  if (queue.queued) {
    const at =
      queue.position === undefined ? '' : ` at position ${queue.position + 1}`;
    return `in the queue${parenthesised(queue.state)}${at}`;
  }
  if (queue.ejectedAt === '') {
    return 'required on this base branch; this pull request is not in it';
  }
  const why = queue.ejectedReason === '' ? '' : ` — ${queue.ejectedReason}`;
  return `required; REMOVED from the queue at ${queue.ejectedAt}${why}`;
};

const renderFindings = (label, findings) =>
  findings.length === 0
    ? `  (none)`
    : findings
        .map((finding) => `  ${finding.id}: ${finding.detail}`)
        .join('\n') || label;

const renderPosition = (position) =>
  [
    `  merge position: ${position.index + 1} of ${position.total}`,
    ...position.edges.map(
      (edge) =>
        `  ${edge.rule}: #${edge.from} merges before #${edge.to}${edge.to === position.number ? ' (this PR is downstream)' : ''}`,
    ),
  ].join('\n');

export const buildDecisionPrompt = ({ gate, policy, position, pr }) => `
You are the autonomous PR queue operator for this repository, running one pass
over one pull request. Your entire authority is the policy below. Follow it.

=== POLICY (verbatim, .claude/pr-queue-policy.md) ===
${policy}
=== END POLICY ===

=== PR FACTS (already gathered — do not re-derive these) ===
#${pr.number} ${pr.title}
url:      ${pr.url}
author:   ${pr.author}
branch:   ${pr.headRefName} -> ${pr.baseRefName}
draft:    ${pr.isDraft}
mergeable:${pr.mergeable}   mergeStateStatus: ${pr.mergeStateStatus}   reviewDecision: ${pr.reviewDecision || '(none)'}
merge queue: ${renderQueue(pr.queue)}
files (${pr.files.length}, ${pr.size} lines changed):
${pr.files.map((file) => `  +${file.additions} -${file.deletions} ${file.path}`).join('\n') || '  (none)'}
checks:
${renderChecks(pr.checks)}
unresolved review threads (${pr.threads.unresolved.length} of ${pr.threads.total}):
${renderThreads(pr.threads)}
queue position (policy §3):
${renderPosition(position)}
=== END PR FACTS ===

=== MECHANICAL GATE (already computed, binding) ===
ceiling verdict: ${gate.verdict}
§5 stops (certain — you CANNOT clear these):
${renderFindings('stops', gate.stops)}
§2 blockers:
${renderFindings('blockers', gate.blockers)}
§5 flags (you MUST resolve each: confirm it as a stop, or discharge it with a probe):
${renderFindings('flags', gate.flags)}
=== END MECHANICAL GATE ===

Your task:
1. Read the diff and whatever else you need to resolve every §5 flag above. Use
   the read-only tools you have. An unresolved flag is S10 — escalate.
2. Decide ONE verdict. It may be the ceiling verdict or STRICTER (further toward
   ESCALATE). It may never be weaker than the ceiling.
3. Cite the policy rule ids the verdict rests on.
4. Record every probe you ran and what it returned (policy §6). A verdict with no
   probe that could have come out otherwise is S10.
5. For ENQUEUE or ACT, list the exact §4 actions and the exact shell commands, in
   order. Bias toward action: if the policy permits the action, name it and do not
   defer it to a human. "A human should look at this" is only ESCALATE, and only
   with a §5 trigger id.

Return only the structured decision.`;

const MODEL_NAME = /^[A-Za-z0-9][A-Za-z0-9._[\]-]*$/;

export const parseModelName = (raw) => {
  const text = String(raw ?? '').trim();
  if (!MODEL_NAME.test(text)) {
    throw new Error(
      `--model must be a model alias or id such as sonnet or claude-opus-5 — got ${JSON.stringify(raw)}`,
    );
  }
  return text;
};

export const decideArgs = ({ model }) => [
  '--print',
  '--output-format',
  'json',
  '--json-schema',
  JSON.stringify(DECISION_SCHEMA),
  '--allowedTools',
  DECIDE_TOOLS.join(','),
  '--model',
  parseModelName(model),
  '--no-session-persistence',
];

export const parseDecision = (stdout) => {
  try {
    const envelope = JSON.parse(stdout);
    if (envelope.is_error === true) {
      return { error: envelope.result ?? 'claude reported an error' };
    }
    const raw = envelope.result ?? envelope;
    const decision =
      typeof raw === 'string'
        ? JSON.parse(raw.replace(/^```(?:json)?\n?|\n?```$/g, '').trim())
        : raw;
    return isVerdict(decision?.verdict)
      ? { decision }
      : {
          error: `response carried no verdict the policy defines (${PRECEDENCE.join(', ')}): ${JSON.stringify(decision?.verdict)}`,
        };
  } catch (cause) {
    return { error: `unparseable claude response: ${cause.message}` };
  }
};

export const runDecision = ({ binary, cwd, model, prompt, timeoutMs }) => {
  try {
    const stdout = execFileSync(binary, decideArgs({ model }), {
      cwd,
      encoding: 'utf8',
      input: prompt,
      maxBuffer: 32 * 1024 * 1024,
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: timeoutMs,
    });
    return parseDecision(stdout);
  } catch (cause) {
    const detail = (cause.stderr ?? '').toString().trim();
    return { error: `claude run failed: ${detail || cause.message}` };
  }
};
