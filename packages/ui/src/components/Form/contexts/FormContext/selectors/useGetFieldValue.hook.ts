import { useFieldsStore } from '@lcabrera/ui/components/Form/contexts/FormContext/useFieldsStore.hook';

export const useGetFieldValue = <TValues extends Record<string, unknown>>(
  accessor: keyof TValues & string,
): unknown =>
  useFieldsStore<unknown, TValues>((state) => state.values[accessor]);
