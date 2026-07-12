import type { ReactNode } from 'react';

import type { ListFilterMode } from '../../VirtualList.types';

export type ListFilterModeButtonProps = {
  readonly count: number;
  readonly icon: ReactNode;
  readonly mode: ListFilterMode;
  readonly tooltip: string;
};
