export type FocusTableCellArgs = {
  readonly columnKey: string;
  readonly rowIndex: number;
  /** Data-derived identity of the cell's row (ADR-062). */
  readonly rowKey: string;
};
