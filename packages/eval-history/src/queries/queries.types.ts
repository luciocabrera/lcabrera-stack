export type QueryClient = {
  readonly query: (query: SqlQuery) => Promise<{
    readonly rows: readonly unknown[];
  }>;
};

export type SqlQuery = {
  readonly text: string;
  readonly values: unknown[];
};
