/**
 * Runs the README's "Serve an HTTP API" example as written: its two code blocks are
 * copied into a scratch directory inside this package and imported, with only `pg`
 * replaced, and the server they start is called over real HTTP.
 */

import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';

import { once } from 'node:events';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vite-plus/test';

const { end, on, query } = vi.hoisted(() => ({
  end: vi.fn(),
  on: vi.fn(),
  query: vi.fn(),
}));

vi.mock('pg', () => ({
  Pool: class {
    public readonly end = end;
    public readonly on = on;
    public readonly query = query;
  },
}));

const PACKAGE_ROOT = join(import.meta.dirname, '..', '..');
const SCRATCH = join(PACKAGE_ROOT, '.tmp', 'readme-http-api');
const SECTION_HEADING = '## Serve an HTTP API';

const readExampleBlocks = () => {
  const readme = readFileSync(join(PACKAGE_ROOT, 'README.md'), 'utf8');
  const start = readme.indexOf(SECTION_HEADING);
  const section = readme.slice(
    start,
    readme.indexOf('\n## ', start + SECTION_HEADING.length),
  );

  return Object.fromEntries(
    section
      .matchAll(/```ts\n\/\/ (\S+)\n([\s\S]*?)```/g)
      .map(([, name, source]) => [name, source]),
  );
};

const toDriverError = (fields: Readonly<Record<string, string>>) =>
  Object.assign(
    new Error(`raw driver message: ${fields.detail ?? ''}`),
    fields,
  );

const PAGE_ROWS = [
  { id: 1, name: 'a', status: 'draft' },
  { id: 2, name: 'b', status: 'draft' },
];

const served: { current: Server | undefined; poolEvents: string[] } = {
  current: undefined,
  poolEvents: [],
};

type RequestArgs = {
  readonly init?: RequestInit;
  readonly path: string;
};

const request = async ({ init, path }: RequestArgs) => {
  if (served.current === undefined) {
    throw new Error('The README example is not serving.');
  }

  const { port } = served.current.address() as AddressInfo;
  const response = await fetch(`http://127.0.0.1:${port}${path}`, init);

  return { body: await response.text(), status: response.status };
};

beforeAll(async () => {
  const { 'api.ts': api, 'server.ts': server } = readExampleBlocks();

  if (api === undefined || server === undefined) {
    throw new Error(
      `"${SECTION_HEADING}" in README.md must hold a \`// api.ts\` and a \`// server.ts\` block.`,
    );
  }

  rmSync(SCRATCH, { force: true, recursive: true });
  mkdirSync(SCRATCH, { recursive: true });
  writeFileSync(join(SCRATCH, 'api.ts'), api);
  writeFileSync(join(SCRATCH, 'server.ts'), server);

  vi.stubEnv('DB_HOST', 'localhost');
  vi.stubEnv('DB_NAME', 'catalog');
  vi.stubEnv('DB_PASSWORD', 'secret');
  vi.stubEnv('DB_PORT', '5432');
  vi.stubEnv('DB_USER', 'reader');
  vi.stubEnv('PORT', '0');

  const example: { readonly server: Server } = await import(
    pathToFileURL(join(SCRATCH, 'server.ts')).href
  );

  served.current = example.server;
  served.poolEvents = on.mock.calls.map(([event]) => String(event));

  if (!example.server.listening) await once(example.server, 'listening');
});

afterAll(async () => {
  if (served.current?.listening) {
    served.current.close();
    await once(served.current, 'close');
  }

  rmSync(SCRATCH, { force: true, recursive: true });
  vi.unstubAllEnvs();
});

