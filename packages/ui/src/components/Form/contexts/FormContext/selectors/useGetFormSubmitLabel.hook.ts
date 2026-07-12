import { useMetaStore } from '@repo/ui/components/Form/contexts/FormContext/useMetaStore.hook';

/** Footer submit-button label (default resolved at store init). */
export const useGetFormSubmitLabel = () =>
  useMetaStore<string>((state) => state.submitLabel);
