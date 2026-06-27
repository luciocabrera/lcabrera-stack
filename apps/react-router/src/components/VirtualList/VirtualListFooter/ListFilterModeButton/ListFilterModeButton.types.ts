import type { ReactNode } from 'react';

export type ListFilterMode = 'all' | 'selected' | 'unselected';

export type ListFilterModeButtonProps = {
  readonly count: number;
  readonly icon: ReactNode;
  readonly isActive: boolean;
  readonly mode: ListFilterMode;
  readonly onSelect: (mode: ListFilterMode) => void;
  readonly tooltip: string;
};
