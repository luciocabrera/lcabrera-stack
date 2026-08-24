import { useMetaStore } from '#ui/components/Form/contexts/FormContext/useMetaStore.hook';

export const useGetFormSubmitLabel = () =>
  useMetaStore<string>((state) => state.submitLabel);
