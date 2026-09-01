/**
 * Pure board rendering for the coordination register. `renderBoard` builds a
 * BOARD.md table from the task and branch data. The board is a gitignored,
 * local-only VIEW (ADR-037): it is never committed, so there is nothing to parse
 * back or diff against — the task files are the source of truth, and GitHub-visible
 * status lives in the linked Issues + the Planning board. No I/O here — the caller
 * in `verify-coordination.mjs` owns the file writes. See `.claude/rules/scripts.md`.
 */

const code = (value) => `\`${value}\``;
const renderArea = (area) => area.map(code).join('<br>');

const HEADER =
  '# Coordination board\n\n' +
  '> Local, gitignored view — regenerate with `vp run coordination:board` from\n' +
  '> `tasks/*.md` + `branches/*.md`. Not committed (ADR-037), so never hand-edit:\n' +
  '> edit the task file instead. GitHub-visible status is in the linked Issues +\n' +
  '> the Planning board. See [README.md](./README.md).\n\n';

const renderTasks = (tasks) =>
  tasks
    .filter(({ data }) => data !== undefined)
    .map(({ data }) => data)
    .sort(
      (a, b) => a.status.localeCompare(b.status) || a.id.localeCompare(b.id),
    )
    .map(
      (d) =>
        `| [${d.title}](tasks/${d.id}.md) | ${d.owner} | ${d.status} | ` +
        `${code(d.branch)} | ${renderArea(d.area)} | ${d.updated} |`,
    )
    .join('\n');

const renderBranches = (branches, tasks) =>
  branches
    .filter(({ data }) => data !== undefined)
    .map(({ slug, data }) => {
      const participants = tasks
        .filter((t) => t.data?.branch === data.branch)
        .map((t) => t.data.id);
      return (
        `| [${code(data.branch)}](branches/${slug}.md) | ${data.base} → ${data.target} | ` +
        `${data.integrator} | ${data.status} | ${participants.join(', ') || '—'} | ${data.updated} |`
      );
    })
    .join('\n');

export const renderBoard = (tasks, branches, { tasksRel } = {}) => {
  const hasTasks = tasks.some(({ data }) => data !== undefined);
  const hasBranches = branches.some(({ data }) => data !== undefined);
  if (!hasTasks && !hasBranches) {
    const template =
      tasksRel === undefined ? '_TEMPLATE.md' : `${tasksRel}/_TEMPLATE.md`;
    return `${HEADER}_No active tasks. Claim one by copying \`${template}\`._\n`;
  }

  const tasksSection = hasTasks
    ? '## Tasks\n\n| Task | Owner | Status | Branch | Area | Updated |\n' +
      `| ---- | ----- | ------ | ------ | ---- | ------- |\n${renderTasks(tasks)}\n`
    : '';

  const branchesSection = hasBranches
    ? '\n## Shared branches\n\n| Branch | Base → Target | Integrator | Status | Participants | Updated |\n' +
      `| ------ | ------------- | ---------- | ------ | ------------ | ------- |\n${renderBranches(branches, tasks)}\n`
    : '';

  return `${HEADER}${tasksSection}${branchesSection}`;
};
