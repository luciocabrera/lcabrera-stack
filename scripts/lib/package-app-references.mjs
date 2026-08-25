/**
 * The rule: a published package may not point at one of this repository's apps.
 * Apps are the harness; packages are consumed from outside this repo, where no
 * `apps/` directory exists — so a relative link into one is dead on arrival, and
 * prose about one describes a consumer the reader does not have.
 *
 * Existence is what discriminates a real reference from a worked example, but
 * only outside fenced code: `apps/web` in a config sample must keep passing on
 * the day this repo gains an `apps/web`, so fences are skipped rather than
 * resolved. Tests are skipped too — every package here excludes them from
 * `files`, so they reach no consumer.
 */

/** A path segment, so prose about "the apps directory" is not a finding. */
const APP_PATH = /\bapps\/[a-z0-9][a-z0-9-]*/g;

/** Generated from git history — a dated record, not a live pointer. */
const GENERATED = /(^|\/)CHANGELOG\.md$/;

/**
 * `.test.*` is what every published package excludes from `files`. `.spec.*` is
 * a sanctioned suffix here but no manifest excludes it, so one would ship and is
 * checked — widen this only alongside the manifests.
 */
const TEST = /\.test\.[a-z]+$/;

/**
 * Text a package ships. A comment in `src` reaches consumers like prose does,
 * and so does a workflow template's `paths:` filter — `@lcabrera/devkit` ships
 * `.yml` and two extensionless git hooks, which is why this is not a source
 * extension list. Anything without an extension is text here; binaries carry one.
 */
const SHIPPED_TEXT = /\.(css|js|md|mjs|ts|tsx|ya?ml)$/;
const NO_EXTENSION = /(^|\/)[^./]+$/;

export const isCheckedFile = (path) =>
  (SHIPPED_TEXT.test(path) || NO_EXTENSION.test(path)) &&
  !GENERATED.test(path) &&
  !TEST.test(path);

/** 1-based line numbers sitting inside a ``` fence. Markdown only. */
const fencedLines = (text) => {
  const fenced = new Set();
  let open = false;
  text.split('\n').forEach((line, index) => {
    if (line.trimStart().startsWith('```')) {
      open = !open;
      fenced.add(index + 1);
      return;
    }
    if (open) {
      fenced.add(index + 1);
    }
  });
  return fenced;
};

/**
 * One finding per occurrence, not per distinct name: two mentions on different
 * lines are two separate edits, and a verify script lists every discrepancy.
 *
 * `exists` takes a repo-relative path; injected so this stays testable.
 */
export const appReferences = ({ exists, path, text }) => {
  const skip = path.endsWith('.md') ? fencedLines(text) : new Set();
  return [...text.matchAll(APP_PATH)]
    .map((match) => ({
      line: text.slice(0, match.index).split('\n').length,
      path,
      reference: match[0],
    }))
    .filter(({ line, reference }) => !skip.has(line) && exists(reference));
};

export const formatFinding = ({ line, path, reference }) =>
  `${path}:${line} — a published package names \`${reference}\`, which exists ` +
  `in this repo. Packages are generic; state the property, not this consumer.`;
