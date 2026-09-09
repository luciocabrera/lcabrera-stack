import type {
  TableChromeState,
  TableTotalsPlacement,
} from '#ui/components/Table/Table.types';

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

  return ({
    currentState,
    nextStatePatch,
    totalsPlacement,
  }: PersistTableUiFlagsArgs) => {
    const entry = buildUiFlagsCookieEntry({
      currentState,
      nextStatePatch,
      totalsPlacement,
    });

    if (entry) {
      persistCookie([entry]);
    }
  };
};
