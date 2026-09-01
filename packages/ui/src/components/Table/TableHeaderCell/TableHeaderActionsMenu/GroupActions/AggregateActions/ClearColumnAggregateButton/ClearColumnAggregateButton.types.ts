/** Props for the "No Aggregate" item of the grouping section. */
export type ClearColumnAggregateButtonProps = {
  readonly columnKey: string;
  readonly onClose: () => void;
  /** Hover text stating what a clear takes with it, on a measure's menu. */
  readonly title?: string;
};
