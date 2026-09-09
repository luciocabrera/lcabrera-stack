import { useEffect, useId } from 'react';

import { useStore } from '#ui/hooks';
import { ProvideStoreContext } from '#ui/hooks/utils/provideStoreContext.util';
import { syncStoreFromProps } from '#ui/hooks/utils/syncStoreFromProps.util';

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
    if (!serverErrors) return;
    syncStoreFromProps({ next: { errors: serverErrors }, store: fieldsStore });
  }, [fieldsStore, serverErrors]);

  useEffect(() => {
    syncStoreFromProps({ next: { mode }, store: metaStore });
  }, [metaStore, mode]);

  useEffect(() => {
    if (metaStore.get().fields === fields) return;
    syncStoreFromProps({
      next: { fields, leafFields: flattenFields(fields) },
      store: metaStore,
    });
  }, [fields, metaStore]);

  const value: FormContextValue<TValues> = { fieldsStore, metaStore };

  return (
    <ProvideStoreContext context={FormContext} value={value}>
      {children}
    </ProvideStoreContext>
  );
};
