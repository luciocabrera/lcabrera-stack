import { useFormContextValue } from '@repo/ui/components/Form/contexts/FormContext/useFormContextValue.hook';

type SetFieldValueArgs<TValues extends Record<string, unknown>> = {
  readonly accessor: keyof TValues & string;
  readonly value: unknown;
};

export const useSetFieldValue = <TValues extends Record<string, unknown>>() => {
  const { fieldsStore } = useFormContextValue<TValues>();

  return ({ accessor, value }: SetFieldValueArgs<TValues>) => {
    const state = fieldsStore.get();
    const values = { ...state?.values, [accessor]: value } as TValues;

    fieldsStore.set({ values });
  };
};
