import type { TableCrudConfig } from '@repo/ui/components/Table/Table.types';

import { useMetaStore } from '../useMetaStore.hook';

export const useGetTableCrud = (): TableCrudConfig | undefined =>
  useMetaStore((state) => state.crud);
