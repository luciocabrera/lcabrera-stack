import type { ReactNode } from 'react';

export type FilterValueSlotProps = {
  readonly children: ReactNode;
  readonly hasFilter: boolean;
  readonly isOperatorOpen: boolean;
  readonly shouldFillHeight: boolean;
};
