/**
 * Reads the `origin` remote's owner/repo and https URL from `.git/config` — no
 * `git` subprocess, so nothing resolves through PATH (keeps the callers free of
 * Sonar's S4036 hotspot, the same reason verify-coordination.mjs reads refs off
 * the filesystem). Returns undefined when it can't be determined. See
 * `.claude/rules/scripts.md`.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DOT_GIT = /\.git$/;

/** The `url` of the `[remote "origin"]` section — a line scan, not a backtracking
 *  regex over the whole file. */
const originUrl = (configText) => {
  let inOrigin = false;
  for (const raw of configText.split('\n')) {
    const line = raw.trim();
    if (line.startsWith('[')) {
      inOrigin = line === '[remote "origin"]';
    } else if (inOrigin && line.startsWith('url')) {
      const equals = line.indexOf('=');
      if (equals !== -1) {
        return line.slice(equals + 1).trim();
      }
    }
  }
  return undefined;
};

/** The last two path segments of an origin URL (owner/repo), handling both
 *  `https://host/owner/repo(.git)` and `git@host:owner/repo(.git)`. Split-based,
 *  so no backtracking regex. */
const ownerRepo = (url) => {
  const segments = url.replace(DOT_GIT, '').split(/[:/]/).filter(Boolean);
  return segments.length < 2
    ? undefined
    : { owner: segments.at(-2), repo: segments.at(-1) };
};

export const readRepoSlug = (repoRoot) => {
  const configPath = join(repoRoot, '.git', 'config');
  if (!existsSync(configPath)) {
    return undefined;
  }
  const url = originUrl(readFileSync(configPath, 'utf8'));
  if (url === undefined) {
    return undefined;
  }
  const slug = ownerRepo(url);
  return slug === undefined
    ? undefined
    : { ...slug, httpsUrl: `https://github.com/${slug.owner}/${slug.repo}` };
};
