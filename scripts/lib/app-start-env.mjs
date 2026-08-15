/**
 * Pure readers for the two ends of this repo's local-env wiring, so the pair can
 * be asserted rather than only reviewed (`app-start-env.test.mjs`).
 *
 * Why this exists: `@lcabrera/vite-config/run` takes the env-file list as an
 * argument, because the path is this repo's dev-compose layout and no
 * consumer's (ADR-069). That is right for the package and it moved the #329
 * production fix — a bare `react-router-serve` inherits no environment, so the
 * first DB-backed request throws — from something the shared factory guaranteed
 * to something each app opts into. An opt-in nothing reads is an opt-in that can
 * be deleted silently.
 *
 * Both readers parse a real artifact rather than restating a constant: one reads
 * the shell fragment an app's `start` task actually emits, the other reads the
 * compose env file the root database scripts actually pass. Restating the path
 * here would make the test agree with itself.
 *
 * Governed by .claude/rules/scripts.md.
 */

/**
 * The env files a `start` command sources, app-relative and in load order.
 *
 * Keyed on the `[ -f … ]` guard rather than on the `eval` that follows it: the
 * guard is what makes a missing file skippable rather than fatal, so a fragment
 * without one is not this wiring however much it looks like it.
 */
export const startEnvFiles = (command) =>
  [...command.matchAll(/\[ -f (\S+) \]/g)].map(([, file]) => file);

/**
 * The `--env-file` path a compose command passes, repo-root-relative.
 *
 * `undefined` when the script names none, which the caller must treat as a
 * failure: it would otherwise turn "the two ends disagree" into "there was
 * nothing to compare", and a comparison against nothing passes.
 */
export const composeEnvFile = (script) =>
  /--env-file\s+(\S+)/.exec(script ?? '')?.[1];
