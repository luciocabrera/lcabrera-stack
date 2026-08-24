import * as stylex from '@stylexjs/stylex';

import { Button } from '#ui/components/Button';
import { ICON_SIZE_SM } from '#ui/design-system/constants';

import type { SectionToolbarProps } from './SectionToolbar.types';

import { styles } from './SectionToolbar.stylex';

export const SectionToolbar = ({
  buttons,
  isBusy = false,
  variant = 'footer',
}: SectionToolbarProps) => {
  const isToolbar = variant === 'toolbar';
  const buttonVariant = isToolbar ? 'ghost' : 'outline';
  const buttonSize = isToolbar ? 'mini' : 'sm';
  const iconSize = isToolbar ? ICON_SIZE_SM : undefined;

  return (
    <div {...stylex.props(isToolbar ? styles.toolbar : styles.container)}>
      {buttons.map(({ icon: Icon, ...button }) => (
        <Button
          aria-label={button.label}
          icon={<Icon size={iconSize} />}
          isBusy={isBusy}
          isDisabled={button.isDisabled}
          key={button.key}
          onClick={button.onClick}
          size={buttonSize}
          tooltipContent={isToolbar ? button.label : undefined}
          variant={buttonVariant}
        >
          {!isToolbar && button.label}
        </Button>
      ))}
    </div>
  );
};
