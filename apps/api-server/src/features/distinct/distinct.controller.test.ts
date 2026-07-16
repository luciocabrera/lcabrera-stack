import type { NextFunction, Request, Response } from 'express';

import { HttpError } from 'api-shared';
import { describe, expect, it, vi } from 'vitest';

import type { DistinctRepository } from './distinct.repository';

import { createDistinctController } from './distinct.controller';

type InvokeArgs = {
  readonly query: Record<string, string>;
  readonly repository: DistinctRepository;
};

const invokeGetDistinctValues = async ({ query, repository }: InvokeArgs) => {
  const controller = createDistinctController({
    distinctValuesDelayMs: 0,
    repository,
  });
  const json = vi.fn();
  const next = vi.fn();

  controller.getDistinctValues(
    { params: {}, query } as unknown as Request,
    { json } as unknown as Response,
    next as NextFunction,
  );
  await vi.waitFor(() => {
    expect(json.mock.calls.length + next.mock.calls.length).toBeGreaterThan(0);
  });

  return { json, next };
};

describe('createDistinctController', () => {
  it('parses query params and responds with the repository result', async () => {
    const getDistinctValues = vi
      .fn()
      .mockResolvedValue({ hasMore: false, values: ['Pending'] });

    const { json, next } = await invokeGetDistinctValues({
      query: {
        columnName: 'order_status',
        limit: '25',
        offset: '50',
        schemaName: 'public',
        tableName: 'enterprise_orders',
      },
      repository: { getDistinctValues },
    });

    expect(getDistinctValues).toHaveBeenCalledWith({
      columnName: 'order_status',
      limit: 25,
      offset: 50,
      schemaName: 'public',
      tableName: 'enterprise_orders',
    });
    expect(json).toHaveBeenCalledWith({ hasMore: false, values: ['Pending'] });
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects requests missing source params with a 400 HttpError', async () => {
    const getDistinctValues = vi.fn();

    const { json, next } = await invokeGetDistinctValues({
      query: { columnName: 'order_status' },
      repository: { getDistinctValues },
    });

    expect(getDistinctValues).not.toHaveBeenCalled();
    expect(json).not.toHaveBeenCalled();
    const [error] = next.mock.calls[0] as [HttpError];
    expect(error).toBeInstanceOf(HttpError);
    expect(error.statusCode).toBe(400);
  });

  it('forwards repository allow-list rejections to the error middleware', async () => {
    const getDistinctValues = vi.fn().mockRejectedValue(
      new HttpError({
        message: 'Unsupported distinct source',
        statusCode: 400,
      }),
    );

    const { json, next } = await invokeGetDistinctValues({
      query: {
        columnName: 'secret',
        schemaName: 'private',
        tableName: 'users',
      },
      repository: { getDistinctValues },
    });

    expect(json).not.toHaveBeenCalled();
    const [error] = next.mock.calls[0] as [HttpError];
    expect(error.statusCode).toBe(400);
  });
});
