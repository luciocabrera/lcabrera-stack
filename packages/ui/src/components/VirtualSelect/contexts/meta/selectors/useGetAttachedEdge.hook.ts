import type { VirtualSelectAttachedEdge } from '../../../VirtualSelect.types';

import { useSelectMetaStore } from '../useSelectMetaStore.hook';

export const useGetAttachedEdge = () =>
  useSelectMetaStore<undefined | VirtualSelectAttachedEdge>(
    (state) => state.attachedEdge,
  );
