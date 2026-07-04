import { useEffect } from 'react';

import { useStore } from '@repo/ui/hooks';

import type { FormContextValue, FormProviderProps } from './FormContext.types';

import { FormContext } from './FormContext.context';

export const FormProvider = <TValues extends Record<string, unknown>>({
  children,
  initialState,
  serverErrors,
}: FormProviderProps<TValues>) => {
  const formStore = useStore(initialState);

  useEffect(() => {
    if (serverErrors) formStore.set({ errors: serverErrors });
  }, [serverErrors, formStore]);

  const value: FormContextValue<TValues> = { formStore };

  return (
    <FormContext value={value as FormContextValue}>{children}</FormContext>
  );
};
