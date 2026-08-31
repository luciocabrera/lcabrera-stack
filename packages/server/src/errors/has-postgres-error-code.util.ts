type HasPostgresErrorCodeArgs = {
  readonly code: string;
  readonly error: unknown;
};

export const hasPostgresErrorCode = ({
  code,
  error,
}: HasPostgresErrorCodeArgs) =>
  error instanceof Error && 'code' in error && error.code === code;
