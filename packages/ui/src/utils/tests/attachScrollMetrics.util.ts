/**
 * Stubs a jsdom scroll container's viewport so a virtualized grid can measure.
 */

type AttachScrollMetricsArgs = {
  readonly container: HTMLDivElement | undefined;
  readonly height: number;
};

export const attachScrollMetrics = ({
  container,
  height,
}: AttachScrollMetricsArgs) => {
  if (!container) return;
  if (Object.getOwnPropertyDescriptor(container, 'scrollTop')) return;

  Object.defineProperties(container, {
    clientHeight: { configurable: true, value: height },
    offsetHeight: { configurable: true, value: height },
    scrollTop: { configurable: true, value: 0, writable: true },
  });
};
