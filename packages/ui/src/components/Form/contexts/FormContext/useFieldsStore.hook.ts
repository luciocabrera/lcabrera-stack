import { useStoreSelector } from '@repo/ui/hooks/useStoreSelector.hook';

import type { FormFieldsState } from './FormContext.types';

import { useFormContextValue } from './useFormContextValue.hook';

export const useFieldsStore = <
  TSelected,
  TValues extends Record<string, unknown> = Record<string, unknown>,
>(
  selector: (state: FormFieldsState<TValues>) => TSelected,
) => {
  const { fieldsStore } = useFormContextValue<TValues>();

  return useStoreSelector({ selector, store: fieldsStore });
};
