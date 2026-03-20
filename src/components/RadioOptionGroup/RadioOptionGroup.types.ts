export type RadioOption<TValue extends string = string> = {
  description?: string;
  label: string;
  value: TValue;
};

export type RadioOptionGroupProps<TValue extends string = string> = {
  /** Radio group name attribute */
  name: string;
  /** Called when the selected value changes */
  onChange: (value: TValue) => void;
  /** Available options */
  options: RadioOption<TValue>[];
  /** Currently selected value */
  value: TValue;
};
