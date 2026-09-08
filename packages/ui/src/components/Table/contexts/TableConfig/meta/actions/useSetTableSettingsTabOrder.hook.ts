import type { TableSettingsTabRole } from '#ui/components/Table/Table.types';

import { useTableConfigContextValue } from '../../useTableConfigContextValue.hook';
import { usePersistTableUiFlagsAction } from './usePersistTableUiFlagsAction.hook';

export const useSetTableSettingsTabOrder = () => {
  const { metaStore } = useTableConfigContextValue();
  const persistUiFlags = usePersistTableUiFlagsAction();

  return (settingsTabOrder: readonly TableSettingsTabRole[]) => {
    const metaState = metaStore.get();
    const nextStatePatch = { settingsTabOrder };

    persistUiFlags({
      currentState: metaState,
      nextStatePatch,
    });
    metaStore.set(nextStatePatch);
  };
};
