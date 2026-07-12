import { useMetaStore } from '@repo/ui/components/Form/contexts/FormContext/useMetaStore.hook';

/** Fallback route Cancel navigates to without a valid history entry. */
export const useGetFormCancelTo = () =>
  useMetaStore<string>((state) => state.cancelTo);
