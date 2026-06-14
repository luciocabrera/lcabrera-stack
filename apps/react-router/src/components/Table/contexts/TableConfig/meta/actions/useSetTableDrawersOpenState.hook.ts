import { useTableConfigContextValue } from '../../useTableConfigContextValue.hook';

type SetTableDrawersOpenStateArgs = {
  readonly isColumnSettingsOpen: boolean;
  readonly isTableSettingsOpen: boolean;
};

export const useSetTableDrawersOpenState = () => {
  const { metaStore } = useTableConfigContextValue();

  return ({
    isColumnSettingsOpen,
    isTableSettingsOpen,
  }: SetTableDrawersOpenStateArgs) => {
    metaStore.set({
      isColumnSettingsOpen,
      isTableSettingsOpen,
    });
  };
};
