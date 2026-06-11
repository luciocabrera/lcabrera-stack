export type ClearResetToolbarButtonsProps = {
  readonly clearLabel: string;
  readonly hasValue: boolean;
  readonly onClear: () => void;
  readonly onReset: () => void;
  readonly resetLabel: string;
  readonly variant: 'footer' | 'toolbar';
};
