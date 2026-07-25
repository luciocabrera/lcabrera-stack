/**
 * Runs `gh` for the root tooling scripts, under the same PATH discipline
 * `git-exec.mjs` applies to spawned git.
 *
 * Why this exists rather than a bare `execFileSync('gh', …)`: spawning a bare
 * name has the OS resolve it through the inherited PATH, where a writable
 * directory earlier in the list can shadow the real binary (Sonar S4036).
 * Naming the executable outright removes the lookup, and pinning PATH for the
 * child covers whatever gh itself spawns.
 *
 * Unlike git, gh needs its own credentials, so `GH_TOKEN`/`GITHUB_TOKEN` and
 * the rest of the environment pass through untouched — only PATH is replaced.
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

/** Fixed, non-writable system directories — never the inherited PATH. */
const TRUSTED_DIRECTORIES = ['/usr/local/bin', '/usr/bin', '/bin'];

/** The gh binary as an absolute path, or `undefined` when it is not installed. */
export const ghBinary = () =>
  TRUSTED_DIRECTORIES.map((directory) => `${directory}/gh`).find((path) =>
    existsSync(path),
  );

/**
 * Trimmed stdout on success. Throws on failure, carrying gh's stderr — a
 * caller creating issues needs to know which call failed and why, unlike the
 * read-only probes `runGit` serves.
 */
export const runGh = (args) => {
  const binary = ghBinary();
  if (binary === undefined) {
    throw new Error('gh is not installed — see https://cli.github.com');
  }
  try {
    return execFileSync(binary, args, {
      encoding: 'utf8',
      env: { ...process.env, PATH: TRUSTED_DIRECTORIES.join(':') },
      maxBuffer: 8 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch (error) {
    const detail = (error.stderr ?? '').toString().trim();
    throw new Error(`gh ${args[0]} failed: ${detail || error.message}`);
  }
};
