import * as stylex from '@stylexjs/stylex';
import { useRef } from 'react';

import type { SidePanelResizeHandleProps } from './SidePanelResizeHandle.types';

import { useSidePanelHostWidth } from '../hooks/useSidePanelHostWidth.hook';
import { useSidePanelResize } from '../hooks/useSidePanelResize.hook';
import {
  SIDE_PANEL_MIN_WIDTH,
  SIDE_PANEL_RESIZE_LABEL,
} from '../SidePanel.constants';
import { styles } from './SidePanelResizeHandle.stylex';

export const SidePanelResizeHandle = ({
  label = SIDE_PANEL_RESIZE_LABEL,
  onWidthChange,
  onWidthCommit,
  position,
  width,
}: SidePanelResizeHandleProps) => {
  const handleRef = useRef<HTMLButtonElement>(null);
  const hostWidth = useSidePanelHostWidth({ ref: handleRef });
  const currentWidth =
    hostWidth > 0 ? hostWidth : (width ?? SIDE_PANEL_MIN_WIDTH);

  const { bounds, isResizing, onKeyDown, onMouseDown } = useSidePanelResize({
    onWidthChange,
    ...(onWidthCommit !== undefined && { onWidthCommit }),
    position,
    width: currentWidth,
  });

  return (
    <button
      aria-label={label}
      aria-orientation='vertical'
      aria-valuemax={Math.round(bounds.maxWidth)}
      aria-valuemin={bounds.minWidth}
      aria-valuenow={Math.round(currentWidth)}
      aria-valuetext={`${Math.round(currentWidth)} pixels`}
      data-testid='side-panel-resize-handle'
      onKeyDown={onKeyDown}
      onMouseDown={onMouseDown}
      ref={handleRef}
      role='separator'
      type='button'
      {...stylex.props(
        styles.handle,
        styles[position],
        isResizing && styles.handleActive,
      )}
    />
  );
};
