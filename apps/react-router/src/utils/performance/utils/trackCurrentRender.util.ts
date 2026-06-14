import type { MutableRefObject } from 'react';

import { trackRender } from '../renderTracker.util';

import { getChangedPropKeys } from './getChangedPropKeys.util';

type TrackCurrentRenderArgs = {
  readonly componentName: string;
  readonly logProps?: Record<string, unknown>;
  readonly prevProps: MutableRefObject<Record<string, unknown> | undefined>;
  readonly renderStartTime: MutableRefObject<number>;
};

const logChangedProps = ({
  componentName,
  currentProps,
  prevProps,
}: {
  readonly componentName: string;
  readonly currentProps?: Record<string, unknown>;
  readonly prevProps?: Record<string, unknown>;
}) => {
  if (!currentProps || !prevProps) {
    return;
  }

  const changedProps = getChangedPropKeys({ currentProps, prevProps });

  if (changedProps.length === 0) {
    return;
  }

  // eslint-disable-next-line no-console, react-x/purity -- Console logging is intentional for performance tracking
  console.log(`[${componentName}] Props changed:`, changedProps.join(', '));
};

export const trackCurrentRender = ({
  componentName,
  logProps,
  prevProps,
  renderStartTime,
}: TrackCurrentRenderArgs) => {
  trackRender(componentName);
  logChangedProps({
    componentName,
    currentProps: logProps,
    prevProps: prevProps.current,
  });
  prevProps.current = logProps;
  // eslint-disable-next-line react-hooks/purity, react-x/purity -- Performance tracking is intentionally side-effectful
  renderStartTime.current = performance.now();
};
