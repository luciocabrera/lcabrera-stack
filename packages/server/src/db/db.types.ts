import type { ClientBase } from 'pg';

export type ExecutorOptions = {
  readonly tx?: TransactionClient;
};

export type TransactionClient = ClientBase;
