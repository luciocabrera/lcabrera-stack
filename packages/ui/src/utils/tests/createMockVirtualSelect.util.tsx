/**
 * The option-list stand-in every suite that mocks `VirtualSelect` renders.
 */

type CreateMockVirtualSelectArgs = {
  readonly testId?: string;
};

type MockVirtualSelectProps = {
  readonly onChange: (values: readonly string[]) => void;
  readonly options: readonly {
    readonly label: string;
    readonly value: string;
  }[];
  readonly placeholder?: string;
};

export const createMockVirtualSelect = ({
  testId,
}: CreateMockVirtualSelectArgs = {}) => {
  return ({ onChange, options, placeholder }: MockVirtualSelectProps) => (
    <ul data-testid={testId ?? placeholder}>
      {options.map((option) => (
        <li key={option.value}>
          <button
            onClick={() => {
              onChange([option.value]);
            }}
            type='button'
          >
            {option.label}
          </button>
        </li>
      ))}
    </ul>
  );
};
