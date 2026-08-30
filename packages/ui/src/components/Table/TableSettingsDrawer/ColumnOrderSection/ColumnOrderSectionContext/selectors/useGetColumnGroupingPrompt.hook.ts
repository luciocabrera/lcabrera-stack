import type { ColumnGroupingPromptState } from '../ColumnOrderSectionContext.types';

import { useModalsStore } from '../useModalsStore.hook';

export const useGetColumnGroupingPrompt = () =>
  useModalsStore<ColumnGroupingPromptState>(
    (state) => state.columnGroupingPrompt,
  );
