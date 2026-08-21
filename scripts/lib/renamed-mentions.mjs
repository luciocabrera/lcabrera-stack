/**
 * Pure half of the rename-mention gate: which documents still name a file that
 * the change under test just renamed away.
 *
 * Why this is scoped to a diff rather than to the corpus. `verify-docs-paths.mjs`
 * only considers a token that is *root-anchored*, so a backticked bare filename
 * is never checked anywhere — and widening it to every bare filename is not the
 * fix. Nearly every unresolvable bare filename in the docs is correct prose: a
 * suffix convention, or a teaching example. Reporting those is the "cries wolf"
 * failure that file's own header warns about, and baselining them would teach
 * the next reader that the gate is noise.
 *
 * A rename is different, because the failure is never "this doc is wrong" — it
 * is "a file moved and a doc did not". That makes it a property of the change,
 * so the names to look for come from the diff and an untouched document naming
 * an example filename is never examined. #604 renamed a batch of modules and
 * a CQMS ADR went on naming one of them until a human found it (#611).
 *
 * Renames only, deliberately — not deletions. A rename is provable rot: the
 * content still exists under a new name, so prose naming the old one points at
 * nothing and the fix is mechanical. A deletion is ambiguous, because a name
 * can outlive its tracked file: replaying both over this repo's history, every
 * false positive came from the deletion half (docs telling you to create a
 * `.env` that stopped being tracked, a build output sharing a basename with a
 * deleted source file). The evidence is in the PR that added this file.
 *
 * Three filters keep it precise, and each earned its place on that replay:
 *
 *   1. A name that still belongs to some tracked file is not stale. A rename
 *      that only moves a file between directories leaves its basename true.
 *   2. A line naming the old name *and* the new one is recording the move, not
 *      pointing at the old file. Per line rather than per document on purpose:
 *      an ARCHITECTURE.md listing a folder's files names the new one somewhere
 *      on the page precisely when it has been half-updated, which is the rot.
 *   3. A line that also names a filename *pattern* is describing a convention,
 *      not pointing at a file — the suffix tables in `.claude/rules/typescript.md`
 *      pair `*.constants.ts` with an example in the next cell, and a rename that
 *      happens to match the example is not a broken pointer.
 */
import {
  inlineCodeTokens,
  normaliseToken,
} from '../../packages/repo-standards/scripts/docs-paths.mjs';

/** Git reports `/`-separated paths on every platform, so this needs no `path`. */
const basenameOf = (filePath) => filePath.slice(filePath.lastIndexOf('/') + 1);

/** `git diff --diff-filter=R --name-status -M` into `{ from, to }` pairs. */
export const parseRenameDiff = (output) =>
  output
    .split('\n')
    .map((line) => line.split('\t'))
    .filter(
      ([status, from, to]) =>
        status !== undefined &&
        status.startsWith('R') &&
        from !== undefined &&
        to !== undefined,
    )
    .map(([, from, to]) => ({ from, to }));

/**
 * The basenames the change made unresolvable, each with the path that replaced
 * it. A file that only moved between directories keeps its basename resolving,
 * so only its root-anchored path went stale — which `docs:verify` already
 * checks.
 *
 * `renames` is applied to `trackedPaths` before the live set is taken, because
 * the two arrive from different snapshots: the caller diffs the working tree but
 * lists the index. Half-stage a rename — new path added, old one not yet removed
 * from the index — and the old basename still looks live, so the rename is
 * skipped and the gate reports a pass it did not earn. Rebuilding the "after"
 * set here makes both sides describe the same tree. (Diffing `--cached` instead
 * would not do it: in that same half-staged state git sees no rename at all.)
 */
export const vanishedNames = ({ renames, trackedPaths }) => {
  const renamedAway = new Set(renames.map((rename) => rename.from));
  const live = new Set(
    [
      ...trackedPaths.filter((filePath) => !renamedAway.has(filePath)),
      ...renames.map((rename) => rename.to),
    ].map((filePath) => basenameOf(filePath)),
  );
  const byName = new Map(
    renames
      .map((rename) => ({
        name: basenameOf(rename.from),
        replacedBy: rename.to,
      }))
      .filter((entry) => !live.has(entry.name))
      .map((entry) => [entry.name, entry]),
  );
  return [...byName.values()];
};

const FENCE = '```';

/**
 * Prose lines of a document, each with its 1-based number — fenced blocks
 * dropped, since the paths inside them are illustrative far more often than not.
 *
 * Tracked line by line rather than by splitting the whole document on the fence
 * delimiter, because a finding is only actionable with a line number on it.
 */
export const proseLines = (markdown) =>
  markdown.split('\n').reduce(
    (state, text, index) => {
      if (text.trimStart().startsWith(FENCE)) {
        state.fenced = !state.fenced;
        return state;
      }
      if (!state.fenced) {
        state.lines.push({ number: index + 1, text });
      }
      return state;
    },
    { fenced: false, lines: [] },
  ).lines;

/** A line naming a filename pattern is teaching a convention, not pointing. */
const describesAConvention = (tokens) =>
  tokens.some((token) => token.includes('*'));

/** A line naming the replacement too is describing the move, not following it. */
const recordsTheMove = (text, entry) =>
  text.includes(basenameOf(entry.replacedBy));

/**
 * Entries whose name appears in an inline code span on this line. Compared by
 * basename so a partial path (`ingestion/gone.constants.ts`) counts as the same
 * mention as the bare name.
 */
const mentionedOn = (text, vanished) => {
  const tokens = inlineCodeTokens(text);
  if (describesAConvention(tokens)) {
    return [];
  }
  const named = new Set(
    tokens.map((token) => basenameOf(normaliseToken(token))),
  );
  return vanished
    .filter((entry) => named.has(entry.name))
    .filter((entry) => !recordsTheMove(text, entry));
};

/** Every stale mention, in document then line order. */
export const staleMentions = ({ docs, vanished }) =>
  vanished.length === 0
    ? []
    : docs.flatMap(({ markdown, path }) =>
        proseLines(markdown).flatMap((line) =>
          mentionedOn(line.text, vanished).map((entry) => ({
            doc: path,
            line: line.number,
            name: entry.name,
            replacedBy: entry.replacedBy,
          })),
        ),
      );

/** One reported line: where the stale name is, and what it should become. */
export const describeFinding = (finding) =>
  `${finding.doc}:${finding.line}: \`${finding.name}\` — renamed to \`${finding.replacedBy}\``;
