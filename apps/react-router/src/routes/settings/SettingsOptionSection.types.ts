export type SettingsOptionSectionProps<TValue extends string> = {
  readonly description: string;
  readonly name: string;
  readonly onChange: (value: TValue) => void;
  readonly options: readonly {
    readonly description?: string;
    readonly label: string;
    readonly value: TValue;
  }[];
  readonly title: string;
  readonly value: TValue;
};
