import type { BrowseDirectoryEntry } from '@repo/ui/routing/browseDirectory.types';

import { useState } from 'react';

type UsePathBrowserEntryNavigationArgs = {
  readonly entries: readonly BrowseDirectoryEntry[];
  readonly onEscape: () => void;
  readonly onSelectEntry: (path: string) => void;
};

/**
 * Owns keyboard list-navigation (arrow/home/end/enter/escape) over the
 * currently listed directory entries for the accessible `role="listbox"`.
 */
export const usePathBrowserEntryNavigation = ({
  entries,
  onEscape,
  onSelectEntry,
}: UsePathBrowserEntryNavigationArgs) => {
  const [activeEntryIndex, setActiveEntryIndex] = useState(0);

  const resetActiveEntryIndex = () => {
    setActiveEntryIndex(0);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLUListElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onEscape();

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
      resetActiveEntryIndex();

      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      setActiveEntryIndex(entries.length - 1);

      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const normalizedActiveEntryIndex =
        activeEntryIndex < entries.length ? activeEntryIndex : 0;
      const activeEntry = entries[normalizedActiveEntryIndex];

      if (activeEntry) {
        onSelectEntry(activeEntry.path);
        resetActiveEntryIndex();
      }
    }
  };

  return { activeEntryIndex, handleKeyDown, resetActiveEntryIndex };
};
