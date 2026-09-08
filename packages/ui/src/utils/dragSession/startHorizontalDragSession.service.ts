/**
 * The pointer half of a horizontal resize, shared by the two things in this
 * package that are dragged sideways: a column edge and the settings panel edge.
 * What differs between them is which width a pointer position means and what to
 * do with it — both are arguments. What is identical, and was written twice, is
 * the session itself: a frame-throttled write, an `AbortController` that takes
 * both listeners down at once, and the body cursor the whole document wears
 * while a drag is live (ADR-114).
 */
type StartHorizontalDragSessionArgs = {
  readonly initialWidth: number;
  readonly onCommit: (width: number) => void;
  readonly onGestureEnd: () => void;
  readonly onSessionEnd: () => void;
  readonly onWidth: (width: number) => void;
  readonly resolveWidth: (clientX: number) => number;
};

export const startHorizontalDragSession = ({
  initialWidth,
  onCommit,
  onGestureEnd,
  onSessionEnd,
  onWidth,
  resolveWidth,
}: StartHorizontalDragSessionArgs) => {
  const listenerController = new AbortController();
  let animationFrameId: number | undefined;
  let pendingWidth: number | undefined;
  let settledWidth: number | undefined;

  const handleMouseMove = (moveEvent: MouseEvent) => {
    pendingWidth = resolveWidth(moveEvent.clientX);
    settledWidth = pendingWidth;

    if (animationFrameId !== undefined) {
      cancelAnimationFrame(animationFrameId);
    }
    animationFrameId = requestAnimationFrame(() => {
      if (pendingWidth !== undefined) {
        onWidth(pendingWidth);
      }
      animationFrameId = undefined;
      pendingWidth = undefined;
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
      onWidth(pendingWidth);
    }

    onCommit(settledWidth ?? initialWidth);
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
