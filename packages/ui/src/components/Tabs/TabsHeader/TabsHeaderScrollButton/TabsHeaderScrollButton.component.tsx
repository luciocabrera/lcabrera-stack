import * as stylex from '@stylexjs/stylex';

import { DisclosureIcon } from '#ui/components/Icons';
import { ICON_SIZE_SM } from '#ui/design-system/constants';

import type { TabsHeaderScrollButtonProps } from './TabsHeaderScrollButton.types';

import { styles } from './TabsHeaderScrollButton.stylex';

export const TabsHeaderScrollButton = ({
  direction,
  onScroll,
}: TabsHeaderScrollButtonProps) => {
  const handleScroll = () => {
    onScroll(direction);
  };

  return (
    <button
      {...stylex.props(styles.scrollButton)}
      aria-hidden='true'
      data-testid={`tabs-scroll-${direction}`}
      onClick={handleScroll}
      tabIndex={-1}
      type='button'
    >
      <span
        {...stylex.props(
          styles.scrollIcon,
          direction === 'start' && styles.scrollIconStart,
        )}
      >
        <DisclosureIcon size={ICON_SIZE_SM} />
      </span>
    </button>
  );
};
