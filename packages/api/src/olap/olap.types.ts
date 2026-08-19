/** The group a drill names — only what the translation reads. */
export type OlapDrillGroup = {
  readonly isSubtotal: boolean;
  readonly path: readonly OlapGroupPathEntry[];
};

/**
 * A decoded drill request: the group, plus the group keys the view was read
 * under. Both are needed — the keys are what "the path is complete" is measured
 * against, and a path shorter than them names a larger set than the row clicked.
 *
 * `periods` travels with them because a truncated key's filter is a **range**
 * and not an equality: the group `2021-06` is a value no row holds, so the
 * server cannot turn the path back into a query without knowing what it was
 * truncated by (#786).
 */
export type OlapDrillRequest = {
  readonly group: OlapDrillGroup;
  readonly groupKeys: readonly string[];
  /** The granularity each temporal key was grouped at, by column. */
  readonly periods?: Readonly<Record<string, OlapGroupPeriod>>;
};

/**
 * The granularity a date or timestamp group key is truncated to.
 *
 * **Wire vocabulary, so it lives here** — it travels in the grouping URL param
 * and again in the drill param, and both `@lcabrera/server` and `@lcabrera/ui`
 * already declare `@lcabrera/api` as a dependency (ADR-082). That is what keeps
 * it a single declaration rather than one of ADR-039's duplicated shapes: there
 * is no undeclared edge to avoid here, so there is nothing to duplicate.
 *
 * `week` is deliberately absent — `date_trunc('week', …)` is ISO Monday and a
 * reporting week is as often Sunday or fiscal, which #786 puts out of scope
 * rather than settling in passing.
 */
export type OlapGroupPeriod = 'day' | 'month' | 'quarter' | 'year';

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
