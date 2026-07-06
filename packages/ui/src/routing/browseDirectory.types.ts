export type BrowseDirectoryEntry = {
  readonly name: string;
  readonly path: string;
};

export type BrowseDirectoryResult = {
  readonly entries: readonly BrowseDirectoryEntry[];
  readonly error?: string;
  readonly parentPath: null | string;
  readonly path: string;
};
