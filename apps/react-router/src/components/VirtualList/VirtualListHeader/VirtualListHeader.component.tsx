import * as stylex from '@stylexjs/stylex';

import { Button } from '@/components/Button';
import { MenuCloseIcon } from '@/components/Icons';
import { ICON_SIZE_MD } from '@/design-system/constants';

import type { VirtualListHeaderProps } from './VirtualListHeader.types';

import { styles } from './VirtualListHeader.stylex';

export const VirtualListHeader = ({
  name,
  onClearSearch,
  onSearchChange,
  searchTerm,
}: VirtualListHeaderProps) => (
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
      onChange={onSearchChange}
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
        onClick={onClearSearch}
        size='embedded'
        variant='flat'
        width='auto'
      />
    )}
  </div>
);
