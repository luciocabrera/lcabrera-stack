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
 * Three mechanisms hold that direction, and none of them is a promise:
 *
 * - `closedAt` is the highest number the baseline covers. An entry above it is
 *   refused, so a record written after the gate landed cannot be grandfathered
 *   at all. Raising it is a one-token diff that says exactly what it does,
 *   which is the point — a filename appended to a list of ninety says nothing.
 * - Adoption happens ONCE. `--adopt` refuses a baseline that already exists, so
 *   there is no command that turns today's failures into tomorrow's exemptions.
 * - `--write` only prunes. An entry naming no record, or naming one that now
 *   satisfies the rules, is a finding until it is dropped.
 *
 * Shape: `{ closedAt: <number>, files: [<filename>] }`.
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
export const EMPTY_BASELINE = { closedAt: 0, files: [] };

const isRecord = (value) =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * A parsed baseline reduced to the two fields, so a malformed file cannot make
 * the gate read `undefined` as "grandfather everything". A missing or unusable
 * `files` yields none, which fails loudly rather than quietly.
 */
export const readableBaseline = (parsed) => {
  if (!isRecord(parsed)) {
    return EMPTY_BASELINE;
  }
  return {
    closedAt: Number.isInteger(parsed.closedAt) ? parsed.closedAt : 0,
    files: Array.isArray(parsed.files)
      ? parsed.files.filter((name) => typeof name === 'string')
      : [],
  };
};

export const baselinedFiles = (baseline) => new Set(baseline.files);

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

  return baseline.files.flatMap((filename) => {
    const record = byFilename.get(filename);
    if (record === undefined) {
      return [
        `${filename} is grandfathered but names no ADR — prune it with \`--write\``,
      ];
    }
    if (record.findings.length === 0) {
      return [
        `${filename} is grandfathered but now satisfies the content rules — prune it with \`--write\``,
      ];
    }
    return record.number !== undefined && record.number > baseline.closedAt
      ? [
          `${filename} is above the baseline's closedAt (${baseline.closedAt}) — a record written after the gate landed carries the block; it is not grandfathered`,
        ]
      : [];
  });
};

/** The number under which a filename may be grandfathered at all. */
const withinWindow = (record, closedAt) =>
  record.number !== undefined && record.number <= closedAt;

/**
 * The baseline with every entry that no longer earns its place removed — the
 * only automatic edit there is. An entry naming nothing, one whose record now
 * passes, and one above the window all drop out.
 */
export const prunedBaseline = ({ baseline, records }) => {
  const kept = new Set(
    records
      .filter(
        (record) =>
          record.findings.length > 0 && withinWindow(record, baseline.closedAt),
      )
      .map((record) => record.filename),
  );
  return {
    closedAt: baseline.closedAt,
    files: baseline.files
      .filter((filename) => kept.has(filename))
      .toSorted(byName),
  };
};

/**
 * The baseline a repository adopting the gate starts from: everything failing
 * today, and a window closed at the highest number it holds.
 *
 * Written once and never again — the caller refuses to overwrite an existing
 * file, because a second adoption is exactly the "absorb today's failures"
 * command this contract exists to not have.
 */
export const adoptedBaseline = (records) => ({
  closedAt: records.reduce(
    (highest, record) => Math.max(highest, record.number ?? 0),
    0,
  ),
  files: records
    .filter((record) => record.findings.length > 0)
    .map((record) => record.filename)
    .toSorted(byName),
});
