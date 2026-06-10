import type { TableMetadataValue } from '@/components/Table/Table.types';

import { useMetaStore } from '@/components/Table/contexts/TableConfig/meta/useMetaStore.hook';

export const useGetTableAdditionalMetadata = () =>
  useMetaStore<
    Readonly<Record<string, TableMetadataValue | null | undefined>> | undefined
  >((state) => state.additionalMetadata);
