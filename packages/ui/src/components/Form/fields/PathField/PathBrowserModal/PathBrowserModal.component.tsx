import type { BrowseDirectoryResult } from '@repo/ui/routing/browseDirectory.types';

import { Button } from '@repo/ui/components/Button';
import { FolderIcon } from '@repo/ui/components/Icons';
import { Modal } from '@repo/ui/components/Modal';
import { ICON_SIZE_SM } from '@repo/ui/design-system/constants/iconSizes.constants';
import * as stylex from '@stylexjs/stylex';
import { useEffect, useRef, useState } from 'react';
import { useFetcher } from 'react-router';

import type { PathBrowserModalProps } from './PathBrowserModal.types';

import { styles } from './PathBrowserModal.stylex';

export const PathBrowserModal = ({
  browseAction,
  initialPath,
  isOpen,
  onClose,
  onSelect,
}: PathBrowserModalProps) => {
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
  const isLoading = fetcher.state !== 'idle';
  const resolvedPath = result?.path ?? currentPath;

  const handleSelect = () => {
    if (resolvedPath) {
      onSelect(resolvedPath);
    }
    onClose();
  };

  return (
    <Modal
      footer={
        <>
          <Button color='ghost' onClick={onClose} type='button' variant='flat'>
            Cancel
          </Button>
          <Button
            color='primary'
            isDisabled={!resolvedPath}
            onClick={handleSelect}
            type='button'
          >
            Select This Folder
          </Button>
        </>
      }
      isOpen={isOpen}
      onClose={onClose}
      title='Choose a Folder'
    >
      <div {...stylex.props(styles.header)}>
        <span {...stylex.props(styles.currentPath)}>
          {resolvedPath ?? 'Loading…'}
        </span>
        <Button
          isDisabled={!result?.parentPath || isLoading}
          onClick={() => setCurrentPath(result?.parentPath)}
          size='mini'
          type='button'
          variant='flat'
        >
          Up
        </Button>
      </div>

      {result?.error && <p {...stylex.props(styles.error)}>{result.error}</p>}

      <ul {...stylex.props(styles.list)}>
        {result?.entries.map((entry) => (
          <li key={entry.path}>
            <button
              {...stylex.props(styles.entryButton)}
              onClick={() => setCurrentPath(entry.path)}
              type='button'
            >
              <FolderIcon size={ICON_SIZE_SM} />
              {entry.name}
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  );
};
