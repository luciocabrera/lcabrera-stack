import { useMetaStore } from '#ui/components/Form/contexts/FormContext/useMetaStore.hook';

export const useGetFormCancelTo = () =>
  useMetaStore<string>((state) => state.cancelTo);
