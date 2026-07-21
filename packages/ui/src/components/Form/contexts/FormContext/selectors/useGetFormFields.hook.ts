import type { FieldNode } from '@lcabrera/ui/components/Form/Form.types';

import { useMetaStore } from '@lcabrera/ui/components/Form/contexts/FormContext/useMetaStore.hook';

/** Field definitions tree — the form's column-config analogue. */
export const useGetFormFields = <
  TValues extends Record<string, unknown> = Record<string, unknown>,
>() =>
  useMetaStore<readonly FieldNode<TValues>[], TValues>((state) => state.fields);
