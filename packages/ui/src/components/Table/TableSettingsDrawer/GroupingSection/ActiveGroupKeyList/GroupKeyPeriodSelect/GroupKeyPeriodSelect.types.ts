export type GroupKeyPeriodSelectProps = {
  /** The applied group key this control sets the granularity of. */
  readonly columnKey: string;
  readonly isBusy: boolean;
  /** The column's label, so the control can name itself for a screen reader. */
  readonly label: string;
};
