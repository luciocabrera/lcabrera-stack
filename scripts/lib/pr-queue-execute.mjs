/**
 * The apply pass: hands one already-decided PR to headless Claude with write
 * access and the decision's own action list.
 *
 * Why deciding and acting are two separate runs rather than one agent that does
 * both: the decision is the audited artifact. A single run that reasons and acts
 * in one context can act first and rationalise after, and the log would record
 * the rationalisation. Splitting them means the log written in dry run is the
 * same log the apply pass is held to — what actually ran can be compared against
 * what was authorised, per PR, after the fact.
 *
 * The pass is therefore deliberately narrow: it executes the named actions and
 * nothing else. It has no authority to re-decide.
 *
 * Governed by .claude/rules/scripts.md.
 */
import { execFileSync } from 'node:child_process';

import { resolveClaudeBinary } from './pr-queue-claude.mjs';

/**
 * Write-capable tools for the apply pass.
 *
 * `gh pr merge` is listed and `gh pr close` is not, on purpose: closing a PR is
 * an author-intent judgement the policy never delegates (S7). Nothing here can
 * force-push either — A1 rebases only when the result is conflict-free, and S6
 * covers a branch someone else is holding.
 */
export const EXECUTE_TOOLS = [
  'Read',
  'Grep',
  'Glob',
  'Edit',
  'Write',
  'Bash(gh pr view:*)',
  'Bash(gh pr diff:*)',
  'Bash(gh pr checks:*)',
  'Bash(gh pr merge:*)',
  'Bash(gh pr comment:*)',
  'Bash(gh pr update-branch:*)',
  'Bash(gh issue close:*)',
  'Bash(gh run rerun:*)',
  'Bash(gh run view:*)',
  'Bash(gh api:*)',
  'Bash(git:*)',
  'Bash(vp:*)',
  'Bash(node scripts/:*)',
];

/** The apply pass reports what it did — never a fresh verdict. */
export const OUTCOME_SCHEMA = {
  additionalProperties: false,
  properties: {
    aborted: {
      description: 'Why the pass stopped early, empty when it did not',
      type: 'string',
    },
    merged: { type: 'boolean' },
    performed: {
      items: {
        additionalProperties: false,
        properties: {
          command: { type: 'string' },
          detail: { type: 'string' },
          outcome: { enum: ['done', 'skipped', 'failed'], type: 'string' },
        },
        required: ['command', 'outcome', 'detail'],
        type: 'object',
      },
      type: 'array',
    },
  },
  required: ['performed', 'merged', 'aborted'],
  type: 'object',
};

export const buildExecutionPrompt = ({ decision, policy, pr }) => `
You are the autonomous PR queue operator, executing an ALREADY-MADE decision for
one pull request. You are not re-deciding it. Do not re-litigate the verdict.

=== POLICY (verbatim, .claude/pr-queue-policy.md) ===
${policy}
=== END POLICY ===

=== THE AUTHORISED DECISION ===
PR:      #${pr.number} ${pr.title}
url:     ${pr.url}
branch:  ${pr.headRefName} -> ${pr.baseRefName}
verdict: ${decision.verdict}
rules:   ${decision.ruleIds.join(', ')}
reasoning:
${decision.reasoning}

actions, in this order:
${decision.actions.map((action, index) => `  ${index + 1}. [${action.rule}] ${action.command}\n     why: ${action.why}`).join('\n') || '  (none)'}
=== END DECISION ===

Execute exactly those actions, in that order, and nothing else.

Hard bounds, in force regardless of what the action list says:
- If any §5 trigger becomes true while you work — a conflict appears, the head ref
  moved (S6), a check goes red — STOP immediately, do not merge, and report it in
  \`aborted\`.
- Re-verify §2 eligibility immediately before \`gh pr merge\`. The decision was made
  from a snapshot; the queue has moved since. If any gate now fails, stop.
- Squash-merge only (A5). Never a merge commit, never a rebase merge.
- Never mark a draft ready (A9). Never force-push over commits you did not make.
- For a Copilot comment (A4): verify the claim against the tree BEFORE applying it.
  If it is wrong, reply with the probe that disproves it and resolve the thread —
  do not apply it. An unverified apply is S10.
- After any code change, run the repo's quality gate before merging.

Report what you actually did — including anything you skipped and why.`;

/**
 * argv for the apply pass. `acceptEdits` is what makes it non-interactive: a
 * headless run cannot answer a permission prompt, so without it every edit is
 * denied and the pass reports success having changed nothing.
 */
export const executeArgs = ({ model }) => [
  '--print',
  '--output-format',
  'json',
  '--json-schema',
  JSON.stringify(OUTCOME_SCHEMA),
  '--allowedTools',
  EXECUTE_TOOLS.join(','),
  '--permission-mode',
  'acceptEdits',
  '--model',
  model,
  '--no-session-persistence',
];

/** Runs one apply pass. */
export const runExecution = ({ cwd, model, prompt, timeoutMs }) => {
  const binary = resolveClaudeBinary();
  if (binary === undefined) {
    return { error: 'claude CLI not found — set CLAUDE_BIN' };
  }
  try {
    const stdout = execFileSync(binary, executeArgs({ model }), {
      cwd,
      encoding: 'utf8',
      input: prompt,
      maxBuffer: 32 * 1024 * 1024,
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: timeoutMs,
    });
    const envelope = JSON.parse(stdout);
    const raw = envelope.result ?? envelope;
    return {
      outcome:
        typeof raw === 'string'
          ? JSON.parse(raw.replace(/^```(?:json)?\n?|\n?```$/g, '').trim())
          : raw,
    };
  } catch (cause) {
    const detail = (cause.stderr ?? '').toString().trim();
    return { error: `apply pass failed: ${detail || cause.message}` };
  }
};
