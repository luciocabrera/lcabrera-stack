// Spawning git under the same discipline the repo this was extracted from
// applies, restated here rather than imported because a published package
// cannot depend on that repo's tooling. Two reasons, and one consequence:
//
// - **The environment outranks `cwd`.** Verified against two throwaway repos
//   on git 2.53: from inside repo A, `GIT_WORK_TREE=<B>` makes
//   `rev-parse --show-toplevel` answer `B` — an unrelated project — and
//   `GIT_DIR=<B>/.git` alone answers with the current directory rather than
//   A's real top level. Both are wrong, differently, and the specific
//   mechanism is not worth reasoning about at a call site: anything holding
//   one of these when the runner is spawned passes it down, and an
//   orchestrator is exactly such a parent. So all seven are scrubbed, not the
//   one that looked dangerous.
// - **PATH is pinned to fixed directories** and the binary is named outright,
//   so a writable directory earlier in the inherited PATH cannot shadow the
//   real git (Sonar S4036).
// - **A git that cannot be found is announced, not swallowed.** The answer
//   here becomes every finding's `location_path`, and "not a repository" and
//   "no git installed" would otherwise be the same silent `undefined`.
//
// The originating repo's `scripts/lib/git-exec.test.mjs` asserts this variable
// list agrees with its other copies, so the duplication cannot drift.

import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { isAbsolute } from 'node:path';

/** An absolute path to a git binary, when the host keeps it somewhere unusual. */
export const GIT_BINARY_ENV = 'SCAN_REPORT_GIT_BINARY';

/**
 * Fixed directories to look for git in — never the inherited PATH, which is
 * the lookup this exists to avoid.
 *
 * The list covers the package managers that do not install into `/usr/bin`,
 * because this ships: Homebrew on both architectures, Nix system and per-user
 * profiles, Xcode's command line tools, and Git for Windows. A host outside
 * all of them sets `SCAN_REPORT_GIT_BINARY` rather than going without.
 */
const trustedDirectories = (env) =>
  [
    '/usr/local/bin',
    '/usr/bin',
    '/bin',
    '/opt/homebrew/bin',
    '/opt/local/bin',
    '/run/current-system/sw/bin',
    env.HOME ? `${env.HOME}/.nix-profile/bin` : undefined,
    '/Library/Developer/CommandLineTools/usr/bin',
    String.raw`C:\Program Files\Git\cmd`,
    String.raw`C:\Program Files (x86)\Git\cmd`,
  ].filter((directory) => directory !== undefined);

/**
 * Every variable through which git can be told which repository to operate on.
 * `GIT_CEILING_DIRECTORIES` and `GIT_DISCOVERY_ACROSS_FILESYSTEM` are
 * deliberately absent: they only ever make discovery stricter.
 */
export const GIT_REPOSITORY_VARIABLES = [
  'GIT_ALTERNATE_OBJECT_DIRECTORIES',
  'GIT_COMMON_DIR',
  'GIT_DIR',
  'GIT_INDEX_FILE',
  'GIT_NAMESPACE',
  'GIT_OBJECT_DIRECTORY',
  'GIT_WORK_TREE',
];

/** A denylist, not an allowlist — git still needs HOME, the locale, and so on. */
export const buildGitEnv = (env) => ({
  ...Object.fromEntries(
    Object.entries(env).filter(
      ([name]) => !GIT_REPOSITORY_VARIABLES.includes(name),
    ),
  ),
  PATH: trustedDirectories(env).join(process.platform === 'win32' ? ';' : ':'),
});

/**
 * The git binary as an absolute path, or `undefined` with the reason, so the
 * caller can tell "no git here" from "not a repository".
 */
export const resolveGitBinary = (env = process.env) => {
  const override = env[GIT_BINARY_ENV];
  if (override) {
    return isAbsolute(override) && existsSync(override)
      ? { path: override }
      : {
          reason: `${GIT_BINARY_ENV} is set to \`${override}\`, which is not an existing absolute path.`,
        };
  }
  const searched = trustedDirectories(env);
  const found = searched
    .map((directory) => `${directory}/git`)
    .find((path) => existsSync(path));
  return found
    ? { path: found }
    : {
        reason: `no git binary in any of ${searched.join(', ')}. Set ${GIT_BINARY_ENV} to its absolute path.`,
      };
};

let announcedMissingGit = false;

/**
 * Trimmed stdout, or `undefined` when git could not answer — it is not
 * installed where this can see it, the path is not a repository, or the
 * command failed. A missing binary is reported once on stderr, because that is
 * a host misconfiguration rather than a fact about the scanned directory, and
 * silently treating it as "not a repository" makes every `location_path`
 * subtly wrong with nothing to say so.
 */
export const runGit = ({ args, cwd }) => {
  const binary = resolveGitBinary();
  if (binary.path === undefined) {
    if (!announcedMissingGit) {
      announcedMissingGit = true;
      console.error(
        `Cannot run git: ${binary.reason} Paths in this report will be relative to the scanned directory rather than to its repository root.`,
      );
    }
    return undefined;
  }
  try {
    return execFileSync(binary.path, args, {
      cwd,
      encoding: 'utf8',
      env: buildGitEnv(process.env),
      maxBuffer: 8 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return undefined;
  }
};
