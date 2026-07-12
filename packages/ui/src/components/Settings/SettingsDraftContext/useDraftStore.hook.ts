import { useSyncExternalStore } from 'react';

import type { SettingsDraft } from '../Settings.types';

import { DEFAULT_SETTINGS_DRAFT } from './SettingsDraftContext.constants';
import { useSettingsDraftContextValue } from './useSettingsDraftContextValue.hook';

export const useDraftStore = <TSelected>(
  selector: (state: SettingsDraft) => TSelected,
) => {
  const { draftStore } = useSettingsDraftContextValue();

  const getSnapshot = () => draftStore.get() ?? DEFAULT_SETTINGS_DRAFT;
  const getServerSnapshot = () =>
    draftStore.getServerSnapshot() ?? DEFAULT_SETTINGS_DRAFT;

  const state = useSyncExternalStore(
    draftStore.subscribe,
    () => selector(getSnapshot()),
    () => selector(getServerSnapshot()),
  );

  return state;
};
