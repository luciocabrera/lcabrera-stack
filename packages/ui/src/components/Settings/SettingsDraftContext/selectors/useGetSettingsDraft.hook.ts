import { useDraftStore } from '../useDraftStore.hook';

export const useGetSettingsDraft = () => useDraftStore((state) => state);
