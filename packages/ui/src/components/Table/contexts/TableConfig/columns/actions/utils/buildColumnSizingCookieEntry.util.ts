import type { ColumnSizingState } from '@repo/ui/components/Table/Table.types';

import { serializeStateSlice } from '@repo/ui/components/Table/utils';
import { buildPersistCookieEntry } from '@repo/ui/routing/buildPersistCookieEntry.util';

type BuildColumnSizingCookieEntryArgs<TData> = {
  readonly appId?: string;
  readonly columnSizing: ColumnSizingState<TData> | undefined;
  readonly persistenceKey: string | undefined;
};

/**
 * Build the cookie entry that persists the current column widths, scoped to the
 * table's app + persistence key. Returns `undefined` (a no-op) until the table
 * has both a persistence key and a width to save.
 *
 * The cookie is the only channel the SSR loader can read, so the width saved
 * here is the width the next document paints with — `getInitialColumnsState`
 * seeds the store from what the loader passed down.
 */
export const buildColumnSizingCookieEntry = <TData>({
  appId,
  columnSizing,
  persistenceKey,
}: BuildColumnSizingCookieEntryArgs<TData>) => {
  if (!columnSizing || !persistenceKey) {
    return;
  }

  const { key, value } = serializeStateSlice({
    appId,
    persistenceKey,
    slice: 'columnSizing',
    value: columnSizing,
  });

  return buildPersistCookieEntry({ key, value });
};
