import * as stylex from '@stylexjs/stylex';
import { useRef } from 'react';

import type { SidePanelResizeHandleProps } from './SidePanelResizeHandle.types';

import { useSidePanelHostWidth } from '../hooks/useSidePanelHostWidth.hook';
import { useSidePanelResize } from '../hooks/useSidePanelResize.hook';
import { SIDE_PANEL_MIN_WIDTH } from '../SidePanel.constants';
import { styles } from './SidePanelResizeHandle.stylex';

export const SidePanelResizeHandle = ({
  onWidthChange,
  onWidthCommit,
  position,
  width,
}: SidePanelResizeHandleProps) => {
  const handleRef = useRef<HTMLButtonElement>(null);
  const hostWidth = useSidePanelHostWidth({ ref: handleRef });
  const paintedWidth = hostWidth > 0 ? hostWidth : SIDE_PANEL_MIN_WIDTH;
  const currentWidth = width ?? paintedWidth;

  const { bounds, isResizing, onKeyDown, onMouseDown } = useSidePanelResize({
    onWidthChange,
    ...(onWidthCommit !== undefined && { onWidthCommit }),
    position,
    width: currentWidth,
  });

  return (
    <button
      aria-label='Resize settings panel'
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
