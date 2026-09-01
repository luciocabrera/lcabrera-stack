export type UseTableCellFocusArgs = {
  readonly columnKey: string;
  readonly rowIndex: number;
  /** Data-derived identity, never a position. */
  readonly rowKey: string;
};
