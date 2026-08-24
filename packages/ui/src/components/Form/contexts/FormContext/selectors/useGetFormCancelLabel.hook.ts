import { useMetaStore } from '#ui/components/Form/contexts/FormContext/useMetaStore.hook';

export const useGetFormCancelLabel = () =>
  useMetaStore<string>((state) => state.cancelLabel);
