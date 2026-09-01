import type { TableMetaState } from '#ui/components/Table/Table.types';

import { usePersistCookieAction } from '#ui/hooks/usePersistCookieAction.hook';

import { buildUiFlagsCookieEntry } from './utils';

type PersistTableUiFlagsArgs = {
  readonly currentState: Partial<TableMetaState> | undefined;
  readonly nextStatePatch: Partial<TableMetaState>;
};

export const usePersistTableUiFlagsAction = () => {
  const persistCookie = usePersistCookieAction({
    fetcherKey: 'persist-table-ui-flags',
  });

  return ({ currentState, nextStatePatch }: PersistTableUiFlagsArgs) => {
    const entry = buildUiFlagsCookieEntry({ currentState, nextStatePatch });

    if (entry) {
      persistCookie([entry]);
    }
  };
};
