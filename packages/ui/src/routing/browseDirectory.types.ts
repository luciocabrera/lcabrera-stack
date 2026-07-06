export type BrowseDirectoryEntry = {
  readonly name: string;
  readonly path: string;
};

export type BrowseDirectoryResult = {
  readonly entries: readonly BrowseDirectoryEntry[];
  readonly error?: string;
  /** Absent when the browsed path is the filesystem root. */
  readonly parentPath?: string;
  readonly path: string;
};
