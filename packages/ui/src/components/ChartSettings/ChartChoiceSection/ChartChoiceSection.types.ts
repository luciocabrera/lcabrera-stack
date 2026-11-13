export type ChartChoiceSectionProps = {
  readonly name: string;
  readonly onChange: (value: string) => void;
  readonly options: readonly {
    readonly label: string;
    readonly value: string;
  }[];
  readonly title: string;
  readonly value: string;
};
