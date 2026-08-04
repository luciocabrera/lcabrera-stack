/**
 * Renders a pass's decision log — the markdown a human reads and the JSON a
 * later pass diffs against.
 *
 * Why the log is this detailed: a decision log that only states verdicts asks to
 * be trusted, and an operator that merges on its own judgement is exactly the
 * thing that should not be. Policy §7 sets the bar — a reader must be able to
 * re-derive every verdict from the log alone, without re-running the operator —
 * so each entry carries the rule ids, the probes with their observations, the
 * ordering edges, and the commands that ran or would have.
 *
 * Governed by .claude/rules/scripts.md.
 */

const VERDICT_MARK = {
  ACT: '🔧',
  ESCALATE: '🛑',
  MERGE: '✅',
  WAIT: '⏳',
};

const bullet = (lines, empty) =>
  lines.length === 0 ? `_${empty}_` : lines.map((l) => `- ${l}`).join('\n');

/** One PR's section: verdict, why, what was probed, and what happens next. */
export const renderEntry = (entry) => {
  const { decision, gate, position, pr } = entry;
  return `
### ${VERDICT_MARK[decision.verdict] ?? '•'} #${pr.number} — ${decision.verdict}

**${pr.title}**
${pr.url} · \`${pr.headRefName}\` → \`${pr.baseRefName}\` · ${pr.author} · ${pr.files.length} file(s), ${pr.size} lines${pr.isDraft ? ' · **draft**' : ''}

| | |
| --- | --- |
| Merge position | ${position.index + 1} of ${position.total} |
| Rules cited | ${decision.ruleIds.map((id) => `\`${id}\``).join(', ') || '_none_'} |
| Mechanical ceiling | \`${gate.verdict}\`${gate.verdict === decision.verdict ? '' : ` (tightened to \`${decision.verdict}\`)`} |

**Reasoning**

${decision.reasoning.trim()}

**Evidence** (policy §6 — each probe is re-runnable)

${bullet(
  decision.evidence.map((item) => `\`${item.probe}\`\n  → ${item.observation}`),
  'no probes recorded — this is itself an S10 finding',
)}

**Ordering edges** (policy §3)

${bullet(
  position.edges.map(
    (edge) => `\`${edge.rule}\` #${edge.from} merges before #${edge.to}`,
  ),
  'unconstrained — ordered by O5 (ascending PR number)',
)}

**Actions**

${bullet(
  decision.actions.map(
    (action) => `\`${action.rule}\` — \`${action.command}\`\n  ${action.why}`,
  ),
  'none',
)}
`;
};

const countBy = (entries, verdict) =>
  entries.filter((entry) => entry.decision.verdict === verdict).length;

/** The at-a-glance table — merge order top to bottom, so it reads as a plan. */
export const renderSummary = (entries) =>
  [
    '| # | PR | Verdict | Rules | Next action |',
    '| --- | --- | --- | --- | --- |',
    ...entries.map((entry, index) => {
      const { decision, pr } = entry;
      const next = decision.actions[0]?.command ?? '—';
      return `| ${index + 1} | [#${pr.number}](${pr.url}) | ${VERDICT_MARK[decision.verdict] ?? ''} \`${decision.verdict}\` | ${decision.ruleIds.join(', ') || '—'} | \`${next.slice(0, 60)}\` |`;
    }),
  ].join('\n');

/** The whole log. `mode` is the one thing a reader must not have to infer. */
export const renderLog = ({ entries, mode, pass }) => `# PR queue decision log

- **Pass**: ${pass.startedAt}
- **Mode**: ${mode === 'apply' ? '**APPLY** — actions below were executed' : '**DRY RUN** — nothing was executed'}
- **Repository**: ${pass.repository}
- **Policy**: \`.claude/pr-queue-policy.md\`
- **Model**: ${pass.model}
- **Queue**: ${entries.length} open PR(s) — ${countBy(entries, 'MERGE')} MERGE, ${countBy(entries, 'ACT')} ACT, ${countBy(entries, 'WAIT')} WAIT, ${countBy(entries, 'ESCALATE')} ESCALATE
${pass.cycle.length > 0 ? `- **⚠ Dependency cycle**: #${pass.cycle.join(', #')} — every PR in it escalates (policy §3)\n` : ''}
## Merge order

${renderSummary(entries)}

## Decisions

${entries.map(renderEntry).join('\n---\n')}
`;

/** The diffable form. Same content, no prose — a later pass compares to this. */
export const toJson = ({ entries, mode, pass }) => ({
  decisions: entries.map((entry) => ({
    actions: entry.decision.actions,
    ceiling: entry.gate.verdict,
    edges: entry.position.edges,
    evidence: entry.decision.evidence,
    number: entry.pr.number,
    position: entry.position.index + 1,
    reasoning: entry.decision.reasoning,
    ruleIds: entry.decision.ruleIds,
    title: entry.pr.title,
    verdict: entry.decision.verdict,
  })),
  mode,
  pass,
});
