import { useStore } from '@/hooks';

import type {
  ColumnOrderSectionModalsState,
  ColumnOrderSectionProviderProps,
} from './ColumnOrderSectionContext.types';

import { ColumnOrderSectionContext } from './ColumnOrderSectionContext.context';
import { getInitialModalsState } from './utils';

export const ColumnOrderSectionProvider = ({
  children,
}: ColumnOrderSectionProviderProps) => {
  const modalsStore = useStore<ColumnOrderSectionModalsState>(
    getInitialModalsState(),
  );

  return (
    <ColumnOrderSectionContext value={{ modalsStore }}>
      {children}
    </ColumnOrderSectionContext>
  );
};
