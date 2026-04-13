import * as stylex from '@stylexjs/stylex';

import { Button } from '@/components/Button';
import { EraserIcon, RefreshIcon } from '@/components/Icons';
import { ICON_SIZE_MD, ICON_SIZE_SM } from '@/design-system/constants';

import type { SortingSectionToolbarProps } from './SortingSectionToolbar.types.ts';

import {
  useResetColumnSorting,
  useSetColumnSorting,
} from '../../ColumnDrawerContext/actions/index.ts';
import { useGetColumnSorting } from '../../ColumnDrawerContext/selectors/index.ts';
import { styles } from './SortingSectionToolbar.stylex.ts';

export const SortingSectionToolbar = ({
  variant = 'footer',
}: SortingSectionToolbarProps) => {
  const sortDirection = useGetColumnSorting();
  const setColumnSorting = useSetColumnSorting();
  const resetColumnSorting = useResetColumnSorting();

  const hasSorting = sortDirection !== undefined;
  const isToolbar = variant === 'toolbar';
  const buttonColor = isToolbar ? 'ghost' : 'outline';
  const buttonSize = isToolbar ? 'mini' : 'sm';
  const buttonWidth = isToolbar ? 'auto' : 'full';
  const iconSize = isToolbar ? ICON_SIZE_SM : ICON_SIZE_MD;

  const handleClear = () => {
    setColumnSorting(undefined);
  };

  return (
    <div {...stylex.props(isToolbar ? styles.toolbar : styles.container)}>
      <Button
        aria-label='Clear Sorting'
        color={buttonColor}
        icon={<EraserIcon size={iconSize} />}
        isDisabled={!hasSorting}
        onClick={handleClear}
        size={buttonSize}
        width={buttonWidth}
      >
        {!isToolbar && 'Clear Sorting'}
      </Button>
      <Button
        aria-label='Reset Sorting'
        color={buttonColor}
        icon={<RefreshIcon size={iconSize} />}
        onClick={resetColumnSorting}
        size={buttonSize}
        width={buttonWidth}
      >
        {!isToolbar && 'Reset Sorting'}
      </Button>
    </div>
  );
};
