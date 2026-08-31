import type { FormProps } from './Form.types';

import { FormProvider } from './contexts';
import { FormBody } from './FormBody/FormBody.component';

export const Form = <TValues extends Record<string, unknown>>({
  action,
  children,
  method,
  ...providerProps
}: FormProps<TValues>) => {
  return (
    <FormProvider {...providerProps}>
      <FormBody action={action} method={method}>
        {children}
      </FormBody>
    </FormProvider>
  );
};
