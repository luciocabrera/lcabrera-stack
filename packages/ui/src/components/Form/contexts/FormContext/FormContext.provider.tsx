import { useEffect, useId } from 'react';

import { useStore } from '#ui/hooks';

import type {
  FormContextValue,
  FormFieldsState,
  FormMetaState,
  FormProviderProps,
} from './FormContext.types';

import { flattenFields } from '../../utils/flattenFields.util';
import { FormContext } from './FormContext.context';
import { getInitialFieldsState } from './utils/getInitialFieldsState.util';
import { getInitialFormMetaState } from './utils/getInitialFormMetaState.util';

/**
 * Owns the two form stores. The fields store carries the per-field runtime
 * state (values/errors/pristine baseline); the meta store carries the
 * form-level config (field definitions and their flattened leaves, formId,
 * mode, submission flavour, footer labels) so consumers self-connect via
 * selectors instead of prop drilling.
 */
export const FormProvider = <TValues extends Record<string, unknown>>({
  cancelLabel,
  cancelTo,
  children,
  fields,
  initialValues,
  mode,
  serverErrors,
  submission,
  submitLabel,
}: FormProviderProps<TValues>) => {
  const formId = useId();
  const leafFields = flattenFields(fields);

  const fieldsStore = useStore<FormFieldsState<TValues>>(
    getInitialFieldsState({ initialValues, leafFields, serverErrors }),
  );
  const metaStore = useStore<FormMetaState<TValues>>(
    getInitialFormMetaState({
      cancelLabel,
      cancelTo,
      fields,
      formId,
      leafFields,
      mode,
      submission,
      submitLabel,
    }),
  );

  useEffect(() => {
    if (serverErrors) fieldsStore.set({ errors: serverErrors });
  }, [serverErrors, fieldsStore]);

  useEffect(() => {
    metaStore.set({ mode });
  }, [mode, metaStore]);

  // Field definitions may be rebuilt from fresh loader data — re-sync them
  // (and their flattened leaves) whenever the prop identity changes.
  useEffect(() => {
    if (metaStore.get()?.fields === fields) return;
    metaStore.set({ fields, leafFields: flattenFields(fields) });
  }, [fields, metaStore]);

  const value: FormContextValue<TValues> = { fieldsStore, metaStore };

  return (
    <FormContext value={value as FormContextValue}>{children}</FormContext>
  );
};
