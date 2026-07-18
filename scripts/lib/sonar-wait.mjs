/**
 * Detecting when SonarCloud's async Automatic Analysis has finished for a PR or
 * branch, so a CI issue-gate reads fresh results instead of racing the analysis
 * (it runs in parallel with CI off the same push). A pure decision
 * (`analysisState`) plus the polling loop; extracted from `sonar-report.mjs` to
 * keep that file under the size ceiling. See `.claude/rules/scripts.md`.
 */

const WAIT_TIMEOUT_MS = 5 * 60 * 1000;
const WAIT_INTERVAL_MS = 15 * 1000;

/**
 * Decide whether THIS target's analysis has finished, from recent Compute-Engine
 * tasks. `since` (ISO — the PR head commit time) guards freshness so a *previous*
 * commit's SUCCESS isn't accepted; the CE task carries no commit SHA, only
 * `submittedAt`. Returns 'ready' | 'pending' | 'failed'.
 */
export const analysisState = (tasks, target, since) => {
  const mine = tasks.filter((task) =>
    target.type === 'pullRequest'
      ? task.pullRequest === target.value
      : task.branch === target.value,
  );
  if (mine.some((t) => t.status === 'PENDING' || t.status === 'IN_PROGRESS')) {
    return 'pending';
  }
  const fresh = mine.filter(
    (t) =>
      since === undefined || Date.parse(t.submittedAt) >= Date.parse(since),
  );
  if (fresh.length === 0) return 'pending'; // ours not submitted yet
  const latest = fresh.toSorted(
    (a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt),
  )[0];
  return latest.status === 'SUCCESS' ? 'ready' : 'failed';
};

const sleep = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * Poll the Compute Engine until this target's analysis is ready. `fetchJson` is
 * injected (the same authed fetcher the report uses). Returns true when ready,
 * false on timeout; throws if the analysis itself failed.
 */
export const waitForAnalysis = async ({
  fetchJson,
  token,
  base,
  project,
  target,
  since,
}) => {
  const url = `${base}/api/ce/activity?component=${project}&ps=25`;
  const deadline = Date.now() + WAIT_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const body = await fetchJson(url, token);
    const state = analysisState(body.tasks ?? [], target, since);
    if (state === 'ready') return true;
    if (state === 'failed') {
      throw new Error(
        `SonarCloud analysis failed for ${target.type} ${target.value}`,
      );
    }
    await sleep(WAIT_INTERVAL_MS);
  }
  return false;
};
