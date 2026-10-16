import { expect, it } from 'vite-plus/test';

type IntegrationDatabaseArgs = {
  readonly env?: Readonly<Record<string, string | undefined>>;
  readonly label: string;
};

const NOT_CI = new Set(['', '0', 'false']);

export const integrationDatabase = ({
  env = process.env,
  label,
}: IntegrationDatabaseArgs) => {
  const url = env.EVALS_TEST_DATABASE_URL;
  const isCi = !NOT_CI.has(env.CI ?? '');
  const scratch = `evals_${label}_${String(process.pid)}_${String(Date.now())}`;
  const scratchUrl = new URL(url ?? 'postgres://localhost');

  scratchUrl.pathname = `/${scratch}`;

  if (!url && !isCi) {
    process.stderr.write(
      `Skipping the Postgres ${label} tests: EVALS_TEST_DATABASE_URL is unset.\n`,
    );
  }

  it.runIf(isCi)(`has a database for the ${label} tests under CI`, () => {
    expect(url, 'EVALS_TEST_DATABASE_URL must be set under CI').toBeTruthy();
  });

  return { scratch, scratchUrl: scratchUrl.href, url };
};
