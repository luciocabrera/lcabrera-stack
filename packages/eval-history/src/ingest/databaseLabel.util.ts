export const databaseLabel = (connectionString: string) => {
  const url = new URL(connectionString);

  return `${url.hostname}:${url.port || '5432'}/${decodeURIComponent(url.pathname.slice(1))}`;
};
