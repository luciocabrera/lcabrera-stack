import * as stylex from '@stylexjs/stylex';

import type { SidePanelResizeHandleProps } from './SidePanelResizeHandle.types';

import { useSidePanelResize } from '../hooks/useSidePanelResize.hook';
import { styles } from './SidePanelResizeHandle.stylex';

export const SidePanelResizeHandle = ({
  onWidthChange,
  onWidthCommit,
  position,
  width,
}: SidePanelResizeHandleProps) => {
  const { bounds, isResizing, onKeyDown, onMouseDown } = useSidePanelResize({
    onWidthChange,
    ...(onWidthCommit !== undefined && { onWidthCommit }),
    position,
    width,
  });

  return (
    <div
      aria-label='Resize settings panel'
      aria-orientation='vertical'
      aria-valuemax={Math.round(bounds.maxWidth)}
      aria-valuemin={bounds.minWidth}
      aria-valuenow={Math.round(width)}
      aria-valuetext={`${Math.round(width)} pixels`}
      data-testid='side-panel-resize-handle'
      onKeyDown={onKeyDown}
      onMouseDown={onMouseDown}
      role='separator'
      tabIndex={0}
      {...stylex.props(
        styles.handle,
        styles[position],
        isResizing && styles.handleActive,
      )}
    />
  );
};
