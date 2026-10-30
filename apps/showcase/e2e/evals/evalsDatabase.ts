export const EVALS_E2E_READER = 'eval_history_e2e_reader';

export const EVALS_E2E_DATABASES = {
  empty: 'eval_history_e2e_empty',
  missing: 'eval_history_e2e_missing',
  seeded: 'eval_history_e2e',
} as const;

type EvalsE2eDatabase = keyof typeof EVALS_E2E_DATABASES;

const requireEnv = (name: string, value: string | undefined) => {
  if (value === undefined || value === '') {
    throw new Error(`Missing ${name} for the eval-history e2e database`);
  }

  return value;
};

export const EVALS_E2E_READER_PASSWORD = 'EVALS_E2E_READER_PASSWORD';

export const evalsE2eServer = (env: NodeJS.ProcessEnv = process.env) => {
  const password = requireEnv('DB_PASSWORD', env.DB_PASSWORD);
  const readerPassword = requireEnv(
    EVALS_E2E_READER_PASSWORD,
    env[EVALS_E2E_READER_PASSWORD],
  );
  const admin = new URL('postgres://localhost');

  admin.hostname = requireEnv('DB_HOST', env.DB_HOST);
  admin.port = requireEnv('DB_PORT', env.DB_PORT);
  admin.username = requireEnv('DB_USER', env.DB_USER);
  admin.password = password;
  admin.pathname = `/${requireEnv('DB_NAME', env.DB_NAME)}`;

  const urlOf = (database: EvalsE2eDatabase) => {
    const url = new URL(admin.href);

    url.pathname = `/${EVALS_E2E_DATABASES[database]}`;

    return url.href;
  };
  const readerUrlOf = (database: EvalsE2eDatabase) => {
    const url = new URL(urlOf(database));

    url.username = EVALS_E2E_READER;
    url.password = readerPassword;

    return url.href;
  };

  return { adminUrl: admin.href, readerPassword, readerUrlOf, urlOf };
};
