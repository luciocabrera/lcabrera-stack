import * as stylex from '@stylexjs/stylex';

import { Button } from '#ui/components/Button';
import { MaximizeIcon, MinimizeIcon } from '#ui/components/Icons';

import type { NavigationHeaderActionsProps } from './NavigationHeaderActions.types';

import { resolveExpandButtonLabel } from '../utils';
import { headerActionsStyles } from './NavigationHeaderActions.stylex';

/**
 * The expand/collapse control button rendered inside the navigation panel
 * header. Displayed vertically when the panel is collapsed, horizontally when
 * expanded.
 */
export const NavigationHeaderActions = ({
  controlButtonSize,
  controlIconSize,
  controlTooltipPlacement,
  isCollapsed,
  isExpanded,
  onToggleExpanded,
}: NavigationHeaderActionsProps) => {
  const expandButtonLabel = resolveExpandButtonLabel(isExpanded);

  return (
    <div
      {...stylex.props(
        headerActionsStyles.actions,
        isCollapsed && headerActionsStyles.actionsCollapsed,
      )}
    >
      <Button
        aria-label={expandButtonLabel}
        icon={
          isExpanded ? (
            <MinimizeIcon size={controlIconSize} />
          ) : (
            <MaximizeIcon size={controlIconSize} />
          )
        }
        isIconOnly
        onClick={onToggleExpanded}
        size={controlButtonSize}
        title={expandButtonLabel}
        tooltipContent={expandButtonLabel}
        tooltipPlacement={controlTooltipPlacement}
        variant='ghost'
      />
    </div>
  );
};
