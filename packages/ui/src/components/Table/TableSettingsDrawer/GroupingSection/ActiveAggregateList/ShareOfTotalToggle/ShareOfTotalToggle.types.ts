export type ShareOfTotalToggleProps = {
  readonly columnKey: string;
  readonly isBusy?: boolean;
  /** The aggregate's user-facing name, used to disambiguate the control. */
  readonly label: string;
};
