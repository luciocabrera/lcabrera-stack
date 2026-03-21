export type RadioOption<TValue extends string = string> = {
  readonly description?: string;
  readonly label: string;
  readonly value: TValue;
};

export type RadioOptionGroupProps<TValue extends string = string> = {
  /** Radio group name attribute */
  readonly name: string;
  /** Called when the selected value changes */
  readonly onChange: (value: TValue) => void;
  /** Available options */
  readonly options: readonly RadioOption<TValue>[];
  /** Currently selected value */
  readonly value: TValue;
};