beforeEach(() => {
  query.mockReset();
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

describe('the README HTTP API example', () => {
  it('listens for idle-connection failures on the pool', () => {
    expect(served.poolEvents).toStrictEqual(['error']);
  });

  it('serves a page of rows read through the pool', async () => {
    query.mockImplementation(async (text: string) => ({
      rows: text.startsWith('SELECT count(') ? [{ count: '2' }] : PAGE_ROWS,
    }));

    const response = await request({ path: '/items?limit=2' });

    expect(response.status).toBe(200);
    expect(JSON.parse(response.body)).toStrictEqual({
      data: PAGE_ROWS,
      hasMore: false,
      total: 2,
    });
    expect(query).toHaveBeenCalledWith(
      'SELECT "id", "name", "status" FROM "catalog"."items" ORDER BY "id" ASC LIMIT $1 OFFSET $2',
      [2, 0],
    );
  });

  it('inserts the posted row and returns it', async () => {
    query.mockResolvedValue({ rows: [{ id: 3, name: 'c', status: 'draft' }] });

    const response = await request({
      init: { body: JSON.stringify({ name: 'c' }), method: 'POST' },
      path: '/items',
    });

    expect(response.status).toBe(201);
    expect(JSON.parse(response.body)).toStrictEqual({
      id: 3,
      name: 'c',
      status: 'draft',
    });
  });

  it('answers a driver failure with plain data and none of the driver text', async () => {
    const driverError = toDriverError({
      code: '42P01',
      detail: 'relation "catalog.items" does not exist',
      table: 'items',
    });
    query.mockRejectedValue(driverError);

    const response = await request({ path: '/items' });

    expect(response.status).toBe(500);
    expect(JSON.parse(response.body)).toStrictEqual({
      error: {
        code: '42P01',
        kind: 'db-failed',
        message: 'The database rejected the operation.',
      },
    });
    expect(response.body).not.toContain('relation');
    expect(console.error).toHaveBeenCalledWith(
      expect.objectContaining({ cause: driverError }),
    );
  });

  it('answers a unique-key conflict with a 409 that names neither the index nor the value', async () => {
    query.mockRejectedValue(
      toDriverError({
        code: '23505',
        constraint: 'items_name_key',
        detail: 'Key (name)=(widget) already exists.',
      }),
    );

    const response = await request({
      init: { body: JSON.stringify({ name: 'widget' }), method: 'POST' },
      path: '/items',
    });

    expect(response.status).toBe(409);
    expect(JSON.parse(response.body)).toStrictEqual({
      error: {
        code: '23505',
        kind: 'db-failed',
        message: 'A record with these values already exists.',
      },
    });
    expect(response.body).not.toContain('items_name_key');
    expect(response.body).not.toContain('widget');
  });

  it('answers a cancelled statement with a 503', async () => {
    query.mockRejectedValue(toDriverError({ code: '57014' }));

    const response = await request({ path: '/items' });

    expect(response.status).toBe(503);
    expect(JSON.parse(response.body)).toMatchObject({
      error: { kind: 'db-canceled' },
    });
  });

  it('refuses a body it cannot read without touching the pool', async () => {
    const response = await request({
      init: { body: 'not json', method: 'POST' },
      path: '/items',
    });

    expect(response.status).toBe(400);
    expect(query).not.toHaveBeenCalled();
  });

  it('answers an unreadable filter with an empty page carrying the refusal', async () => {
    const response = await request({ path: '/items?filter=not-json' });

    expect(response.status).toBe(200);
    expect(JSON.parse(response.body)).toStrictEqual({
      data: [],
      error: {
        kind: 'unexpected',
        message:
          'The filter in this request could not be read, so no rows were read.',
      },
      hasMore: false,
      total: 0,
    });
    expect(query).not.toHaveBeenCalled();
  });

  it('answers a filter on an unlisted column as unexpected, without naming the column', async () => {
    const filter = JSON.stringify({
      hidden_note: { operator: 'contains', type: 'text', value: 'x' },
    });

    const response = await request({
      path: `/items?filter=${encodeURIComponent(filter)}`,
    });

    expect(response.status).toBe(500);
    expect(JSON.parse(response.body)).toStrictEqual({
      error: {
        kind: 'unexpected',
        message: 'The request could not be completed.',
      },
    });
    expect(response.body).not.toContain('hidden_note');
    expect(query).not.toHaveBeenCalled();
  });

  it('answers an unknown path with a 404 and an unsupported method with a 405', async () => {
    const missing = await request({ path: '/elsewhere' });
    const unsupported = await request({
      init: { method: 'DELETE' },
      path: '/items',
    });

    expect(missing.status).toBe(404);
    expect(unsupported.status).toBe(405);
  });
});
