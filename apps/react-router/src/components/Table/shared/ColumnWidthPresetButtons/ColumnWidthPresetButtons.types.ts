export type ColumnWidthPresetButtonsProps = {
  readonly defaultLabel?: string;
  readonly isBusy?: boolean;
  readonly isMaxDisabled?: boolean;
  readonly isMinDisabled?: boolean;
  readonly maxLabel?: string;
  readonly minLabel?: string;
  readonly onToggleDefault: () => void;
  readonly onToggleMax: () => void;
  readonly onToggleMin: () => void;
  readonly selectedPreset?: WidthPreset;
};

export type WidthPreset = 'default' | 'max' | 'min' | undefined;
