import type { ReactNode } from 'react';

import type { TStore } from '#ui/hooks/useStore.hook';

import type {
  ChartSettingsState,
  ChartSettingsValues,
} from '../ChartSettings.types';

export type ChartSettingsContextValue = {
  readonly label: string;
  readonly store: TStore<ChartSettingsState>;
};

export type ChartSettingsProviderProps = {
  readonly children: ReactNode;
  readonly initialSettings: ChartSettingsValues;
  readonly label: string;
};
