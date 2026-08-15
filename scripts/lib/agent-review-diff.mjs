/**
 * The set of lines a pull request's diff added or modified, per file.
 *
 * `docs/agents/agent-review-contract.md` §2.4 step 5 anchors an `in-diff`
 * finding to a line **the diff added**, and step 5 is the normative definition —
 * so the check needs the added-line set, which comes straight out of the diff
 * with no hunk arithmetic. Context lines are deliberately excluded: a context
 * line is code this change did not introduce, and §3 forbids blocking on that.
 *
 * The input is GitHub's per-file patch list, not `git diff`, so the same code
 * path serves a `pull_request` run and an `issue_comment` run — the latter has
 * no PR head checked out. GitHub omits `patch` for a binary file, for a pure
 * rename, and for a file whose diff is too large; only the last of those hides
 * added lines, and that case is reported rather than assumed empty.
 *
 * Governed by .claude/rules/scripts.md.
 */

/** Anchored on the hunk header, with bounded groups — nothing can backtrack. */
const HUNK_HEADER = /^@@ -\d{1,12}(?:,\d{1,12})? \+(\d{1,12})(?:,\d{1,12})? @@/;

/**
 * The new-file line numbers a unified-diff patch adds. (pure)
 *
 * Walks the hunk body: `+` consumes a new-file line and records it, a context
 * line consumes one without recording, and `-` consumes none. A `\` line ("No
 * newline at end of file") belongs to whichever side precedes it and consumes
 * nothing.
 */
export const addedLines = (patch) => {
  const added = new Set();
  let cursor = 0;
  for (const line of patch.split('\n')) {
    const header = HUNK_HEADER.exec(line);
    if (header) {
      cursor = Number(header[1]);
    } else if (line.startsWith('+')) {
      added.add(cursor);
      cursor += 1;
    } else if (line.startsWith('-') || line.startsWith('\\')) {
      // A removed line occupies no position in the new file.
    } else {
      cursor += 1;
    }
  }
  return added;
};

/**
 * An index over the whole pull request: which lines each file added, and which
 * files carry changes whose patch GitHub withheld.
 *
 * `unreadable` is what stops this failing open — a finding citing a file whose
 * patch never arrived cannot be confirmed against the diff, and the validator
 * says so instead of quietly admitting it. (pure)
 */
export const diffIndex = (files) => {
  const added = new Map();
  const unreadable = new Set();
  for (const file of files) {
    const path = file?.filename;
    if (typeof path !== 'string') {
      continue;
    }
    if (typeof file.patch === 'string') {
      added.set(path, addedLines(file.patch));
    } else if ((file.changes ?? 0) > 0) {
      unreadable.add(path);
    } else {
      added.set(path, new Set());
    }
  }
  return { added, unreadable };
};

/** Whether `file` line `line` is one this diff added. (pure) */
export const isAddedLine = (index, file, line) =>
  index.added.get(file)?.has(line) === true;
