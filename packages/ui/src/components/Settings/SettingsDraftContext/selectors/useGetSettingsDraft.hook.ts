import { useDraftStore } from '../useDraftStore.hook';

/** Subscribe to the full staged settings draft. */
export const useGetSettingsDraft = () => useDraftStore((state) => state);
