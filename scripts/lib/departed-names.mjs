/**
 * The rule: nothing in this repository names a product or workspace that left it.
 *
 * The names are a declared roster rather than something derived, because the
 * absence of a name from the tree cannot distinguish "departed" from "a generic
 * example" — which is why the earlier attempts at this class were left ungated.
 * Naming them outright is what makes the check decidable.
 *
 * Matching is case-insensitive and substring-based, not word-bounded: the roster
 * holds path-shaped and snake_case names that no single word boundary spans, and
 * a departed name inside a longer token is still that name. Fenced code is
 * scanned like prose — a fixture naming a departed workspace is exactly the case
 * this exists to catch.
 */

/** Generated from git history — a dated record of commits, not a live pointer. */
const GENERATED = /(^|\/)CHANGELOG\.md$/;

/** The roster names every departed thing, so it can never be its own finding. */
const ROSTER = /(^|\/)departed-names\.json$/;

/**
 * Everything tracked is text until proven otherwise. An allowlist of extensions
 * was tried first and silently skipped `.gitignore` and `docker/local/.env.example`
 * — both of which carried a departed name — because neither has an extension the
 * list could hold. A gate for prose should err toward reading a file, so the
 * exclusions are the binaries and the two files that are records, not pointers.
 */
const BINARY_EXTENSIONS = new Set([
  'avif',
  'bmp',
  'db',
  'dll',
  'eot',
  'exe',
  'gif',
  'gz',
  'ico',
  'jar',
  'jpeg',
  'jpg',
  'mov',
  'mp3',
  'mp4',
  'node',
  'otf',
  'pdf',
  'png',
  'so',
  'sqlite',
  'tar',
  'tgz',
  'tif',
  'tiff',
  'ttf',
  'wasm',
  'wav',
  'webm',
  'webp',
  'woff',
  'woff2',
  'zip',
]);
const LOCKFILE = /(^|\/)(pnpm-lock\.yaml|package-lock\.json)$/;

/** A leading dot is a name, not an extension: `.gitignore` is text. */
const extensionOf = (path) => {
  const name = path.slice(path.lastIndexOf('/') + 1);
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : '';
};

export const isCheckedFile = (path) =>
  !BINARY_EXTENSIONS.has(extensionOf(path)) &&
  !GENERATED.test(path) &&
  !ROSTER.test(path) &&
  !LOCKFILE.test(path);

/**
 * Reads the roster into the two shapes the scan needs. Throws rather than
 * returning an empty roster: a gate that checks no names passes every tree.
 */
export const parseRoster = (text) => {
  const roster = JSON.parse(text);
  const names = (roster.names ?? []).map(({ name }) => name);
  if (names.length === 0) {
    throw new Error(
      'departed-names.json lists no names — the gate would pass anything.',
    );
  }
  const blank = names.find(
    (name) => typeof name !== 'string' || name.trim() === '',
  );
  if (blank !== undefined) {
    throw new Error(
      'departed-names.json has an empty name — it would match every line.',
    );
  }
  return {
    allowed: new Set((roster.allow ?? []).map(({ path }) => path)),
    names,
  };
};

/**
 * Paths of REGULAR files in `git ls-files -s -z` output (`<mode> <sha> <stage>\t<path>`).
 *
 * Mode is git's own answer, so no stat call can disagree with it. Both other
 * modes must be dropped, and neither is hypothetical here: `120000` is a
 * symlink — `.claude/skills` points at a directory, so reading it raises EISDIR,
 * while `CLAUDE.md` and two others point at `AGENTS.md`, which git tracks in its
 * own right and which would otherwise be reported once per link. `160000` is a
 * submodule gitlink, which has no blob to read at all.
 */
export const regularFiles = (output) =>
  output
    .split('\0')
    .filter(Boolean)
    .map((entry) => /^(\d{6}) \S+ \d+\t(.+)$/s.exec(entry))
    .filter(
      (match) =>
        match !== null && (match[1] === '100644' || match[1] === '100755'),
    )
    .map((match) => match[2]);

/** One finding per occurrence: two mentions on two lines are two edits. */
export const departedReferences = ({ allowed, names, path, text }) => {
  if (allowed.has(path)) return [];
  return text.split('\n').flatMap((line, index) => {
    const haystack = line.toLowerCase();
    return names
      .filter((name) => haystack.includes(name.toLowerCase()))
      .map((name) => ({ line: index + 1, name, path }));
  });
};

export const formatFinding = ({ line, name, path }) =>
  `${path}:${line} — names \`${name}\`, which left this repository. Describe ` +
  `the property or constraint, not the thing that used to supply it.`;
