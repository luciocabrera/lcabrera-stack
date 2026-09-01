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
 * `EXECUTE_TOOLS` is write-capable, and what bounds it is `forbiddenActions` in
 * `pr-queue-gate.mjs`, which audits the DECISION rather than this pass. That
 * bound cannot be complete and is not containment; #1040 records the residual
 * and the guard that would close it.
 *
 * `acceptEdits` in the argv is what makes the run non-interactive: a headless
 * run cannot answer a permission prompt, so without it every edit is denied and
 * the pass reports success having changed nothing.
 *
 * Governed by .claude/rules/scripts.md.
 */
import { execFileSync } from 'node:child_process';

import { parseModelName, resolveClaudeBinary } from './pr-queue-claude.mjs';

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
- \`gh pr merge <n> --squash\` is the ONLY way you may land a pull request (A5),
  and the only form of it: add no other flag. Never \`--admin\` — it merges past the
  merge queue and past every required check, and the account you run as can do it.
  Never \`--delete-branch\`/\`-d\` — gh refuses it outright where a queue is required,
  and A7 deletes the branch after the merge is confirmed, not as part of asking for
  one. Never \`--auto\`, never another merge method, and never the REST merge
  endpoints or the GraphQL merge mutations, which are the same operation reached
  through \`gh api\`.
- Never write the base branch by another route either: no \`git push\` whose
  destination refspec is \`main\` (\`main\`, \`HEAD:main\`, \`refs/heads/main\`), no
  \`--method PATCH …/git/refs/heads/main\`, no \`updateRef\`/\`createCommitOnBranch\`,
  and no \`enqueuePullRequest\` — the queue is entered with A5's command, not with
  a mutation that can jump the entries already in it. Each of these lands commits
  on \`main\` past every required check, and the account you run as can do it.
  This list is not exhaustive and is not what stops you: it names the routes, and
  the rule is that A5's command is the ONLY one you may use to land anything.
- Where a merge queue is required, that command ENQUEUES rather than merges, and
  the pass ends with the pull request queued and not yet merged. Report
  \`merged: false\` then — it is not a failure. A6 (close the issue), A7 (delete the
  branch) and A8 (prune the worktree) are for a pull request that has actually
  landed, so you may not perform them here. NO LATER PASS PERFORMS THEM EITHER:
  the operator reads only OPEN pull requests, so a merged one never comes back to
  it. They are unowned until issue #1043 builds that lane, and a human does them
  after the queue merges. If the action list names one, skip it and say so in
  \`aborted\`, so the gap shows up in this pass's own report instead of reading as
  work that was done.
- Never mark a draft ready (A9). Never force-push over commits you did not make.
- For a Copilot comment (A4): verify the claim against the tree BEFORE applying it.
  If it is wrong, reply with the probe that disproves it and resolve the thread —
  do not apply it. An unverified apply is S10.
- After any code change, run the repo's quality gate before merging.

Report what you actually did — including anything you skipped and why.`;

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
  parseModelName(model),
  '--no-session-persistence',
];

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
