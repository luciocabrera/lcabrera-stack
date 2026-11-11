import type { RadioOption } from '#ui/components/RadioOptionGroup';

export type SettingsOptionGroupProps<TValue extends string> = {
  readonly name: string;
  readonly onChange: (value: TValue) => void;
  readonly options: readonly RadioOption<TValue>[];
  readonly title: string;
  readonly value: TValue;
};
