import type { BrowseDirectoryResult } from '@repo/ui/routing/browseDirectory.types';

import { Button } from '@repo/ui/components/Button';
import { FolderIcon } from '@repo/ui/components/Icons';
import { ICON_SIZE_SM } from '@repo/ui/design-system/constants/iconSizes.constants';
import * as stylex from '@stylexjs/stylex';
import { useEffect, useId, useRef, useState } from 'react';
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
  const listboxId = useId();
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [activeEntryIndex, setActiveEntryIndex] = useState(0);
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

  if (!isOpen) {
    return;
  }

  const result = fetcher.data;
  const entries = result?.entries ?? [];
  const isLoading = fetcher.state !== 'idle';
  const hasActiveOption = activeEntryIndex < entries.length;
  const normalizedActiveEntryIndex = hasActiveOption ? activeEntryIndex : 0;
  const resolvedPath = result?.path ?? currentPath;
  const activeOptionId = hasActiveOption
    ? `${listboxId}-option-${activeEntryIndex}`
    : undefined;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }

    if (entries.length === 0) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveEntryIndex(
        (previousIndex) => (previousIndex + 1) % entries.length,
      );
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveEntryIndex(
        (previousIndex) =>
          (previousIndex - 1 + entries.length) % entries.length,
      );
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      setActiveEntryIndex(0);
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      setActiveEntryIndex(entries.length - 1);
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const activeEntry = entries[normalizedActiveEntryIndex];
      if (activeEntry) {
        setCurrentPath(activeEntry.path);
        setActiveEntryIndex(0);
      }
    }
  };

  const handleSelect = () => {
    if (resolvedPath) {
      onSelect(resolvedPath);
    }
    onClose();
  };

  return (
    <div
      aria-activedescendant={activeOptionId}
      aria-label='Choose a folder'
      onKeyDown={handleKeyDown}
      role='listbox'
      tabIndex={0}
      {...stylex.props(styles.dropdown)}
    >
      <div {...stylex.props(styles.header)}>
        <span {...stylex.props(styles.currentPath)}>
          {resolvedPath ?? 'Loading…'}
        </span>
        <div {...stylex.props(styles.headerActions)}>
          <Button
            isDisabled={!resolvedPath}
            onClick={handleSelect}
            size='mini'
            type='button'
            variant='flat'
          >
            Use Current
          </Button>
          <Button
            isDisabled={!result?.parentPath || isLoading}
            onClick={() => {
              if (result?.parentPath) {
                setCurrentPath(result.parentPath);
                setActiveEntryIndex(0);
              }
            }}
            size='mini'
            type='button'
            variant='flat'
          >
            Up
          </Button>
        </div>
      </div>

      {result?.error && <p {...stylex.props(styles.error)}>{result.error}</p>}

      <ul role='presentation' {...stylex.props(styles.list)}>
        {entries.map((entry, index) => (
          <li key={entry.path}>
            <button
              aria-selected={index === activeEntryIndex}
              id={`${listboxId}-option-${index}`}
              onClick={() => {
                setCurrentPath(entry.path);
                setActiveEntryIndex(0);
              }}
              role='option'
              type='button'
              {...stylex.props(
                styles.entryButton,
                index === activeEntryIndex && styles.entryButtonActive,
              )}
            >
              <FolderIcon size={ICON_SIZE_SM} />
              {entry.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
