/**
 * Reads the `origin` remote's owner/repo and https URL from `.git/config` — no
 * `git` subprocess, so nothing resolves through PATH (keeps the callers free of
 * Sonar's S4036 hotspot, the same reason verify-coordination.mjs reads refs off
 * the filesystem). Returns undefined when it can't be determined. See
 * `.claude/rules/scripts.md`.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ORIGIN_URL = /\[remote "origin"\][^[]*?url\s*=\s*(\S+)/;
const OWNER_REPO = /[:/]([^/]+)\/([^/]+?)(?:\.git)?$/;

export const readRepoSlug = (repoRoot) => {
  const configPath = join(repoRoot, '.git', 'config');
  if (!existsSync(configPath)) {
    return undefined;
  }
  const urlMatch = ORIGIN_URL.exec(readFileSync(configPath, 'utf8'));
  if (urlMatch === null) {
    return undefined;
  }
  const slug = OWNER_REPO.exec(urlMatch[1]);
  if (slug === null) {
    return undefined;
  }
  const [, owner, repo] = slug;
  return { owner, repo, httpsUrl: `https://github.com/${owner}/${repo}` };
};
