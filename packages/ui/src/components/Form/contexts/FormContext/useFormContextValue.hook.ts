import { use } from 'react';

import type { FormContextValue } from './FormContext.types';

import { FormContext } from './FormContext.context';

export const useFormContextValue = <
  TValues extends Record<string, unknown> = Record<string, unknown>,
>(): FormContextValue<TValues> => {
  const context = use(FormContext);

  if (context === undefined) {
    throw new Error('useFormContextValue must be used within FormProvider');
  }

  return context as FormContextValue<TValues>;
};
