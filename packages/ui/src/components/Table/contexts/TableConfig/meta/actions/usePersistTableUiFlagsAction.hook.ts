import type { TableMetaState } from '@repo/ui/components/Table/Table.types';

import { usePersistCookieAction } from '@repo/ui/hooks/usePersistCookieAction.hook';

import { buildUiFlagsCookieEntry } from './utils';

type PersistTableUiFlagsArgs = {
  readonly currentState: Partial<TableMetaState> | undefined;
  readonly nextStatePatch: Partial<TableMetaState>;
};

/**
 * Persists the table's drawer UI flags (open / pinned / selected tab / expanded
 * filters) to the cookie, via the `/_action/persist-cookie` server action
 * (`Set-Cookie`). Replaces the old client-side `document.cookie` write.
 *
 * The cookie is the single channel: the loader reads it to SSR-seed the drawer,
 * so a second client-only copy could only disagree with the markup already
 * painted and shift it at hydration. A no-op until the table has a persistence
 * key. Every meta action shares this one hook, so its `persist-table-ui-flags`
 * fetcher serializes rapid toggles into last-write-wins order.
 */
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
