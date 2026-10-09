import pg from 'pg';

import { evalsReaderEnvSchema } from './evalsReaderEnv.schema.ts';

type ReaderPool = {
  readonly pool: pg.Pool;
  readonly url: string;
};

const poolRef: { current: ReaderPool | undefined } = { current: undefined };

export const closeEvalsReaderPool = async () => {
  const open = poolRef.current;

  poolRef.current = undefined;
  await open?.pool.end();
};

export const evalsReaderPool = (env: NodeJS.ProcessEnv = process.env) => {
  const { EVALS_READER_DATABASE_URL: url } = evalsReaderEnvSchema.parse(env);

  if (poolRef.current?.url !== url) {
    void closeEvalsReaderPool();
    poolRef.current = { pool: new pg.Pool({ connectionString: url }), url };
  }

  return poolRef.current.pool;
};
