// Restrict command lookup to fixed, non-writable system directories so a
// writable (potentially attacker-controlled) directory earlier in the
// inherited PATH cannot shadow the real `git` binary (Sonar S4036).
const TRUSTED_PATH = '/usr/local/bin:/usr/bin:/bin';

// Every environment variable through which git can be told which repository
// to operate on. Each one outranks the process's working directory, so any
// of them arriving from the parent makes a `cwd` argument advisory at best.
//
// `GIT_CEILING_DIRECTORIES` and `GIT_DISCOVERY_ACROSS_FILESYSTEM` are
// deliberately absent: they bound the upward search for a `.git`, so they can
// only ever make discovery stricter, never point it somewhere else.
const GIT_REPOSITORY_VARIABLES = new Set([
  'GIT_ALTERNATE_OBJECT_DIRECTORIES',
  'GIT_COMMON_DIR',
  'GIT_DIR',
  'GIT_INDEX_FILE',
  'GIT_NAMESPACE',
  'GIT_OBJECT_DIRECTORY',
  'GIT_WORK_TREE',
]);

type BuildGitChildEnvArgs = {
  readonly env: NodeJS.ProcessEnv;
};

/**
 * Builds the environment a git child process runs with, so that **`cwd` is
 * the only thing selecting the repository**.
 *
 * The reason this is not simply `{ ...process.env }`: git reads `GIT_DIR`
 * (and its relatives) in preference to the working directory. Inherit them
 * and a call explicitly scoped to one directory silently operates on
 * whichever repository the parent happened to name — returning a plausible
 * answer about the wrong repository rather than failing. Git exports `GIT_DIR`
 * to every hook, so anything invoked from a hook inherits one.
 *
 * A denylist rather than an allowlist, because git legitimately needs much of
 * the ambient environment: `HOME` for global config (which is where
 * `safe.directory` lives), the locale variables for its output. Dropping
 * those to be thorough would trade a silent wrong answer for a different
 * silent failure. The variables removed here are a closed, documented set —
 * the ones that answer "which repository", and nothing else.
 *
 * Returns a new object; the input is never mutated.
 */
export const buildGitChildEnv = ({ env }: BuildGitChildEnvArgs) => ({
  ...Object.fromEntries(
    Object.entries(env).filter(([name]) => !GIT_REPOSITORY_VARIABLES.has(name)),
  ),
  PATH: TRUSTED_PATH,
});
