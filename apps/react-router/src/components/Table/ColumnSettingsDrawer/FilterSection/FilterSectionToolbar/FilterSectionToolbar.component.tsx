import * as stylex from '@stylexjs/stylex';

import { Button } from '@/components/Button';
import { EraserIcon, RefreshIcon } from '@/components/Icons';
import { ICON_SIZE_MD, ICON_SIZE_SM } from '@/design-system/constants';

import type { FilterSectionToolbarProps } from './FilterSectionToolbar.types';

import {
  useResetColumnFilter,
  useSetColumnFilter,
} from '../../ColumnDrawerContext/actions';
import { useGetColumnFilter } from '../../ColumnDrawerContext/selectors';
import { styles } from './FilterSectionToolbar.stylex';

export const FilterSectionToolbar = ({
  variant = 'footer',
}: FilterSectionToolbarProps) => {
  const columnFilter = useGetColumnFilter();

  const setColumnFilter = useSetColumnFilter();
  const resetColumnFilter = useResetColumnFilter();

  const hasFilter = columnFilter !== undefined;
  const isToolbar = variant === 'toolbar';
  const buttonColor = isToolbar ? 'ghost' : 'outline';
  const buttonSize = isToolbar ? 'mini' : 'sm';
  const buttonWidth = isToolbar ? 'auto' : 'full';
  const iconSize = isToolbar ? ICON_SIZE_SM : ICON_SIZE_MD;

  const handleClear = () => {
    setColumnFilter(undefined);
  };

  return (
    <div {...stylex.props(isToolbar ? styles.toolbar : styles.container)}>
      <Button
        aria-label='Clear Filter'
        color={buttonColor}
        icon={<EraserIcon size={iconSize} />}
        isDisabled={!hasFilter}
        onClick={handleClear}
        size={buttonSize}
        width={buttonWidth}
      >
        {!isToolbar && 'Clear Filter'}
      </Button>
      <Button
        aria-label='Reset Filter'
        color={buttonColor}
        icon={<RefreshIcon size={iconSize} />}
        onClick={resetColumnFilter}
        size={buttonSize}
        width={buttonWidth}
      >
        {!isToolbar && 'Reset Filter'}
      </Button>
    </div>
  );
};
