import {
  PERSIST_COLUMN_SIZING_FETCHER_KEY,
  PERSIST_TABLE_STATE_FETCHER_KEY,
  PERSIST_TABLE_UI_FLAGS_FETCHER_KEY,
} from '#ui/constants/globalSettings.constants';
import { usePersistCookieAction } from '#ui/hooks/usePersistCookieAction.hook';

export const useTablePersistence = () => ({
  columnSizing: usePersistCookieAction({
    fetcherKey: PERSIST_COLUMN_SIZING_FETCHER_KEY,
  }),
  tableState: usePersistCookieAction({
    fetcherKey: PERSIST_TABLE_STATE_FETCHER_KEY,
  }),
  uiFlags: usePersistCookieAction({
    fetcherKey: PERSIST_TABLE_UI_FLAGS_FETCHER_KEY,
  }),
});
