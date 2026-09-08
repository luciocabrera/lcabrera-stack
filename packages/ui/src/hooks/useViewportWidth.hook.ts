import { useSyncExternalStore } from 'react';

const subscribe = (onStoreChange: () => void) => {
  const controller = new AbortController();

  globalThis.addEventListener('resize', onStoreChange, {
    signal: controller.signal,
  });

  return () => {
    controller.abort();
  };
};

const getSnapshot = () => globalThis.innerWidth;

const getServerSnapshot = () => 0;

export const useViewportWidth = () =>
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
