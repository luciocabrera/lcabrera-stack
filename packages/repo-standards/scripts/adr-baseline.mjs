/**
 * The grandfathering arithmetic for the ADR content rules — pure, so the
 * escape hatch is reviewable without reading any I/O.
 *
 * The records that predate the classification block are not edited into shape.
 * An ADR is a dated record, so a bulk rewrite of ninety of them would touch the
 * one kind of file this repository never rewrites, to satisfy a rule none of
 * them were written under. They are listed instead, and the list is held to a
 * contract with one direction: it may SHRINK, and it may not GROW.
 *
 * **Growth is a question about the list's size, not about any record's number.**
 * The first cut of this bounded it by number — nothing above the highest ADR
 * present at adoption could be grandfathered — and that is a proxy, not the
 * property. A sequence has gaps (this repository's has twenty-three), and a
 * record taking a retired number lands inside any window, so one appended line
 * grandfathered a brand-new empty ADR and the gate passed. `maxEntries` is the
 * property itself: the most entries the baseline may hold, which no numbering
 * can slip past.
 *
 * Which doors that shuts, and which it does not:
 *
 * - **Shut: every command.** `--adopt` refuses a baseline that already exists,
 *   so there is no command that turns today's failures into tomorrow's
 *   exemptions. `--write` only prunes, and it RATCHETS `maxEntries` down to what
 *   it kept — it never raises it, so it cannot launder a hand-added entry into
 *   a baseline the next run calls clean.
 * - **Shut: appending an entry.** The list is then longer than its own bound,
 *   whatever the entry is numbered, and the gate says so.
 * - **Shut: swapping one entry for another.** The record dropped out of the
 *   list is no longer grandfathered and reports its own findings.
 * - **NOT shut: raising `maxEntries` by hand.** Nothing in a tracked file can be
 *   proof against an editor. What the bound buys is that reopening
 *   grandfathering is a single number changing in a diff, rather than one line
 *   appended to a list of seventy that read alike.
 *
 * Shape: `{ files: [<filename>], maxEntries: <number> }`.
 */

/**
 * Deterministic across locales, unlike `localeCompare`: the baseline is a
 * committed file, so a comparator that depends on the machine reading it would
 * reorder the list in someone else's checkout and show as a diff nobody made.
 */
const byName = (left, right) => {
  if (left === right) {
    return 0;
  }
  return left < right ? -1 : 1;
};

/** A baseline that grandfathers nothing — what an absent file means. */
export const EMPTY_BASELINE = { files: [], maxEntries: 0 };

const isRecord = (value) =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * A parsed baseline reduced to the two fields, so a malformed file cannot make
 * the gate read `undefined` as "grandfather everything". A missing or unusable
 * `files` yields none; an unusable `maxEntries` yields zero, which reports as
 * growth rather than as a bound nobody set.
 */
export const readableBaseline = (parsed) => {
  if (!isRecord(parsed)) {
    return EMPTY_BASELINE;
  }
  return {
    files: Array.isArray(parsed.files)
      ? parsed.files.filter((name) => typeof name === 'string')
      : [],
    maxEntries:
      Number.isInteger(parsed.maxEntries) && parsed.maxEntries >= 0
        ? parsed.maxEntries
        : 0,
  };
};

export const baselinedFiles = (baseline) => new Set(baseline.files);

/** Whether the list is longer than the bound the last command wrote. */
export const hasGrown = (baseline) =>
  baseline.files.length > baseline.maxEntries;

const plural = (count) => (count === 1 ? 'entry' : 'entries');

const growthFinding = (baseline) =>
  `it lists ${baseline.files.length} ${plural(baseline.files.length)} but \`maxEntries\` is ${baseline.maxEntries} — the baseline has grown, and it may only shrink. Drop what was added, or classify the records it covers.`;

/**
 * What the baseline itself gets wrong.
 *
 * `records` is `{ filename, findings, number }` per ADR — `findings` being what
 * the content rules say about it, so this module never parses a record itself.
 */
export const baselineFindings = ({ baseline, records }) => {
  const byFilename = new Map(
    records.map((record) => [record.filename, record]),
  );

  return [
    ...(hasGrown(baseline) ? [growthFinding(baseline)] : []),
    ...baseline.files.flatMap((filename) => {
      const record = byFilename.get(filename);
      if (record === undefined) {
        return [
          `${filename} is grandfathered but names no ADR — prune it with \`--write\``,
        ];
      }
      return record.findings.length === 0
        ? [
            `${filename} is grandfathered but now satisfies the content rules — prune it with \`--write\``,
          ]
        : [];
    }),
  ];
};

/**
 * The baseline with every entry that no longer earns its place removed, and the
 * bound lowered to match — the only automatic edit there is.
 *
 * The bound is taken from what was KEPT rather than from `Math.min` with the old
 * one, so it can only fall. Callers must refuse to write a grown baseline before
 * calling this; otherwise pruning a list of 71 with a bound of 70 would rewrite
 * the bound as 71 and absorb the growth.
 */
export const prunedBaseline = ({ baseline, records }) => {
  const kept = new Set(
    records
      .filter((record) => record.findings.length > 0)
      .map((record) => record.filename),
  );
  const files = baseline.files
    .filter((filename) => kept.has(filename))
    .toSorted(byName);
  return { files, maxEntries: files.length };
};

/**
 * The baseline a repository adopting the gate starts from: everything failing
 * today, and a bound at exactly that many.
 *
 * Written once and never again — the caller refuses to overwrite an existing
 * file, because a second adoption is exactly the "absorb today's failures"
 * command this contract exists to not have.
 */
export const adoptedBaseline = (records) => {
  const files = records
    .filter((record) => record.findings.length > 0)
    .map((record) => record.filename)
    .toSorted(byName);
  return { files, maxEntries: files.length };
};
