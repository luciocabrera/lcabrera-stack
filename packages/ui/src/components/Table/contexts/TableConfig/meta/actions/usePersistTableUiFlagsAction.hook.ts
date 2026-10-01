import type {
  TableChromeState,
  TableTotalsPlacement,
} from '#ui/components/Table/Table.types';

import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { PERSIST_TABLE_UI_FLAGS_FETCHER_KEY } from '#ui/constants/globalSettings.constants';
import { usePersistCookieAction } from '#ui/hooks/usePersistCookieAction.hook';

import { buildUiFlagsCookieEntry } from './utils';

type PersistTableUiFlagsArgs = {
  readonly currentState: Partial<TableChromeState> | undefined;
  readonly nextStatePatch: Partial<TableChromeState>;
  readonly totalsPlacement?: TableTotalsPlacement;
};

export const usePersistTableUiFlagsAction = () => {
  const persistCookie = usePersistCookieAction({
    fetcherKey: PERSIST_TABLE_UI_FLAGS_FETCHER_KEY,
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
