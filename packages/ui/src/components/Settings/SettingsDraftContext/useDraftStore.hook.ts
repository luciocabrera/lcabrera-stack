import { useStoreSelector } from '@repo/ui/hooks/useStoreSelector.hook';

import type { SettingsDraft } from '../Settings.types';

import { DEFAULT_SETTINGS_DRAFT } from './SettingsDraftContext.constants';
import { useSettingsDraftContextValue } from './useSettingsDraftContextValue.hook';

export const useDraftStore = <TSelected>(
  selector: (state: SettingsDraft) => TSelected,
) => {
  const { draftStore } = useSettingsDraftContextValue();

  return useStoreSelector({
    fallback: DEFAULT_SETTINGS_DRAFT,
    selector,
    store: draftStore,
  });
};
