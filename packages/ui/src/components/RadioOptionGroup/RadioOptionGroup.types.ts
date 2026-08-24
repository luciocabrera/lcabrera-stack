export type RadioOption<TValue extends string = string> = {
  readonly description?: string;
  readonly label: string;
  readonly value: TValue;
};

export type RadioOptionGroupProps<TValue extends string = string> = {
  readonly name: string;
  readonly onChange: (value: TValue) => void;
  readonly options: readonly RadioOption<TValue>[];
  readonly value: TValue;
};
