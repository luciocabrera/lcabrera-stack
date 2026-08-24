import { useMetaStore } from '#ui/components/Form/contexts/FormContext/useMetaStore.hook';

export const useGetFormId = () => useMetaStore<string>((state) => state.formId);
