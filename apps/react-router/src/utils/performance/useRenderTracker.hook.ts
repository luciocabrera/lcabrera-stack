import { useEffect, useRef } from 'react';

import { trackRenderComplete } from './renderTracker.util';
import { trackCurrentRender } from './utils';

type UseRenderTrackerOptions = {
  /** Only track if condition is true */
  isEnabled?: boolean;
  /** Log props that changed (useful for debugging why re-renders happen) */
  logProps?: Record<string, unknown>;
};

/**
 * Hook to track component renders for performance analysis
 *
 * @param params - Configuration object
 *
 * @example
 * ```tsx
 * const MyComponent = (props) => {
 *   useRenderTracker({ componentName: 'MyComponent' });
 *   // or with props logging:
 *   useRenderTracker({ componentName: 'MyComponent', logProps: props });
 *   return <div>...</div>;
 * };
 * ```
 */
export const useRenderTracker = ({
  componentName,
  ...options
}: UseRenderTrackerOptions & { componentName: string }): void => {
  // eslint-disable-next-line react-hooks/purity, react-x/purity -- Performance tracking is intentionally side-effectful
  const renderStartTime = useRef(performance.now());
  const prevPropsRef = useRef<Record<string, unknown>>(undefined);

  const isEnabled = options.isEnabled ?? true;
  const shouldTrack = import.meta.env.DEV && isEnabled;

  // Track render on every call (component render)
  if (shouldTrack) {
    trackCurrentRender({
      componentName,
      logProps: options.logProps,
      prevProps: prevPropsRef,
      renderStartTime,
    });
  }

  // Track render completion (after commit)
  useEffect(() => {
    if (!shouldTrack) {
      return;
    }

    trackRenderComplete({
      componentName,
      startTime: renderStartTime.current,
    });
  });
};
