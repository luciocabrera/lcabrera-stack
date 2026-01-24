import { useEffect, useRef } from 'react';

import { trackRender, trackRenderComplete } from './renderTracker.util';

/**
 * Hook to track component renders for performance analysis
 *
 * @param componentName - Name of the component being tracked
 * @param options - Optional configuration
 *
 * @example
 * ```tsx
 * const MyComponent = (props) => {
 *   useRenderTracker('MyComponent');
 *   // or with props logging:
 *   useRenderTracker('MyComponent', { logProps: props });
 *   return <div>...</div>;
 * };
 * ```
 */
export const useRenderTracker = (
  componentName: string,
  options?: {
    /** Log props that changed (useful for debugging why re-renders happen) */
    logProps?: Record<string, unknown>;
    /** Only track if condition is true */
    when?: boolean;
  },
): void => {
  const renderStartTime = useRef(performance.now());
  const prevPropsRef = useRef<Record<string, unknown>>();

  // Track render on every call (component render)
  if (import.meta.env.DEV && (options?.when ?? true)) {
    trackRender(componentName);

    // Log which props changed
    if (options?.logProps && prevPropsRef.current) {
      const changedProps: string[] = [];
      const currentProps = options.logProps;
      const prevProps = prevPropsRef.current;

      for (const key of Object.keys(currentProps)) {
        if (currentProps[key] !== prevProps[key]) {
          changedProps.push(key);
        }
      }

      if (changedProps.length > 0) {
        console.log(
          `[${componentName}] Props changed:`,
          changedProps.join(', '),
        );
      }
    }

    prevPropsRef.current = options?.logProps;
    renderStartTime.current = performance.now();
  }

  // Track render completion (after commit)
  useEffect(() => {
    if (import.meta.env.DEV && (options?.when ?? true)) {
      trackRenderComplete(componentName, renderStartTime.current);
    }
  });
};
