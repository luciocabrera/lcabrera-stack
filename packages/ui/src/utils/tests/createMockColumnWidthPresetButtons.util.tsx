type MockColumnWidthPresetButtonsProps = {
  readonly isMaxDisabled?: boolean;
  readonly isMinDisabled?: boolean;
  readonly onToggleDefault: () => void;
  readonly onToggleMax: () => void;
  readonly onToggleMin: () => void;
  readonly selectedPreset?: string;
};

export const MockColumnWidthPresetButtons = ({
  isMaxDisabled,
  isMinDisabled,
  onToggleDefault,
  onToggleMax,
  onToggleMin,
  selectedPreset = 'none',
}: MockColumnWidthPresetButtonsProps) => (
  <div data-selected-preset={selectedPreset}>
    <button disabled={isMinDisabled} onClick={onToggleMin} type='button'>
      Min
    </button>
    <button disabled={isMaxDisabled} onClick={onToggleMax} type='button'>
      Max
    </button>
    <button onClick={onToggleDefault} type='button'>
      Default
    </button>
  </div>
);
