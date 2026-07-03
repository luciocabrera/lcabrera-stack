import * as stylex from '@stylexjs/stylex';

import { Button } from '@/components/Button';
import { ICON_SIZE_MD, ICON_SIZE_SM } from '@/design-system/constants';

import type { SectionToolbarProps } from './SectionToolbar.types';

import { styles } from './SectionToolbar.stylex';

/**
 * Shared drawer section toolbar. Renders a row of action buttons from a
 * descriptor list and owns the `footer`/`toolbar` variant presentation
 * (color, size, width, icon size, tooltip vs. label).
 */
export const SectionToolbar = ({
  buttons,
  isBusy = false,
  variant = 'footer',
}: SectionToolbarProps) => {
  const isToolbar = variant === 'toolbar';
  const buttonColor = isToolbar ? 'ghost' : 'outline';
  const buttonSize = isToolbar ? 'mini' : 'sm';
  const buttonWidth = isToolbar ? 'auto' : 'full';
  const iconSize = isToolbar ? ICON_SIZE_SM : ICON_SIZE_MD;

  return (
    <div {...stylex.props(isToolbar ? styles.toolbar : styles.container)}>
      {buttons.map((button) => (
        <Button
          aria-label={button.label}
          color={buttonColor}
          icon={button.icon(iconSize)}
          isBusy={isBusy}
          isDisabled={button.isDisabled}
          key={button.key}
          onClick={button.onClick}
          size={buttonSize}
          tooltipContent={isToolbar ? button.label : undefined}
          width={buttonWidth}
        >
          {!isToolbar && button.label}
        </Button>
      ))}
    </div>
  );
};
