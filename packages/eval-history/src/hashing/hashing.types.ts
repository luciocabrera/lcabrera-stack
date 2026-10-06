export type HashedFile = {
  readonly bytes: string | Uint8Array;
  readonly path: string;
};

export type HashingDirectoryEntry = {
  readonly isFile: () => boolean;
  readonly name: string;
  readonly parentPath: string;
};

export type HashingFileSystem = {
  readonly readdir: (
    directory: string,
    options: { readonly recursive: true; readonly withFileTypes: true },
  ) => Promise<readonly HashingDirectoryEntry[]>;
  readonly readFile: (file: string) => Promise<Uint8Array>;
};

export type SkillCatalogEntry = {
  readonly description?: string;
  readonly name?: string;
  readonly paths?: readonly string[];
};
