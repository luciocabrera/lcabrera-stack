import type { SidePanelPosition } from '../SidePanel.types';

import { resolveSidePanelResizeWidth } from './resolveSidePanelResizeWidth.util';
import { resolveSidePanelWidthBounds } from './resolveSidePanelWidthBounds.util';

type StartSidePanelResizeSessionArgs = {
  readonly clientX: number;
  readonly currentWidth: number;
  readonly onGestureEnd: () => void;
  readonly onSessionEnd: () => void;
  readonly onWidthCommit: (width: number) => void;
  readonly position: SidePanelPosition;
  readonly setWidth: (width: number) => void;
  readonly viewportWidth: number;
};

export const startSidePanelResizeSession = ({
  clientX,
  currentWidth,
  onGestureEnd,
  onSessionEnd,
  onWidthCommit,
  position,
  setWidth,
  viewportWidth,
}: StartSidePanelResizeSessionArgs) => {
  const bounds = resolveSidePanelWidthBounds({ viewportWidth });
  const listenerController = new AbortController();
  let animationFrameId: number | undefined;
  let pendingWidth: number | undefined;

  const handleMouseMove = (moveEvent: MouseEvent) => {
    pendingWidth = resolveSidePanelResizeWidth({
      clientX: moveEvent.clientX,
      initialWidth: currentWidth,
      initialX: clientX,
      maxWidth: bounds.maxWidth,
      minWidth: bounds.minWidth,
      position,
    });

    if (animationFrameId !== undefined) {
      cancelAnimationFrame(animationFrameId);
    }
    animationFrameId = requestAnimationFrame(() => {
      if (pendingWidth !== undefined) {
        setWidth(pendingWidth);
      }
      animationFrameId = undefined;
    });
  };

  const endDragSession = () => {
    if (animationFrameId !== undefined) {
      cancelAnimationFrame(animationFrameId);
    }
    listenerController.abort();
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    onSessionEnd();
  };

  const handleMouseUp = () => {
    endDragSession();
    onGestureEnd();

    if (pendingWidth !== undefined) {
      setWidth(pendingWidth);
    }

    onWidthCommit(pendingWidth ?? currentWidth);
  };

  document.body.style.userSelect = 'none';
  document.body.style.cursor = 'col-resize';

  document.addEventListener('mousemove', handleMouseMove, {
    signal: listenerController.signal,
  });
  document.addEventListener('mouseup', handleMouseUp, {
    signal: listenerController.signal,
  });

  return endDragSession;
};
