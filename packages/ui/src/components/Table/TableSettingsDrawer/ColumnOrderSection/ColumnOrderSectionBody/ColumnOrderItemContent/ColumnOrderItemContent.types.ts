export type ColumnOrderItemContentProps = {
  readonly columnKey: string;
  readonly isBusy?: boolean;
  /**
   * Whether the column is currently a group key — locked in place and forced
   * visible while grouping is applied, without being static (ADR-080).
   */
  readonly isGroupKey: boolean;
  readonly isPinned: boolean;
  readonly isStatic: boolean;
  readonly isVisible: boolean;
  readonly label: string;
};
