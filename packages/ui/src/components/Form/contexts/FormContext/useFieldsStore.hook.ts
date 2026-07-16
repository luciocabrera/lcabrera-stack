import { useSyncExternalStore } from 'react';

import type { FormFieldsState } from './FormContext.types';

import { useFormContextValue } from './useFormContextValue.hook';

export const useFieldsStore = <
  TSelected,
  TValues extends Record<string, unknown> = Record<string, unknown>,
>(
  selector: (state: FormFieldsState<TValues>) => TSelected,
) => {
  const { fieldsStore } = useFormContextValue<TValues>();

  return useSyncExternalStore(
    fieldsStore.subscribe,
    () => selector(fieldsStore.get() as FormFieldsState<TValues>),
    () => selector(fieldsStore.getServerSnapshot() as FormFieldsState<TValues>),
  );
};
