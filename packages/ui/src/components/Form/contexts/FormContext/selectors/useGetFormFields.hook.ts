import type { FieldNode } from '#ui/components/Form/Form.types';

import { useMetaStore } from '#ui/components/Form/contexts/FormContext/useMetaStore.hook';

export const useGetFormFields = <
  TValues extends Record<string, unknown> = Record<string, unknown>,
>() =>
  useMetaStore<readonly FieldNode<TValues>[], TValues>((state) => state.fields);
