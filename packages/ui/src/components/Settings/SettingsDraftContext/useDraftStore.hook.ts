import { useStoreSelector } from '@repo/ui/hooks/useStoreSelector.hook';

import type { SettingsDraft } from '../Settings.types';

import { useSettingsDraftContextValue } from './useSettingsDraftContextValue.hook';

export const useDraftStore = <TSelected>(
  selector: (state: SettingsDraft) => TSelected,
) => {
  const { draftStore } = useSettingsDraftContextValue();

  return useStoreSelector({
    selector,
    store: draftStore,
  });
};
