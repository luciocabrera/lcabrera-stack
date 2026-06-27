import * as stylex from '@stylexjs/stylex';

import { Button } from '@/components/Button';
import {
  MaximizeIcon,
  MenuCloseIcon,
  MinimizeIcon,
  PinIcon,
  PinOffIcon,
} from '@/components/Icons';

import type { NavigationHeaderActionsProps } from './NavigationHeaderActions.types';

import { resolveExpandButtonLabel, resolvePinButtonLabel } from '../utils';
import { headerActionsStyles } from './NavigationHeaderActions.stylex';

/**
 * The expand/collapse, pin/unpin, and close control buttons rendered inside the
 * navigation panel header. Displayed vertically when the panel is collapsed,
 * horizontally when expanded.
 */
export const NavigationHeaderActions = ({
  controlButtonSize,
  controlIconSize,
  controlTooltipPlacement,
  isCollapsed,
  isExpanded,
  isPinned,
  onClose,
  onToggleExpanded,
  onTogglePinned,
}: NavigationHeaderActionsProps) => {
  const expandButtonLabel = resolveExpandButtonLabel(isExpanded);
  const pinButtonLabel = resolvePinButtonLabel(isPinned);

  return (
    <div
      {...stylex.props(
        headerActionsStyles.actions,
        isCollapsed && headerActionsStyles.actionsCollapsed,
      )}
    >
      <Button
        aria-label={expandButtonLabel}
        color='ghost'
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
        width='auto'
      />
      <Button
        aria-label={pinButtonLabel}
        color='ghost'
        icon={
          isPinned ? (
            <PinIcon size={controlIconSize} />
          ) : (
            <PinOffIcon size={controlIconSize} />
          )
        }
        isIconOnly
        onClick={onTogglePinned}
        size={controlButtonSize}
        title={pinButtonLabel}
        tooltipContent={pinButtonLabel}
        tooltipPlacement={controlTooltipPlacement}
        width='auto'
      />
      {isPinned ? undefined : (
        <Button
          aria-label='Close navigation'
          color='ghost'
          icon={<MenuCloseIcon size={controlIconSize} />}
          isIconOnly
          onClick={onClose}
          size={controlButtonSize}
          title='Close navigation'
          tooltipContent='Close navigation'
          tooltipPlacement={controlTooltipPlacement}
          width='auto'
        />
      )}
    </div>
  );
};
