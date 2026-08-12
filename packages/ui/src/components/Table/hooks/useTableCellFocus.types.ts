export type UseTableCellFocusArgs = {
  readonly columnKey: string;
  /** Absolute index of the cell's row among the loaded rows. */
  readonly rowIndex: number;
  /** Data-derived identity of the cell's row (ADR-062). */
  readonly rowKey: string;
};
