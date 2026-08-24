import { useSetSearchTerm } from './useSetSearchTerm.hook';

export const useClearSearch = () => {
  const setSearchTerm = useSetSearchTerm();

  return () => {
    setSearchTerm('');
  };
};
