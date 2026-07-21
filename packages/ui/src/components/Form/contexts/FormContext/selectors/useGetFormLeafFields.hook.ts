import type { LeafFieldDef } from '@lcabrera/ui/components/Form/Form.types';

import { useMetaStore } from '@lcabrera/ui/components/Form/contexts/FormContext/useMetaStore.hook';

/** Flattened leaf field definitions — accessor-bearing nodes only. */
export const useGetFormLeafFields = <
  TValues extends Record<string, unknown> = Record<string, unknown>,
>() =>
  useMetaStore<readonly LeafFieldDef<TValues>[], TValues>(
    (state) => state.leafFields,
  );
