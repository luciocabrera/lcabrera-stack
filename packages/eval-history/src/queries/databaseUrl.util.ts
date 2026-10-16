type DatabaseUrlArgs = {
  readonly database?: string;
  readonly password?: string;
  readonly url: string;
  readonly user?: string;
};

export const databaseUrl = ({
  database,
  password = '',
  url,
  user,
}: DatabaseUrlArgs) => {
  const target = new URL(url);

  if (database !== undefined) {
    target.pathname = `/${database}`;
  }

  if (user !== undefined) {
    target.username = user;
    target.password = password;
  }

  return target.href;
};
