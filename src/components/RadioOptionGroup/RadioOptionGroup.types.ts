export type RadioOption = {
  description?: string;
  label: string;
  value: string;
};

export type RadioOptionGroupProps = {
  /** Radio group name attribute */
  name: string;
  /** Called when the selected value changes */
  onChange: (value: string) => void;
  /** Available options */
  options: RadioOption[];
  /** Currently selected value */
  value: string;
};
