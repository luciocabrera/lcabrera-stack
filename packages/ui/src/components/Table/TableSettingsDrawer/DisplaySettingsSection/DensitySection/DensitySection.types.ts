import type { TableDensity } from '#ui/components/Table/Table.types';

import type { DEFAULT_DENSITY_CHOICE } from './DensitySection.constants';

export type DensityChoice = TableDensity | typeof DEFAULT_DENSITY_CHOICE;

export type DensitySectionProps = {
  readonly defaultLabel: string;
  /** Each level is described as its row height followed by this word; unset lists the levels by name only. */
  readonly heightSuffix?: string;
  readonly isBusy?: boolean;
  readonly name: string;
  readonly onChange: (density: TableDensity | undefined) => void;
  readonly title: string;
  readonly value: TableDensity | undefined;
};
