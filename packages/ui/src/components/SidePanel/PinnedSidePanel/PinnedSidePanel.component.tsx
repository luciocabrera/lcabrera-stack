import * as stylex from '@stylexjs/stylex';
import { createPortal } from 'react-dom';

import type { PinnedSidePanelProps } from './PinnedSidePanel.types';

import { sidePanelStyles } from '../SidePanel.stylex';
import { resolveSidePanelSurfaceStyles } from '../utils';

export const PinnedSidePanel = ({
  children,
  portalContainer,
  position,
  resizeHandle,
  size,
  width,
  ...props
}: PinnedSidePanelProps) => {
  const panelStyles = resolveSidePanelSurfaceStyles({
    isOpen: true,
    isPinned: true,
    position,
    shouldShowOverlay: false,
    size,
    ...(width !== undefined && { width }),
  });

  const aside = (
    <aside
      aria-label='Settings panel'
      data-testid='side-panel'
      {...props}
      {...panelStyles}
    >
      {resizeHandle}
      <div {...stylex.props(sidePanelStyles.content)}>{children}</div>
    </aside>
  );

  if (portalContainer?.current) {
    return createPortal(aside, portalContainer.current);
  }

  return aside;
};
