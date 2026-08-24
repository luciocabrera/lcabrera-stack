import type { ColumnSizingState } from '#ui/components/Table/Table.types';

import { serializeStateSlice } from '#ui/components/Table/utils';
import { buildPersistCookieEntry } from '#ui/routing/actions/buildPersistCookieEntry.util';

type BuildColumnSizingCookieEntryArgs<TData> = {
  readonly appId?: string;
  readonly columnSizing: ColumnSizingState<TData> | undefined;
  readonly persistenceKey: string | undefined;
};

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
