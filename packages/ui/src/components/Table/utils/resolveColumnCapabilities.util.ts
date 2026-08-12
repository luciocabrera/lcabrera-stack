/**
 * Every capability a column carries, resolved: no optional member, so a surface
 * that destructures this cannot re-derive a default by accident.
 */
type ColumnCapabilities = {
  readonly isFilterable: boolean;
  /**
   * Whether the column may be offered as a group key. Not vetoed by `isStatic`:
   * static locks a column's *layout* against the user, while grouping restates
   * the query — a pinned, unmovable column is still a perfectly good dimension.
   * The route's endpoint has the final say either way (ADR-058).
   */
  readonly isGroupable: boolean;
  /**
   * Effective resizability. `isStatic` locks a column against every user
   * modification, resizing included, so it overrides an explicit
   * `isResizable: true`.
   */
  readonly isResizable: boolean;
  readonly isSortable: boolean;
  readonly isStatic: boolean;
};

/**
 * Anything column-shaped: the flags exactly as `TableColumn` declares them.
 * Reusing the resolved type as the input shape holds only while the two agree
 * member-for-member — `isResizable` already differs in meaning (raw here,
 * effective there), so a second vetoed capability is the point to split them.
 */
type ColumnCapabilityFlags = Partial<ColumnCapabilities>;

/**
 * What an **omitted** flag falls back to. The single home for the defaults —
 * the flags on `TableColumn` are optional and their JSDoc no longer restates a
 * value, so changing a fallback is a one-line change here.
 *
 * It is the whole answer for every flag but `isResizable`, which `isStatic`
 * then vetoes: a static column resolves to `false` however this constant reads.
 */
const COLUMN_CAPABILITY_DEFAULTS: ColumnCapabilities = {
  isFilterable: true,
  isGroupable: true,
  isResizable: true,
  isSortable: true,
  isStatic: false,
};

/**
 * Resolves a column's capability flags against the defaults. Every surface asks
 * this instead of spelling `x !== false` / `x === true` / `x ?? false` at the
 * point of use, and `deriveToggleCommandState` takes its availability from it.
 *
 * Accepts `undefined` because several callers look a column up by key and may
 * miss: an unknown column resolves to the defaults, which is what each site's
 * previous `?.`/`??` chain already produced.
 */
export const resolveColumnCapabilities = (
  column: ColumnCapabilityFlags | undefined,
) => {
  const isStatic = column?.isStatic ?? COLUMN_CAPABILITY_DEFAULTS.isStatic;

  return {
    isFilterable:
      column?.isFilterable ?? COLUMN_CAPABILITY_DEFAULTS.isFilterable,
    isGroupable: column?.isGroupable ?? COLUMN_CAPABILITY_DEFAULTS.isGroupable,
    isResizable:
      !isStatic &&
      (column?.isResizable ?? COLUMN_CAPABILITY_DEFAULTS.isResizable),
    isSortable: column?.isSortable ?? COLUMN_CAPABILITY_DEFAULTS.isSortable,
    isStatic,
  };
};
