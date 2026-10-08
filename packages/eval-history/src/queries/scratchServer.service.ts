import pg from 'pg';

import { quoteIdentifier } from '../migrate/quoteIdentifier.util.ts';
import { databaseUrl } from './databaseUrl.util.ts';

type DisposeArgs = {
  readonly databases: readonly string[];
  readonly roles: readonly string[];
};

type ScratchServerArgs = {
  readonly url: string;
};

export const scratchServer = ({ url }: ScratchServerArgs) => {
  const clients: pg.Client[] = [];

  const connect = async (database?: string) => {
    const client = new pg.Client({
      connectionString: databaseUrl({ database, url }),
    });

    await client.connect();
    clients.push(client);

    return client;
  };

  const dispose = async ({ databases, roles }: DisposeArgs) => {
    await Promise.all(clients.splice(0).map((client) => client.end()));

    const admin = new pg.Client({ connectionString: url });

    await admin.connect();

    try {
      for (const database of databases) {
        await admin.query(
          `drop database if exists ${quoteIdentifier(database)} with (force)`,
        );
      }

      for (const role of roles) {
        await admin.query(`drop role if exists ${quoteIdentifier(role)}`);
      }
    } finally {
      await admin.end();
    }
  };

  return { connect, dispose };
};
