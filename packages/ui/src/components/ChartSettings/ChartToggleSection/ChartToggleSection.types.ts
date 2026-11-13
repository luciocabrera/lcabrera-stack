export type ChartToggle = {
  readonly isChecked: boolean;
  readonly key: string;
  readonly label: string;
  readonly onChange: (isChecked: boolean) => void;
};

export type ChartToggleSectionProps = {
  readonly title: string;
  readonly toggles: readonly ChartToggle[];
};
