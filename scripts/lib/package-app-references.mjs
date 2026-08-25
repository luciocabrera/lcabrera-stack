/**
 * The rule: a published package may not point at one of this repository's apps.
 * Apps are the harness; packages are consumed from outside this repo, where no
 * `apps/` directory exists — so a relative link into one is dead on arrival, and
 * prose about one describes a consumer the reader does not have.
 *
 * Existence is what discriminates. `apps/web` in a config example is generic
 * illustration and must pass; `apps/react-router` is this repo's data and must
 * not. An allowlist would decide the same question by hand, and rot.
 */

/** A path segment, so prose about "the apps directory" is not a finding. */
const APP_PATH = /\bapps\/[a-z0-9][a-z0-9-]*/g;

/** Generated from git history — a dated record, not a live pointer. */
const GENERATED = /(^|\/)CHANGELOG\.md$/;

export const isCheckedDocument = (path) =>
  path.endsWith('.md') && !GENERATED.test(path);

/** `exists` takes a repo-relative path; injected so this stays testable. */
export const appReferences = ({ exists, path, text }) => {
  const seen = new Map();
  for (const match of text.matchAll(APP_PATH)) {
    const reference = match[0];
    if (!seen.has(reference) && exists(reference)) {
      const line = text.slice(0, match.index).split('\n').length;
      seen.set(reference, { line, path, reference });
    }
  }
  return [...seen.values()];
};

export const formatFinding = ({ line, path, reference }) =>
  `${path}:${line} — a published package names \`${reference}\`, which exists ` +
  `in this repo. Packages are generic; state the property, not this consumer.`;
