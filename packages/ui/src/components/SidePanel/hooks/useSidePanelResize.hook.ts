import { useEffect, useRef, useState } from 'react';

import { useViewportWidth } from '#ui/hooks/useViewportWidth.hook';

import type { SidePanelPosition } from '../SidePanel.types';

import {
  resolveSidePanelKeyboardResizeAction,
  resolveSidePanelWidthBounds,
  startSidePanelResizeSession,
} from '../utils';

type UseSidePanelResizeArgs = {
  readonly onWidthChange: (width: number) => void;
  readonly onWidthCommit?: (width: number) => void;
  readonly onWidthReset?: () => void;
  readonly position: SidePanelPosition;
  readonly width: number;
};

export const useSidePanelResize = ({
  onWidthChange,
  onWidthCommit,
  onWidthReset,
  position,
  width,
}: UseSidePanelResizeArgs) => {
  const [isResizing, setIsResizing] = useState(false);
  const endDragSessionRef = useRef<(() => void) | undefined>(undefined);

  useEffect(() => {
    return () => {
      endDragSessionRef.current?.();
    };
  }, []);

  const viewportWidth = useViewportWidth();
  const bounds = resolveSidePanelWidthBounds({
    currentWidth: width,
    viewportWidth,
  });

  const commitWidth = (nextWidth: number) => {
    onWidthCommit?.(nextWidth);
  };

  const onMouseDown = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();

    endDragSessionRef.current?.();

    endDragSessionRef.current = startSidePanelResizeSession({
      clientX: event.clientX,
      currentWidth: width,
      onGestureEnd: () => setIsResizing(false),
      onSessionEnd: () => {
        endDragSessionRef.current = undefined;
      },
      onWidthCommit: commitWidth,
      position,
      setWidth: onWidthChange,
      viewportWidth,
    });

    setIsResizing(true);
  };

  const onDoubleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (onWidthReset === undefined) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    onWidthReset();
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    const action = resolveSidePanelKeyboardResizeAction({
      currentWidth: width,
      isShiftPressed: event.shiftKey,
      key: event.key,
      maxWidth: bounds.maxWidth,
      minWidth: bounds.minWidth,
      position,
    });

    if (action.type === 'ignore') {
      return;
    }

    if (action.type === 'reset') {
      if (onWidthReset === undefined) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      onWidthReset();

      return;
    }

    event.preventDefault();
    event.stopPropagation();
    onWidthChange(action.width);
    commitWidth(action.width);
  };

  return { bounds, isResizing, onDoubleClick, onKeyDown, onMouseDown };
};
