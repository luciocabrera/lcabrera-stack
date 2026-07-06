import type { TableTitle } from '@repo/ui/components/Table/Table.types';

import { useMetaStore } from '../useMetaStore.hook';

export const useGetTableTitle = () =>
  useMetaStore<TableTitle | undefined>((state) => state.title);
