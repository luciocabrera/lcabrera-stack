/**
 * Reads a workflow file the way its invariant tests need to read it.
 *
 * The review gates encode two things a linter cannot see: a job must never share
 * a name with the commit status it publishes, and the absence of a cancelling
 * concurrency group is deliberate. Both are asserted from the file's own text,
 * and the readers were copy-pasted between the first two test files before a
 * third arrived — which is exactly the drift `.claude/rules/scripts.md` means by
 * "shared logic imported, not copy-pasted".
 *
 * Governed by .claude/rules/scripts.md.
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** One repo-relative file, as text. */
export const readRepoFile = (path) =>
  readFileSync(join(REPO_ROOT, path), 'utf8');

/**
 * Every `name:` a workflow declares — workflow, job and step alike.
 *
 * The value starts at a non-space (`\S`) rather than at `.`: `[ \t]*` and `.`
 * both match a space, and that overlap is what gives the pattern super-linear
 * backtracking on a line padded with whitespace (Sonar S8786). Anchoring the
 * capture to a non-space makes the two halves disjoint and captures the same
 * text, since the leading run is consumed either way.
 */
export const declaredNames = (source) =>
  [...source.matchAll(/^[ \t]*name:[ \t]*(\S.*)$/gm)].map((match) =>
    match[1].trim(),
  );

/**
 * A workflow's comments as running prose.
 *
 * Read this way, not line by line: a YAML comment wraps wherever it must, so
 * matching the raw text would pin the line breaks rather than what they say.
 */
export const commentProse = (source) =>
  source.replaceAll(/^[ \t]*#[ \t]?/gm, '').replaceAll(/\s+/gu, ' ');

/**
 * The value of a single-quoted `const NAME = '…'` in a script, so a test
 * compares against the one definition rather than a second copy of the string.
 *
 * Returns `undefined` when the declaration is not there; every caller asserts on
 * that rather than defaulting, because an empty string would satisfy every
 * downstream assertion while checking nothing.
 */
export const singleQuotedConst = (source, name) => {
  const marker = `const ${name} = '`;
  const start = source.indexOf(marker);
  if (start === -1) {
    return undefined;
  }
  const rest = source.slice(start + marker.length);
  return rest.slice(0, rest.indexOf("'"));
};
