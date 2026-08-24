export type OlapDrillGroup = {
  readonly isSubtotal: boolean;
  readonly path: readonly OlapGroupPathEntry[];
};

/**
 * A decoded drill request: the group, plus the group keys the view was read under.
 * `periods` travels with them because a truncated key's filter is a **range** and not an
 * equality: the group `2021-06` is a value no row holds, so the server cannot turn the
 * path back into a query without knowing what it was truncated by (#786).
 */
export type OlapDrillRequest = {
  readonly group: OlapDrillGroup;
  readonly groupKeys: readonly string[];
  /** The granularity each temporal key was grouped at, by column. */
  readonly periods?: Readonly<Record<string, OlapGroupPeriod>>;
};

/**
 * **No `label`.** A group row carries a formatted display string beside each key, and it
 * is deliberately not sent: the drill is built from `value`, and a formatted string has no
 * business reaching a query.
 */
export type OlapGroupPathEntry = {
  readonly columnKey: string;
  readonly value: unknown;
};

/**
 * The granularity a date or timestamp group key is truncated to.
 * **Wire vocabulary, so it lives here** — it travels in the grouping URL param and again
 * in the drill param, and both `@lcabrera/server` and `@lcabrera/ui` already declare
 * `@lcabrera/api` as a dependency (ADR-082).
 */
export type OlapGroupPeriod = 'day' | 'month' | 'quarter' | 'year';
