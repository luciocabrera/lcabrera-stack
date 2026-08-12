import { useMetaStore } from '#ui/components/Form/contexts/FormContext/useMetaStore.hook';

/** Stable per-instance form id — hidden-input marker and fetcher key. */
export const useGetFormId = () => useMetaStore<string>((state) => state.formId);
