import type { ChangeEvent } from 'react';

import { Button } from '@repo/ui/components/Button';
import { MenuCloseIcon } from '@repo/ui/components/Icons';
import { ICON_SIZE_MD } from '@repo/ui/design-system/constants';
import * as stylex from '@stylexjs/stylex';

import { useGetSearchInputName } from '../contexts/VirtualListConfig/config/selectors';
import {
  useClearSearch,
  useSetSearchTerm,
} from '../contexts/VirtualListConfig/ui/actions';
import { useGetSearchTerm } from '../contexts/VirtualListConfig/ui/selectors';
import { styles } from './VirtualListHeader.stylex';

/** Self-connected search header: reads the term via selectors, writes via actions. */
export const VirtualListHeader = () => {
  const name = useGetSearchInputName();
  const searchTerm = useGetSearchTerm();
  const clearSearch = useClearSearch();
  const setSearchTerm = useSetSearchTerm();

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  return (
    <div {...stylex.props(styles.searchInputWrapper)}>
      <input
        autoComplete='off'
        data-1p-ignore='true'
        data-bwignore='true'
        data-form-type='other'
        data-lpignore='true'
        data-np-checked='1'
        data-np-ignore='1'
        name={name}
        onChange={handleSearchChange}
        placeholder='Search options...'
        type='text'
        value={searchTerm}
        {...stylex.props(
          styles.searchInput,
          searchTerm ? styles.searchInputWithClear : undefined,
        )}
      />
      {searchTerm && (
        <Button
          aria-label='Clear search'
          color='ghost'
          customStylex={styles.clearButton}
          icon={<MenuCloseIcon size={ICON_SIZE_MD} />}
          onClick={clearSearch}
          size='embedded'
          variant='flat'
          width='auto'
        />
      )}
    </div>
  );
};
