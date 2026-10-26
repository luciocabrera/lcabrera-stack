import { use } from 'react';

import type {
  TableChromeState,
  TableTotalsPlacement,
} from '#ui/components/Table/Table.types';

import { TablePersistenceContext } from '#ui/components/Table/contexts/TableConfig/TablePersistenceContext.context';
import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';

import { buildUiFlagsCookieEntry } from './utils';

type PersistTableUiFlagsArgs = {
  readonly currentState: Partial<TableChromeState> | undefined;
  readonly nextStatePatch: Partial<TableChromeState>;
  readonly totalsPlacement?: TableTotalsPlacement;
};

export const usePersistTableUiFlagsAction = () => {
  const persistence = use(TablePersistenceContext);
  const { groupingStore } = useTableConfigContextValue();

  return ({
    currentState,
    nextStatePatch,
    totalsPlacement,
  }: PersistTableUiFlagsArgs) => {
    if (persistence === undefined) return;

    const entry = buildUiFlagsCookieEntry({
      currentState,
      nextStatePatch,
      totalsPlacement: totalsPlacement ?? groupingStore.get()?.totalsPlacement,
    });

    if (entry) {
      persistence.uiFlags([entry]);
    }
  };
};
