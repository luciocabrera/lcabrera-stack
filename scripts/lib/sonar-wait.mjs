/**
 * Deciding whether SonarCloud has analysed the commit a CI gate answers for, so
 * the gate reads that commit's findings rather than racing the analysis or
 * accepting an older one. Extracted from `sonar-report.mjs` to keep that file
 * under the size ceiling; see `.claude/rules/scripts.md`.
 *
 * Two probes, because they answer different questions.
 * `api/project_pull_requests/list` reports the commit SonarCloud last analysed
 * for one pull request — exact, scoped to that pull request, and the authority
 * when the head commit is known. `api/ce/activity` reports the project's most
 * recent Compute Engine tasks; it takes a page size and no way to narrow or page
 * further, so it is a recency window rather than a lookup, and it serves as the
 * in-flight and failed signal ('pending' / 'failed', against 'ready') and as the
 * fallback for a branch target. It has to ask for the in-flight statuses by name:
 * that endpoint's `status` defaults to the three finished ones, so a default call
 * cannot see a running analysis at all. There `since` — the head commit's time —
 * is what stops a previous commit's SUCCESS being accepted, since a task carries
 * no commit sha.
 * Why the split, and which parameters SonarCloud ignores unread, is in
 * `docs/decisions/ADR-097-recompute-the-merge-bar-in-a-queue-not-on-every-open-pull-request.md`.
 */

const WAIT_TIMEOUT_MS = 5 * 60 * 1000;
const WAIT_INTERVAL_MS = 15 * 1000;
const ACTIVITY_PAGE_SIZE = 25;
const ACTIVITY_STATUSES = 'SUCCESS,FAILED,CANCELED,PENDING,IN_PROGRESS';

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
  if (fresh.length === 0) return 'pending';
  const latest = fresh.toSorted(
    (a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt),
  )[0];
  return latest.status === 'SUCCESS' ? 'ready' : 'failed';
};

const shaProbeApplies = (target, headSha) =>
  headSha !== undefined && target.type === 'pullRequest';

export const analysedHead = (pullRequests, target, headSha) => {
  if (!shaProbeApplies(target, headSha)) {
    return false;
  }
  const analysed = pullRequests.find(
    (entry) => String(entry.key) === target.value,
  )?.commit?.sha;
  return (
    analysed !== undefined && analysed.toLowerCase() === headSha.toLowerCase()
  );
};

const sleep = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const headAnalysed = async ({
  base,
  fetchJson,
  headSha,
  project,
  target,
  token,
}) => {
  if (!shaProbeApplies(target, headSha)) {
    return false;
  }
  const body = await fetchJson(
    `${base}/api/project_pull_requests/list?project=${encodeURIComponent(project)}`,
    token,
  );
  return analysedHead(body.pullRequests ?? [], target, headSha);
};

const activityState = async ({
  base,
  fetchJson,
  project,
  since,
  target,
  token,
}) => {
  const body = await fetchJson(
    `${base}/api/ce/activity?component=${encodeURIComponent(project)}` +
      `&ps=${ACTIVITY_PAGE_SIZE}&status=${ACTIVITY_STATUSES}`,
    token,
  );
  return analysisState(body.tasks ?? [], target, since);
};

export const waitForAnalysis = async ({
  base,
  fetchJson,
  headSha,
  intervalMs = WAIT_INTERVAL_MS,
  project,
  since,
  target,
  timeoutMs = WAIT_TIMEOUT_MS,
  token,
}) => {
  const context = { base, fetchJson, headSha, project, since, target, token };
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await headAnalysed(context)) return true;
    const state = await activityState(context);
    if (state === 'ready') return true;
    if (state === 'failed') {
      throw new Error(
        `SonarCloud analysis failed for ${target.type} ${target.value}`,
      );
    }
    await sleep(intervalMs);
  }
  return false;
};
