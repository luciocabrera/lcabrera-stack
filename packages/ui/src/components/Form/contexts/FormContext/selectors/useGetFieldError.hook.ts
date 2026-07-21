import { useFieldsStore } from '@lcabrera/ui/components/Form/contexts/FormContext/useFieldsStore.hook';

export const useGetFieldError = <TValues extends Record<string, unknown>>(
  accessor: keyof TValues & string,
) =>
  useFieldsStore<string | undefined, TValues>(
    (state) => state.errors[accessor],
  );
