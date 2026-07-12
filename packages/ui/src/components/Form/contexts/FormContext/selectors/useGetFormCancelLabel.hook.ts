import { useMetaStore } from '@repo/ui/components/Form/contexts/FormContext/useMetaStore.hook';

/** Footer cancel-button label (default resolved at store init). */
export const useGetFormCancelLabel = () =>
  useMetaStore<string>((state) => state.cancelLabel);
