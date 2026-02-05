import { useEffect, useRef } from 'react';

import { trackRender, trackRenderComplete } from './renderTracker.util';

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
  // eslint-disable-next-line react-hooks/purity -- Performance tracking is intentionally side-effectful
  const renderStartTime = useRef(performance.now());
  const prevPropsRef = useRef<Record<string, unknown>>(undefined);

  const isEnabled = options.isEnabled ?? true;

  // Track render on every call (component render)
  if (import.meta.env.DEV && isEnabled) {
    trackRender(componentName);

    // Log which props changed
    if (options.logProps && prevPropsRef.current) {
      const changedProps: string[] = [];
      const currentProps = options.logProps;
      const prevProps = prevPropsRef.current;

      for (const key of Object.keys(currentProps)) {
        // eslint-disable-next-line security/detect-object-injection -- Safe: iterating over known object keys
        if (currentProps[key] !== prevProps[key]) {
          changedProps.push(key);
        }
      }

      if (changedProps.length > 0) {
        // eslint-disable-next-line no-console -- Console logging is intentional for performance tracking
        console.log(
          `[${componentName}] Props changed:`,
          changedProps.join(', '),
        );
      }
    }

    prevPropsRef.current = options.logProps;
    // eslint-disable-next-line react-hooks/purity -- Performance tracking is intentionally side-effectful
    renderStartTime.current = performance.now();
  }

  // Track render completion (after commit)
  useEffect(() => {
    if (import.meta.env.DEV && isEnabled) {
      trackRenderComplete(componentName, renderStartTime.current);
    }
  });
};
