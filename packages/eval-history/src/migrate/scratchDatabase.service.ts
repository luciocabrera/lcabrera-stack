import pg from 'pg';

type ScratchDatabaseArgs = {
  readonly adminUrl: string | undefined;
  readonly name: string;
};

export const scratchDatabase = ({ adminUrl, name }: ScratchDatabaseArgs) => {
  const url = new URL(adminUrl ?? 'postgres://localhost');

  url.pathname = `/${name}`;

  return {
    admin: new pg.Client({ connectionString: adminUrl }),
    client: new pg.Client({ connectionString: url.href }),
    connectionString: url.href,
  };
};
