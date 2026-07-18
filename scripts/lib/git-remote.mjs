/**
 * Reads the `origin` remote's owner/repo and https URL from `.git/config` — no
 * `git` subprocess, so nothing resolves through PATH (keeps the callers free of
 * Sonar's S4036 hotspot, the same reason verify-coordination.mjs reads refs off
 * the filesystem). Returns undefined when it can't be determined. See
 * `.claude/rules/scripts.md`.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const OWNER_REPO = /[:/]([^/]+)\/([^/]+?)(?:\.git)?$/;

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

export const readRepoSlug = (repoRoot) => {
  const configPath = join(repoRoot, '.git', 'config');
  if (!existsSync(configPath)) {
    return undefined;
  }
  const url = originUrl(readFileSync(configPath, 'utf8'));
  if (url === undefined) {
    return undefined;
  }
  const slug = OWNER_REPO.exec(url);
  if (slug === null) {
    return undefined;
  }
  const [, owner, repo] = slug;
  return { owner, repo, httpsUrl: `https://github.com/${owner}/${repo}` };
};
