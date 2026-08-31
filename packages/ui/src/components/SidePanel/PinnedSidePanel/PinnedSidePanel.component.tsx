import * as stylex from '@stylexjs/stylex';
import { createPortal } from 'react-dom';

import { surfaceStyles } from '#ui/design-system/tokens/surfaces.stylex';

import type { PinnedSidePanelProps } from './PinnedSidePanel.types';

import { sidePanelStyles } from '../SidePanel.stylex';

export const PinnedSidePanel = ({
  children,
  portalContainer,
  position,
  size,
  ...props
}: PinnedSidePanelProps) => {
  const openStyle =
    position === 'left' ? ('leftOpen' as const) : ('rightOpen' as const);
  const panelStyles = stylex.props(
    surfaceStyles.glassPanel,
    sidePanelStyles.base,
    sidePanelStyles.size[size],
    sidePanelStyles.position[position],
    sidePanelStyles.position[openStyle],
    sidePanelStyles.withoutBackdrop,
    sidePanelStyles.pinned,
  );

  const aside = (
    <aside
      aria-label='Settings panel'
      data-testid='side-panel'
      {...props}
      {...panelStyles}
    >
      <div {...stylex.props(sidePanelStyles.content)}>{children}</div>
    </aside>
  );

  if (portalContainer?.current) {
    return createPortal(aside, portalContainer.current);
  }

  return aside;
};
