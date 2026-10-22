/**
 * How `housekeeping:prune` prints its plan: one section per action, then
 * everything it keeps, then the notes saying what it could not learn. Pure,
 * so the dry run and `--apply` print from the same lines.
 */

const section = ({ rows, title }) => [
  `\n${title}`,
  ...(rows.length === 0 ? ['  (none)'] : rows.map((row) => `  ${row}`)),
];

/**
 * @param {{ apply: boolean, plan: object }} args
 * @returns {string[]}
 */
export const renderPlan = ({ apply, plan }) => {
  const verb = (doing, would) => (apply ? doing : would);
  return [
    apply
      ? 'housekeeping:prune — applying'
      : 'housekeeping:prune — dry run (pass --apply to act)',
    ...section({
      rows: plan.deleteBranches.map((b) => `${b.name} — ${b.reason}`),
      title: `${verb('Deleting', 'Would delete')} branches (merged/closed PR or cruft):`,
    }),
    ...section({
      rows: plan.removeWorktrees.map(
        (w) => `${w.path} [${w.branch ?? 'detached'}] — ${w.reason}`,
      ),
      title: `${verb('Removing', 'Would remove')} worktrees:`,
    }),
    ...section({
      rows: plan.prunable.map((path) => `${path} — its directory is gone`),
      title: `${verb('Pruning', 'Would prune')} stale worktree entries (\`git worktree prune\`, before any branch is deleted):`,
    }),
    ...section({
      rows: plan.removeContainers.map((c) => `${c.name} — ${c.reason}`),
      title: `${verb('Removing', 'Would remove')} throwaway containers:`,
    }),
    ...section({
      rows: [
        ...plan.reportBranches.map((b) => `branch ${b.name} — ${b.reason}`),
        ...plan.reportWorktrees.map((w) => `worktree ${w.path} — ${w.reason}`),
        ...plan.keepContainers.map((c) => `container ${c.name} — ${c.reason}`),
        ...plan.stashes.map((s) => `stash ${s}`),
      ],
      title: 'KEEPING — review by hand, never auto-deleted:',
    }),
    ...plan.notes.map((note) => `note: ${note}`),
  ];
};
