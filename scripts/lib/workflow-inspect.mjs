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

/** A step's opening line: its indentation, and the name it declares. */
const STEP_LINE = /^([ \t]*)-[ \t]+name:[ \t]*(\S.*)$/;

/**
 * One workflow step's text, from its `- name:` line to the next step at the same
 * indentation, or `undefined` when no step carries that name.
 *
 * Why a test needs this rather than a `toMatch` over the whole file: a condition
 * such as `if: steps.<id>.outcome == 'failure'` is shared by every step reacting
 * to the same failure, so an assertion anchored on it is satisfied by any one of
 * them and keeps passing with the others deleted. An anchor has to appear only in
 * the thing it protects, and a step's name is the only thing here that does.
 *
 * Assumes this repository's convention that a step opens with `- name:`. One
 * written another way returns `undefined` — a failed assertion at the call site,
 * not a silent pass.
 */
export const stepBlock = (source, name) => {
  const lines = source.split('\n');
  const start = lines.findIndex(
    (line) => STEP_LINE.exec(line)?.[2].trim() === name,
  );
  if (start === -1) {
    return undefined;
  }
  const indent = STEP_LINE.exec(lines[start])[1];
  const after = lines.slice(start + 1);
  const next = after.findIndex((line) => STEP_LINE.exec(line)?.[1] === indent);
  return [lines[start], ...(next === -1 ? after : after.slice(0, next))].join(
    '\n',
  );
};

/**
 * The value of one `env:` key inside a step, comment lines removed.
 *
 * `stepBlock` runs to the next `- name:`, so a step's text also contains the comment
 * block that introduces the step after it. A NEGATIVE assertion over that text — "this
 * step must not mention `github.token`" — is therefore governed by prose about a
 * different step, and breaks the day someone writes an ordinary sentence nearby. That
 * is a test failing for a reason unrelated to what it protects, which costs the same
 * trust as one passing for the wrong reason. Reading the key positively says the same
 * thing about the credential and cannot be tripped by prose (#866 review).
 *
 * Returns `undefined` when the step does not set the key, so a caller asserts on it
 * rather than comparing against a value that was never there.
 */
export const stepEnvValue = (step, key) => {
  const prefix = `${key}:`;
  const line = (step ?? '')
    .split('\n')
    .map((text) => text.trim())
    .filter((text) => !text.startsWith('#'))
    .find((text) => text.startsWith(prefix));
  return line === undefined ? undefined : line.slice(prefix.length).trim();
};

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
