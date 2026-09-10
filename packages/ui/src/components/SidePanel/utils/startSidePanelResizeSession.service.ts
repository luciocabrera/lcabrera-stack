import { startHorizontalDragSession } from '#ui/utils/dragSession/startHorizontalDragSession.service';

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
  const bounds = resolveSidePanelWidthBounds({ currentWidth, viewportWidth });

  return startHorizontalDragSession({
    onCommit: onWidthCommit,
    onGestureEnd,
    onSessionEnd,
    onWidth: setWidth,
    resolveWidth: (pointerX: number) =>
      resolveSidePanelResizeWidth({
        clientX: pointerX,
        initialWidth: currentWidth,
        initialX: clientX,
        maxWidth: bounds.maxWidth,
        minWidth: bounds.minWidth,
        position,
      }),
  });
};
