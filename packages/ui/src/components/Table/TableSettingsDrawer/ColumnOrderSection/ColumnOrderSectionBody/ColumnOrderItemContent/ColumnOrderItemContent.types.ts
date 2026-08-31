export type ColumnOrderItemContentProps = {
  readonly columnKey: string;
  readonly isBusy?: boolean;
  /** Locked in place and forced visible while grouping is applied, without being static. */
  readonly isGroupKey: boolean;
  readonly isPinned: boolean;
  readonly isStatic: boolean;
  readonly isVisible: boolean;
  readonly label: string;
};
