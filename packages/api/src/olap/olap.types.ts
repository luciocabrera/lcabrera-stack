/** The group a drill names — only what the translation reads. */
export type OlapDrillGroup = {
  readonly isSubtotal: boolean;
  readonly path: readonly OlapGroupPathEntry[];
};

/**
 * A decoded drill request: the group, plus the group keys the view was read
 * under. Both are needed — the keys are what "the path is complete" is measured
 * against, and a path shorter than them names a larger set than the row clicked.
 */
export type OlapDrillRequest = {
  readonly group: OlapDrillGroup;
  readonly groupKeys: readonly string[];
};

/**
 * One group key, as it crosses the wire.
 *
 * **No `label`.** A group row carries a formatted display string beside each key,
 * and it is deliberately not sent: the drill is built from `value`, and a
 * formatted string has no business reaching a query. The richer shape a grid
 * holds is structurally assignable to this one, so a caller passes its own group
 * row unchanged and the extra member is simply not read.
 */
export type OlapGroupPathEntry = {
  readonly columnKey: string;
  readonly value: unknown;
};
