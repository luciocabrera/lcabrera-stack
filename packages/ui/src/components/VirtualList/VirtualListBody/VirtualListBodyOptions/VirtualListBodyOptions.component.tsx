import * as stylex from '@stylexjs/stylex';

import type { VirtualListBodyOptionsProps } from './VirtualListBodyOptions.types';

import {
  useGetFilteredOptions,
  useGetShouldShowSelectAll,
} from '../../contexts/VirtualListData/data/selectors';
import { VirtualizedOption } from '../../VirtualizedOption';
import { styles } from './VirtualListBodyOptions.stylex';

/**
 * Renders the virtualized window of rows (Table analog: TableBodyRows). The
 * window bounds arrive as producer→child props; row content self-connects.
 */
export const VirtualListBodyOptions = ({
  endIndex,
  offsetY,
  startIndex,
  totalHeight,
}: VirtualListBodyOptionsProps) => {
  const filteredOptions = useGetFilteredOptions();
  const shouldShowSelectAll = useGetShouldShowSelectAll();

  return (
    <div {...stylex.props(styles.virtualScrollArea(totalHeight))}>
      <div {...stylex.props(styles.virtualOffset(offsetY))}>
        {Array.from({ length: endIndex - startIndex }, (_, i) => {
          const index = startIndex + i;
          let key = `option-${index}`;
          if (index === 0 && shouldShowSelectAll) {
            key = 'select-all';
          } else {
            const optionIndex = shouldShowSelectAll ? index - 1 : index;
            key = filteredOptions[optionIndex] ?? key;
          }

          return <VirtualizedOption index={index} key={key} />;
        })}
      </div>
    </div>
  );
};
