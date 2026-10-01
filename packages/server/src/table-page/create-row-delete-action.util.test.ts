import { beforeEach, expect, it, vi } from 'vite-plus/test';

import { createRowDeleteAction } from './create-row-delete-action.util.ts';
import { toIntegerRowId } from './to-integer-row-id.util.ts';

const deleteRow = vi.fn<(id: number) => Promise<undefined>>(
  async () => undefined,
);

const action = createRowDeleteAction({ deleteRow, parseId: toIntegerRowId });

const submit = (fields: Record<string, string>) =>
  action({
    request: new Request('http://localhost/items/delete', {
      body: new URLSearchParams(fields),
      method: 'POST',
    }),
  });

beforeEach(() => {
  deleteRow.mockClear();
});

it('deletes the row the form names and reports it', async () => {
  const response = await submit({ id: '42', intent: 'delete' });

  expect(response.status).toBe(200);
  expect(await response.json()).toStrictEqual({ id: 42, ok: true });
  expect(deleteRow).toHaveBeenCalledWith(42);
});

it('answers 400 for any other intent, and deletes nothing', async () => {
  const response = await submit({ id: '42', intent: 'archive' });

  expect(response.status).toBe(400);
  expect(await response.json()).toStrictEqual({
    error: 'Unsupported action intent',
  });
  expect(deleteRow).not.toHaveBeenCalled();
});

it.each<Record<string, string>>([{}, { id: '' }])(
  'answers 400 for a missing id (%p)',
  async (fields) => {
    const response = await submit({ intent: 'delete', ...fields });

    expect(response.status).toBe(400);
    expect(await response.json()).toStrictEqual({ error: 'Missing row id' });
    expect(deleteRow).not.toHaveBeenCalled();
  },
);

it.each(['abc', '1.5', '0', '-3'])(
  'answers 400 for an id the parser refuses (%p)',
  async (id) => {
    const response = await submit({ id, intent: 'delete' });

    expect(response.status).toBe(400);
    expect(await response.json()).toStrictEqual({ error: 'Invalid row id' });
    expect(deleteRow).not.toHaveBeenCalled();
  },
);

it('passes the parsed id through, whatever type the parser yields', async () => {
  const deleteByKey = vi.fn<(key: string) => Promise<undefined>>(
    async () => undefined,
  );
  const byKey = createRowDeleteAction({
    deleteRow: deleteByKey,
    parseId: (raw) => raw.toUpperCase(),
  });

  await byKey({
    request: new Request('http://localhost/items/delete', {
      body: new URLSearchParams({ id: 'ab-1', intent: 'delete' }),
      method: 'POST',
    }),
  });

  expect(deleteByKey).toHaveBeenCalledWith('AB-1');
});
