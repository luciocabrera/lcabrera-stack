import { useFormContextValue } from '@repo/ui/components/Form/contexts/FormContext/useFormContextValue.hook';

export const useSetFieldValue = <TValues extends Record<string, unknown>>() => {
  const { fieldsStore } = useFormContextValue<TValues>();

  return (accessor: keyof TValues & string, value: unknown) => {
    const state = fieldsStore.get();
    const values = { ...state?.values, [accessor]: value } as TValues;

    fieldsStore.set({ values });
  };
};
