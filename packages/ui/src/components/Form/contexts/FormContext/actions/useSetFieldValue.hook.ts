import { useFormContextValue } from '@repo/ui/components/Form/contexts/FormContext/useFormContextValue.hook';

export const useSetFieldValue = <TValues extends Record<string, unknown>>() => {
  const { formStore } = useFormContextValue<TValues>();

  return (accessor: keyof TValues & string, value: unknown) => {
    const state = formStore.get();
    const values = { ...state?.values, [accessor]: value } as TValues;

    formStore.set({ values });
  };
};
