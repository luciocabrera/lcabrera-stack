import {
  useGetGlobalNavigationPreferences,
  useGetGlobalPinningPreferences,
} from '#ui/contexts/GlobalSettingsContext/selectors';

import { toDraft } from '../../utils';
import { useSettingsDraftContextValue } from '../useSettingsDraftContextValue.hook';

export const useCancelSettingsDraft = () => {
  const { draftStore } = useSettingsDraftContextValue();
  const navigationPreferences = useGetGlobalNavigationPreferences();
  const pinningPreferences = useGetGlobalPinningPreferences();

  return () => {
    draftStore.set(toDraft({ navigationPreferences, pinningPreferences }));
  };
};
