import { useSetSearchTerm } from './useSetSearchTerm.hook';

/** Clears the header search term (and recomputes the derived list state). */
export const useClearSearch = () => {
  const setSearchTerm = useSetSearchTerm();

  return () => {
    setSearchTerm('');
  };
};
