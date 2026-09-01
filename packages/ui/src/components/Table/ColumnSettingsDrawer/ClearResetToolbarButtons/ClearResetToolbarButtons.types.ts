export type ClearResetToolbarButtonsProps = {
  readonly clearLabel: string;
  /** Hover text for Clear — the only channel a disabled button has. */
  readonly clearTitle?: string;
  readonly hasValue: boolean;
  readonly isBusy?: boolean;
  readonly onClear: () => void;
  readonly onReset: () => void;
  readonly resetLabel: string;
  readonly variant: 'footer' | 'toolbar';
};
