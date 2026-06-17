import type { ChangeEvent } from 'react';

export type VirtualListHeaderProps = {
  readonly name?: string;
  readonly onClearSearch: () => void;
  readonly onSearchChange: (event: ChangeEvent<HTMLInputElement>) => void;
  readonly searchTerm: string;
};
