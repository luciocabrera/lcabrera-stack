/**
 * Every capability a column carries, resolved: no optional member, so a surface
 * that destructures this cannot re-derive a default by accident.
 */
type ColumnCapabilities = {
  readonly isFilterable: boolean;
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
