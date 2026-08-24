import type { LeafFieldDef } from '#ui/components/Form/Form.types';

import { useMetaStore } from '#ui/components/Form/contexts/FormContext/useMetaStore.hook';

export const useGetFormLeafFields = <
  TValues extends Record<string, unknown> = Record<string, unknown>,
>() =>
  useMetaStore<readonly LeafFieldDef<TValues>[], TValues>(
    (state) => state.leafFields,
  );
