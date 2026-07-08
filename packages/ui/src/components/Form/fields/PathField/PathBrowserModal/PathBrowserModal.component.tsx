import { Button } from '@repo/ui/components/Button';
import { FolderIcon } from '@repo/ui/components/Icons';
import { ICON_SIZE_SM } from '@repo/ui/design-system/constants/iconSizes.constants';
import * as stylex from '@stylexjs/stylex';
import { useId } from 'react';

import type { PathBrowserModalProps } from './PathBrowserModal.types';

import { styles } from './PathBrowserModal.stylex';
import { usePathBrowserDirectory } from './usePathBrowserDirectory.hook';
import { usePathBrowserEntryNavigation } from './usePathBrowserEntryNavigation.hook';

export const PathBrowserModal = ({
  browseAction,
  initialPath,
  isOpen,
  onClose,
  onSelect,
}: PathBrowserModalProps) => {
  const listboxId = useId();
  const { entries, error, isLoading, navigateTo, parentPath, resolvedPath } =
    usePathBrowserDirectory({ browseAction, initialPath, isOpen });
  const { activeEntryIndex, handleKeyDown, resetActiveEntryIndex } =
    usePathBrowserEntryNavigation({
      entries,
      onEscape: onClose,
      onSelectEntry: navigateTo,
    });

  if (!isOpen) {
    return;
  }

  const normalizedActiveEntryIndex =
    activeEntryIndex < entries.length ? activeEntryIndex : 0;

  const handleSelect = () => {
    if (resolvedPath) {
      onSelect(resolvedPath);
    }
    onClose();
  };

  const handleNavigateUp = () => {
    if (!parentPath) {
      return;
    }

    navigateTo(parentPath);
    resetActiveEntryIndex();
  };

  const handleEntryClick = (entryPath: string) => {
    navigateTo(entryPath);
    resetActiveEntryIndex();
  };

  return (
    <div {...stylex.props(styles.dropdown)}>
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
            isDisabled={!parentPath || isLoading}
            onClick={handleNavigateUp}
            size='mini'
            type='button'
            variant='flat'
          >
            Up
          </Button>
        </div>
      </div>

      {error && <p {...stylex.props(styles.error)}>{error}</p>}

      <ul
        aria-activedescendant={
          entries.length > 0
            ? `${listboxId}-option-${normalizedActiveEntryIndex}`
            : undefined
        }
        aria-label='Choose a folder'
        onKeyDown={handleKeyDown}
        role='listbox'
        tabIndex={0}
        {...stylex.props(styles.list)}
      >
        {entries.map((entry, index) => (
          <li key={entry.path}>
            <button
              aria-selected={index === activeEntryIndex}
              id={`${listboxId}-option-${index}`}
              onClick={() => handleEntryClick(entry.path)}
              role='option'
              tabIndex={-1}
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
