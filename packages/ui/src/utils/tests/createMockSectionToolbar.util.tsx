type MockSectionToolbarProps = {
  readonly buttons: readonly {
    readonly isDisabled?: boolean;
    readonly key: string;
    readonly label: string;
    readonly onClick?: () => void;
  }[];
};

export const MockSectionToolbar = ({ buttons }: MockSectionToolbarProps) => (
  <div>
    {buttons.map((button) => (
      <button
        disabled={button.isDisabled}
        key={button.key}
        onClick={button.onClick}
        type='button'
      >
        {button.label}
      </button>
    ))}
  </div>
);
