/**
 * What the eval-history commands that write by hand share: the argument list
 * without the separator `vp run` passes through, the author a note or grade is
 * recorded under, and a client on the database EVALS_DATABASE_URL names.
 * Usage: imported by `annotate.mjs` and `grade.mjs`.
 */
import { execFileSync } from 'node:child_process';
import { userInfo } from 'node:os';
import process from 'node:process';
import pg from 'pg';

import { authorOf } from '../../src/annotations/authorOf.util.ts';
import { evalsDatabaseEnvSchema } from '../../src/migrate/evalsDatabaseEnv.schema.ts';

export const cliArguments = () => {
  const args = process.argv.slice(2);
  return args[0] === '--' ? args.slice(1) : args;
};

const gitEmail = () => {
  try {
    return execFileSync('git', ['config', 'user.email'], {
      encoding: 'utf8',
    }).trim();
  } catch {
    return;
  }
};

export const currentAuthor = () =>
  authorOf({ email: gitEmail(), env: process.env, user: userInfo().username });

export const databaseUrl = () => {
  const env = evalsDatabaseEnvSchema.safeParse(process.env);
  if (!env.success) {
    throw new Error('EVALS_DATABASE_URL must be a postgres:// URL (ADR-130)');
  }
  return env.data.EVALS_DATABASE_URL;
};

export const errorText = (error) => {
  if (Array.isArray(error?.issues)) {
    return error.issues
      .map(({ message, path }) => `${path.join('.')}: ${message}`)
      .join('\n');
  }
  return error instanceof Error ? error.message : String(error);
};

export const withEvalsClient = async (connectionString, work) => {
  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    return await work(client);
  } finally {
    await client.end();
  }
};
