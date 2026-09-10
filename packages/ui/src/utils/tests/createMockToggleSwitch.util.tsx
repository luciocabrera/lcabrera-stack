type MockToggleSwitchProps = {
  readonly isBusy?: boolean;
  readonly isChecked: boolean;
  readonly isDisabled?: boolean;
  readonly label: string;
  readonly onChange: (isChecked: boolean) => void;
};

export const MockToggleSwitch = ({
  isChecked,
  isDisabled,
  label,
  onChange,
}: MockToggleSwitchProps) => (
  <button
    aria-label={`${label}-${isChecked ? 'on' : 'off'}`}
    disabled={isDisabled}
    onClick={() => {
      onChange(!isChecked);
    }}
    type='button'
  >
    {label}
  </button>
);
