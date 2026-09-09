import type {
  TableChromeState,
  TableTotalsPlacement,
} from '#ui/components/Table/Table.types';

import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { usePersistCookieAction } from '#ui/hooks/usePersistCookieAction.hook';

import { buildUiFlagsCookieEntry } from './utils';

type PersistTableUiFlagsArgs = {
  readonly currentState: Partial<TableChromeState> | undefined;
  readonly nextStatePatch: Partial<TableChromeState>;
  readonly totalsPlacement?: TableTotalsPlacement;
};

export const usePersistTableUiFlagsAction = () => {
  const persistCookie = usePersistCookieAction({
    fetcherKey: 'persist-table-ui-flags',
  });
  const { groupingStore } = useTableConfigContextValue();

  return ({
    currentState,
    nextStatePatch,
    totalsPlacement,
  }: PersistTableUiFlagsArgs) => {
    const entry = buildUiFlagsCookieEntry({
      currentState,
      nextStatePatch,
      totalsPlacement: totalsPlacement ?? groupingStore.get()?.totalsPlacement,
    });

    if (entry) {
      persistCookie([entry]);
    }
  };
};
