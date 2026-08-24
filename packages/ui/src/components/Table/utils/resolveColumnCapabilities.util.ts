/**
 * Every capability a column carries, resolved: no optional member, so a surface
 * that destructures this cannot re-derive a default by accident.
 */
type ColumnCapabilities = {
  readonly isFilterable: boolean;
  /**
   * Not vetoed by `isStatic`: static locks a column's *layout* against the user, while
   * grouping restates the query — a pinned, unmovable column is still a perfectly good
   * dimension.
   * The route's endpoint has the final say either way (ADR-058).
   */
  readonly isGroupable: boolean;
  readonly isResizable: boolean;
  readonly isSortable: boolean;
  readonly isStatic: boolean;
};

type ColumnCapabilityFlags = Partial<ColumnCapabilities>;

const COLUMN_CAPABILITY_DEFAULTS: ColumnCapabilities = {
  isFilterable: true,
  isGroupable: true,
  isResizable: true,
  isSortable: true,
  isStatic: false,
};

/**
 * false` at the point of use, and `deriveToggleCommandState` takes its availability from
 * it.
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
