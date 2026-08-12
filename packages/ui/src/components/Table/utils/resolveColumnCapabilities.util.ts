/**
 * Every capability a column carries, resolved: no optional member, so a surface
 * that destructures this cannot re-derive a default by accident.
 */
type ColumnCapabilities = {
  readonly isFilterable: boolean;
  /**
   * Effective resizability. `isStatic` locks a column against every user
   * modification, resizing included, so it overrides an explicit
   * `isResizable: true`.
   */
  readonly isResizable: boolean;
  readonly isSortable: boolean;
  readonly isStatic: boolean;
};

/** Anything column-shaped: the flags exactly as `TableColumn` declares them. */
type ColumnCapabilityFlags = Partial<ColumnCapabilities>;

/**
 * What an omitted flag resolves to. The single home for the defaults — the
 * flags on `TableColumn` are optional and their JSDoc no longer restates a
 * value, so changing a default is a one-line change here.
 */
const COLUMN_CAPABILITY_DEFAULTS: ColumnCapabilities = {
  isFilterable: true,
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
    isResizable:
      !isStatic &&
      (column?.isResizable ?? COLUMN_CAPABILITY_DEFAULTS.isResizable),
    isSortable: column?.isSortable ?? COLUMN_CAPABILITY_DEFAULTS.isSortable,
    isStatic,
  };
};
