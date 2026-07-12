export type ColumnOrderItemContentProps = {
  /** Key of the column this row represents */
  readonly columnKey: string;
  /** Whether the row toggles should render in busy state */
  readonly isBusy?: boolean;
  /** Whether the column is currently pinned to either side */
  readonly isPinned: boolean;
  /** Whether the column is static (locked position, always visible) */
  readonly isStatic: boolean;
  /** Whether the column is currently visible */
  readonly isVisible: boolean;
  /** Display label of the column */
  readonly label: string;
};
