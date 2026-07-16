type SetupObservedContainerArgs = {
  readonly container: HTMLElement | null | undefined;
  readonly onMeasure: () => void;
  readonly readScroll: () => number;
  readonly setScroll: (value: number) => void;
};

export const setupObservedContainer = ({
  container,
  onMeasure,
  readScroll,
  setScroll,
}: SetupObservedContainerArgs): (() => void) => {
  let animationFrameId = -1;

  const handleScroll = () => {
    if (animationFrameId >= 0) {
      return;
    }

    animationFrameId = globalThis.requestAnimationFrame(() => {
      animationFrameId = -1;
      setScroll(readScroll());
    });
  };

  const syncScrollPosition = () => {
    if (animationFrameId >= 0) {
      globalThis.cancelAnimationFrame(animationFrameId);
      animationFrameId = -1;
    }

    setScroll(readScroll());
  };

  onMeasure();

  const resizeObserver =
    typeof ResizeObserver === 'undefined'
      ? undefined
      : new ResizeObserver(() => {
          onMeasure();
        });

  if (container) {
    resizeObserver?.observe(container);
  }

  syncScrollPosition();
  container?.addEventListener('scroll', handleScroll, { passive: true });

  return () => {
    if (animationFrameId >= 0) {
      globalThis.cancelAnimationFrame(animationFrameId);
      animationFrameId = -1;
    }
    container?.removeEventListener('scroll', handleScroll);
    resizeObserver?.disconnect();
  };
};
