export type IngestClient = {
  readonly query: (config: IngestQuery) => Promise<{
    readonly rows: readonly unknown[];
  }>;
};

export type IngestConnection = {
  readonly client: IngestClient;
  readonly end: () => Promise<void>;
};

export type IngestFileSystem = {
  readonly readdir: (
    directory: string,
    options: { readonly recursive: true; readonly withFileTypes: true },
  ) => Promise<readonly IngestDirectoryEntry[]>;
  readonly readFile: (file: string) => Promise<Uint8Array>;
  readonly stat: (file: string) => Promise<{ readonly isFile: () => boolean }>;
};

export type IngestQuery = {
  readonly text: string;
  readonly values?: unknown[];
};

export type IngestReport = {
  readonly durationMs: number;
  readonly file: string;
  readonly problems: readonly string[];
  readonly result: IngestResult;
  readonly rows: IngestRows;
  readonly runId?: string;
  readonly suite?: string;
};

export type IngestResult =
  | 'conflict'
  | 'failed'
  | 'inserted'
  | 'present'
  | 'rejected'
  | 'unsent';

export type IngestRows = {
  readonly subjects: number;
  readonly tasks: number;
  readonly trials: number;
};

type IngestDirectoryEntry = {
  readonly isFile: () => boolean;
  readonly name: string;
  readonly parentPath: string;
};
