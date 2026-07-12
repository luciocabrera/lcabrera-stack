import { useMetaStore } from '../useMetaStore.hook';

export const useGetTableCrud = () => useMetaStore((state) => state.crud);
