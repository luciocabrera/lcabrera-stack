import pg from 'pg';

import { inSequence } from '../ingest/inSequence.service.ts';

type CloseArgs = {
  readonly databases?: readonly string[];
  readonly roles?: readonly string[];
};

export const scratchConnections = (databaseUrl: string) => {
  const clients: pg.Client[] = [];

  const connect = async (database?: string) => {
    const url = new URL(databaseUrl);

    if (database) {
      url.pathname = `/${database}`;
    }

    const client = new pg.Client({ connectionString: url.href });

    await client.connect();
    clients.push(client);

    return client;
  };

  const close = async ({ databases = [], roles = [] }: CloseArgs = {}) => {
    await Promise.all(clients.map((client) => client.end()));
    const admin = new pg.Client({ connectionString: databaseUrl });

    await admin.connect();

    const statements = [
      ...databases.map(
        (database) => `drop database if exists "${database}" with (force)`,
      ),
      ...roles.map((role) => `drop role if exists "${role}"`),
    ];

    try {
      await inSequence({
        items: statements,
        step: (statement) => admin.query(statement),
      });
    } finally {
      await admin.end();
    }
  };

  return { close, connect };
};
