import { useMetaStore } from '@lcabrera/ui/components/Table/contexts/TableConfig/meta/useMetaStore.hook';

export const useGetTableLocale = () =>
  useMetaStore<string | undefined>((state) => state.locale);
