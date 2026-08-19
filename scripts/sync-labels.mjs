/**
 * Creates/updates the repo's label taxonomy on GitHub from `buildLabelDefinitions`
 * (type + breaking-change + one `app:`/`pkg:` label per workspace). Uses the REST
 * API via `fetch` — no `gh`/git subprocess (keeps the script free of Sonar's
 * S4036 PATH hotspot, like sonar-report.mjs). Idempotent: creates missing labels,
 * updates color/description on existing ones, never deletes.
 *
 * Auth: GITHUB_TOKEN (or GH_TOKEN) with repo scope. Repo: GITHUB_REPOSITORY
 * (owner/repo, set in CI) or the origin remote in `.git/config`.
 *
 * Usage: GITHUB_TOKEN=… node scripts/sync-labels.mjs
 * Exit codes: 0 = synced (or skipped with no token), 1 = an API call failed.
 */
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { fetchWithRetry } from './lib/fetch-retry.mjs';
import { readRepoSlug } from './lib/git-remote.mjs';
import { buildLabelDefinitions } from './lib/labels.mjs';
import { deriveWorkspaces } from '@repo/repo-standards/workspace-scopes';

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const API = 'https://api.github.com';

const repoSlug = () => {
  const fromEnv = process.env.GITHUB_REPOSITORY;
  if (fromEnv?.includes('/')) {
    const [owner, repo] = fromEnv.split('/');
    return { owner, repo };
  }
  return readRepoSlug(REPO_ROOT);
};

// Retried: a bare `fetch failed` from a reset connection took this job down on
// two unrelated PRs, and a label sync has nothing to lose by trying again.
const ghFetch = (token, path, init = {}) =>
  fetchWithRetry(
    () =>
      fetch(`${API}${path}`, {
        ...init,
        headers: {
          authorization: `Bearer ${token}`,
          accept: 'application/vnd.github+json',
          'x-github-api-version': '2022-11-28',
          ...(init.body === undefined
            ? {}
            : { 'content-type': 'application/json' }),
        },
      }),
    {
      onRetry: ({ attempt, reason }) =>
        console.warn(`  retrying ${path} (attempt ${attempt}): ${reason}`),
    },
  );

// The repo has well under 100 labels, so a single page covers every existing one.
const listLabelNames = async (token, owner, repo) => {
  const res = await ghFetch(
    token,
    `/repos/${owner}/${repo}/labels?per_page=100`,
  );
  if (!res.ok) {
    throw new Error(`listing labels failed: ${res.status} ${res.statusText}`);
  }
  return new Set((await res.json()).map((label) => label.name));
};

const upsertLabel = async (token, owner, repo, existing, label) => {
  const exists = existing.has(label.name);
  const path = exists
    ? `/repos/${owner}/${repo}/labels/${encodeURIComponent(label.name)}`
    : `/repos/${owner}/${repo}/labels`;
  const res = await ghFetch(token, path, {
    method: exists ? 'PATCH' : 'POST',
    body: JSON.stringify({
      name: label.name,
      color: label.color,
      description: label.description,
    }),
  });
  if (!res.ok) {
    throw new Error(
      `${exists ? 'updating' : 'creating'} \`${label.name}\` failed: ${res.status}`,
    );
  }
  return exists ? 'updated' : 'created';
};

const main = async () => {
  const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
  if (token === undefined) {
    console.log('No GITHUB_TOKEN / GH_TOKEN — skipping label sync.');
    return;
  }
  const slug = repoSlug();
  if (slug === undefined) {
    throw new Error('could not determine owner/repo (set GITHUB_REPOSITORY).');
  }
  const { owner, repo } = slug;
  const labels = buildLabelDefinitions(deriveWorkspaces(REPO_ROOT));
  const existing = await listLabelNames(token, owner, repo);
  const results = await Promise.all(
    labels.map((label) => upsertLabel(token, owner, repo, existing, label)),
  );
  const created = results.filter((result) => result === 'created').length;
  console.log(
    `Labels synced for ${owner}/${repo}: ${created} created, ${results.length - created} updated, ${labels.length} total.`,
  );
};

try {
  await main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
