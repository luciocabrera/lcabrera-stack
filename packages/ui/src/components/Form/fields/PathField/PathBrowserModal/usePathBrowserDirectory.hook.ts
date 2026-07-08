import type { BrowseDirectoryResult } from '@repo/ui/routing/browseDirectory.types';

import { useEffect, useRef, useState } from 'react';
import { useFetcher } from 'react-router';

type UsePathBrowserDirectoryArgs = {
  readonly browseAction: string;
  readonly initialPath?: string;
  readonly isOpen: boolean;
};

/**
 * Owns the browsed directory's `currentPath` and its associated `fetcher`
 * load lifecycle: resets the path when the modal (re)opens or `initialPath`
 * changes, and (re)loads the directory listing whenever the path changes
 * while open.
 */
export const usePathBrowserDirectory = ({
  browseAction,
  initialPath,
  isOpen,
}: UsePathBrowserDirectoryArgs) => {
  const fetcher = useFetcher<BrowseDirectoryResult>();
  const [currentPath, setCurrentPath] = useState(initialPath);
  const loadRef = useRef(fetcher.load);

  // Keep the ref pointing at the latest fetcher.load without depending on its
  // identity in the load effect below ("latest ref" pattern — updated in an
  // effect, never during render).
  useEffect(() => {
    loadRef.current = fetcher.load;
  });

  // Reset the browsed path whenever the modal (re)opens or the field value
  // backing `initialPath` changes — adjusted during render (guarded by the
  // previous-value comparison) instead of via a state-setting effect.
  const [previousResetKey, setPreviousResetKey] = useState({
    initialPath,
    isOpen,
  });
  if (
    previousResetKey.initialPath !== initialPath ||
    previousResetKey.isOpen !== isOpen
  ) {
    setPreviousResetKey({ initialPath, isOpen });
    if (isOpen) {
      setCurrentPath(initialPath);
    }
  }

  useEffect(() => {
    if (!isOpen) return;

    const params = new URLSearchParams();
    if (currentPath) params.set('path', currentPath);
    void loadRef.current(`${browseAction}?${params.toString()}`);
  }, [browseAction, currentPath, isOpen]);

  const result = fetcher.data;

  return {
    entries: result?.entries ?? [],
    error: result?.error,
    isLoading: fetcher.state !== 'idle',
    navigateTo: setCurrentPath,
    parentPath: result?.parentPath,
    resolvedPath: result?.path ?? currentPath,
  };
};
