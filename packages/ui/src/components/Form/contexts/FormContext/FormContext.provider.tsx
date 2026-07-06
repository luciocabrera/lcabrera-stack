import { useStore } from '@repo/ui/hooks';
import { useEffect } from 'react';

import type {
  FormContextValue,
  FormMetaState,
  FormProviderProps,
} from './FormContext.types';

import { FormContext } from './FormContext.context';

export const FormProvider = <TValues extends Record<string, unknown>>({
  children,
  initialFieldsState,
  mode,
  serverErrors,
}: FormProviderProps<TValues>) => {
  const fieldsStore = useStore(initialFieldsState);
  const metaStore = useStore<FormMetaState>({ mode });

  useEffect(() => {
    if (serverErrors) fieldsStore.set({ errors: serverErrors });
  }, [serverErrors, fieldsStore]);

  useEffect(() => {
    metaStore.set({ mode });
  }, [mode, metaStore]);

  const value: FormContextValue<TValues> = { fieldsStore, metaStore };

  return (
    <FormContext value={value as FormContextValue}>{children}</FormContext>
  );
};
