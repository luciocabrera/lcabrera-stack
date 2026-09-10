import { useSetGroupKeys } from './useSetGroupKeys.hook';

export const useClearGroupKeys = () => {
  const setGroupKeys = useSetGroupKeys();

  return () => {
    setGroupKeys([]);
  };
};
