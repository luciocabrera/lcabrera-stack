/**
 * Reconciles a working-tree task against LIVE origin state — the check that a
 * merged task file actually got deleted.
 *
 * `checkTaskBranches` in verify-coordination.mjs already flags a task whose
 * branch resolves to no ref, but it trusts local `refs/remotes/origin/*`, and
 * those go stale silently — this checkout once held 109 of them against 4 real
 * branches, because the repo deletes a branch on merge and nothing prunes
 * locally. A task that names a merged PR whose branch a *stale* ref still
 * "resolves" therefore slips past that check: it is exactly the residue that
 * left the #352 task file `active` on `main` for 22 merges. Consulting the live
 * remote branch list (the same list overlap detection already fetches) closes
 * that gap.
 *
 * Pure and fully injected so the safety logic is unit-tested without a repo or a
 * network: `refExists` is the filesystem ref probe, `liveBranches` is the live
 * origin list (`undefined` when the remote could not be read — then this stays
 * silent, Rule 14, rather than reporting every task as merged), and `noBranch` /
 * `noPr` are the placeholder sets owned by the caller so they cannot drift.
 */
export const mergedTaskDriftWarnings = ({
  liveBranches,
  noBranch,
  noPr,
  refExists,
  tasks,
}) => {
  if (liveBranches === undefined) {
    return [];
  }
  const live = new Set(liveBranches);
  const warnings = [];
  for (const { data, name } of tasks) {
    if (data === undefined || data.status === 'done') {
      continue;
    }
    const { branch, pr } = data;
    const realBranch = branch !== undefined && !noBranch.has(branch);
    const realPr = pr !== undefined && !noPr.has(String(pr).trim());
    if (!realBranch || !realPr) {
      continue;
    }
    // Only the stale-ref blind spot: the filesystem still "resolves" the branch
    // (so checkTaskBranches stays silent), yet the live remote says it is gone.
    // When the ref is genuinely absent, checkTaskBranches already warns — no
    // need to say it twice.
    if (refExists(branch) && !live.has(branch)) {
      warnings.push(
        `${name}: records PR ${pr} but branch \`${branch}\` is gone from origin — ` +
          'that PR has merged or closed; delete the task file (close on merge, Rule 12).',
      );
    }
  }
  return warnings;
};
