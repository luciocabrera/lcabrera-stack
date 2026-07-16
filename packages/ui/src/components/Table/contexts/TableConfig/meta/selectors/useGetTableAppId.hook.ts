import { useMetaStore } from '@repo/ui/components/Table/contexts/TableConfig/meta/useMetaStore.hook';

export const useGetTableAppId = () =>
  useMetaStore<string | undefined>((state) => state.appId);
