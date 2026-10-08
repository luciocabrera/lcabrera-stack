import pg from 'pg';

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

    try {
      for (const database of databases) {
        await admin.query(`drop database if exists "${database}" with (force)`);
      }

      for (const role of roles) {
        await admin.query(`drop role if exists "${role}"`);
      }
    } finally {
      await admin.end();
    }
  };

  return { close, connect };
};
