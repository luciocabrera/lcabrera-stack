import type { SettingsDraft } from '../../Settings.types';

import { useSettingsDraftContextValue } from '../useSettingsDraftContextValue.hook';

type SetSettingsDraftFieldArgs<K extends keyof SettingsDraft> = {
  readonly key: K;
  readonly value: SettingsDraft[K];
};

/** Stage a single settings-draft field update. */
export const useSetSettingsDraftField = () => {
  const { draftStore } = useSettingsDraftContextValue();

  return <K extends keyof SettingsDraft>({
    key,
    value,
  }: SetSettingsDraftFieldArgs<K>) => {
    draftStore.set({ [key]: value } as Partial<SettingsDraft>);
  };
};
