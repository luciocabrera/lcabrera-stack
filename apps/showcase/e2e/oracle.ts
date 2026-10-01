import { Client } from 'pg';

type CountRow = {
  readonly count: number;
};

type OrderFilter =
  | { readonly prefix: string; readonly type: 'orderNumberStartsWith' }
  | { readonly type: 'gift' }
  | { readonly type: 'orderDateAfter'; readonly value: string }
  | { readonly type: 'orderNumberEquals'; readonly value: string }
  | { readonly type: 'priorityEquals'; readonly value: string }
  | { readonly type: 'quantityGreaterThan'; readonly value: number }
  | { readonly type: 'statusEquals'; readonly value: string };

type OrderNumberRow = {
  readonly order_number: string;
};

type OrderSort =
  | 'dateDescQuantityAsc'
  | 'orderDateDesc'
  | 'orderIdAsc'
  | 'orderIdDesc'
  | 'quantityDesc';

type ReadOrderSampleArgs = {
  readonly filters?: readonly OrderFilter[];
  readonly sort?: OrderSort;
};

const requireEnv = (name: string, value: string | undefined) => {
  if (value === undefined || value === '') {
    throw new Error(`Missing ${name} for the table oracle`);
  }

  return value;
};

const readDatabaseSettings = () => {
  const port = Number(process.env.DB_PORT);

  if (!Number.isSafeInteger(port) || port <= 0) {
    throw new TypeError('DB_PORT must be an integer');
  }

  return {
    database: requireEnv('DB_NAME', process.env.DB_NAME),
    host: requireEnv('DB_HOST', process.env.DB_HOST),
    password: requireEnv('DB_PASSWORD', process.env.DB_PASSWORD),
    port,
    user: requireEnv('DB_USER', process.env.DB_USER),
  };
};

const withClient = async <T>(run: (client: Client) => Promise<T>) => {
  const client = new Client(readDatabaseSettings());
  await client.connect();

  try {
    return await run(client);
  } finally {
    await client.end();
  }
};

const sortSql = (sort: OrderSort) => {
  switch (sort) {
    case 'dateDescQuantityAsc': {
      return 'order_date DESC, quantity ASC, order_id ASC';
    }
    case 'orderDateDesc': {
      return 'order_date DESC, order_id ASC';
    }
    case 'orderIdAsc': {
      return 'order_id ASC';
    }
    case 'orderIdDesc': {
      return 'order_id DESC';
    }
    case 'quantityDesc': {
      return 'quantity DESC, order_id ASC';
    }
    default: {
      const unexpected: never = sort;
      throw new Error(`Unexpected sort ${String(unexpected)}`);
    }
  }
};

const compileFilter = (filter: OrderFilter, index: number) => {
  switch (filter.type) {
    case 'gift': {
      return { clause: 'is_gift IS TRUE', values: [] };
    }
    case 'orderDateAfter': {
      return { clause: `order_date > $${index}`, values: [filter.value] };
    }
    case 'orderNumberEquals': {
      return { clause: `order_number = $${index}`, values: [filter.value] };
    }
    case 'orderNumberStartsWith': {
      return {
        clause: `order_number ILIKE $${index}`,
        values: [`${filter.prefix}%`],
      };
    }
    case 'priorityEquals': {
      return { clause: `priority = $${index}`, values: [filter.value] };
    }
    case 'quantityGreaterThan': {
      return { clause: `quantity > $${index}`, values: [filter.value] };
    }
    case 'statusEquals': {
      return { clause: `order_status = $${index}`, values: [filter.value] };
    }
    default: {
      const unexpected: never = filter;
      throw new Error(`Unexpected filter ${String(unexpected)}`);
    }
  }
};

const compileFilters = (filters: readonly OrderFilter[]) => {
  const clauses: string[] = [];
  const values: unknown[] = [];

  for (const filter of filters) {
    const compiled = compileFilter(filter, values.length + 1);
    clauses.push(compiled.clause);

    for (const value of compiled.values) {
      values.push(value);
    }
  }

  return { clauses, values };
};

export const readOrderSample = async ({
  filters = [],
  sort = 'orderIdAsc',
}: ReadOrderSampleArgs = {}) => {
  const { clauses, values } = compileFilters(filters);
  const where = clauses.length === 0 ? '' : `WHERE ${clauses.join(' AND ')}`;

  return withClient(async (client) => {
    const countResult = await client.query<CountRow>(
      `SELECT count(*)::int AS count FROM enterprise_orders ${where}`,
      values,
    );
    const rowResult = await client.query<OrderNumberRow>(
      `SELECT order_number FROM enterprise_orders ${where} ORDER BY ${sortSql(sort)} LIMIT 1`,
      values,
    );
    const countRow = countResult.rows[0];

    if (countRow === undefined) {
      throw new Error('enterprise_orders count returned no row');
    }

    return {
      count: Number(countRow.count),
      orderNumber: rowResult.rows[0]?.order_number,
    };
  });
};
