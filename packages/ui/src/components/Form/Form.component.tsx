import type { FormProps } from './Form.types';

import { FormProvider } from './contexts';
import { FormBody } from './FormBody/FormBody.component';

/**
 * Declarative fields-driven form (ADR-005); a thin shell that hands the
 * form config to FormProvider — which owns store init (field flattening,
 * initial values, formId) — and composes the self-connected FormBody.
 */
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
