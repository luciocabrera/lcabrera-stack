import type { TableMetadataValue } from '@lcabrera/ui/components/Table/Table.types';

import { useMetaStore } from '@lcabrera/ui/components/Table/contexts/TableConfig/meta/useMetaStore.hook';

export const useGetTableAdditionalMetadata = () =>
  useMetaStore<
    Readonly<Record<string, null | TableMetadataValue | undefined>> | undefined
  >((state) => state.additionalMetadata);
