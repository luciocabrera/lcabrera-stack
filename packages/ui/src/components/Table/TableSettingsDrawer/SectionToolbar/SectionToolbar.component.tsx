import { Button } from '@repo/ui/components/Button';
import { ICON_SIZE_SM } from '@repo/ui/design-system/constants';
import * as stylex from '@stylexjs/stylex';

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
  // Icons default to ICON_SIZE_MD; only the toolbar variant needs an override.
  const iconSize = isToolbar ? ICON_SIZE_SM : undefined;

  return (
    <div {...stylex.props(isToolbar ? styles.toolbar : styles.container)}>
      {buttons.map(({ icon: Icon, ...button }) => (
        <Button
          aria-label={button.label}
          color={buttonColor}
          icon={<Icon size={iconSize} />}
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
