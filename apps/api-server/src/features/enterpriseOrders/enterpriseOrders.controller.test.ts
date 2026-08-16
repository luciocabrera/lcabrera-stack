import type { NextFunction, Request, Response } from 'express';

import { MAX_ENTERPRISE_ORDERS_LIMIT } from 'api-shared';
import { describe, expect, it, vi } from 'vite-plus/test';

import type { EnterpriseOrdersRepository } from './enterpriseOrders.repository';

import { createEnterpriseOrdersController } from './enterpriseOrders.controller';

type InvokeArgs = {
  readonly query: Record<string, string>;
  readonly repository: EnterpriseOrdersRepository;
};

const invokeGetPaginated = async ({ query, repository }: InvokeArgs) => {
  const controller = createEnterpriseOrdersController({
    enterpriseOrdersDelayMs: 0,
    repository,
  });
  const json = vi.fn();
  const next = vi.fn();

  controller.getPaginated(
    { params: {}, query } as unknown as Request,
    { json } as unknown as Response,
    next as NextFunction,
  );
  await vi.waitFor(() => {
    expect(json.mock.calls.length + next.mock.calls.length).toBeGreaterThan(0);
  });

  return { json, next };
};

const emptyPage = { data: [], hasMore: false, total: 0 };

describe('createEnterpriseOrdersController', () => {
  /**
   * Express bounds the page window by *clamping* in the controller, where
   * `readQueryInteger` already applies `min` — the Fastify server rejects with a
   * 400 in its route schema instead. The divergence is deliberate and predates
   * this bound: `wideAlltypes150` has always answered this way on each server,
   * and the two exist to be compared, so each keeps its own idiom.
   */
  it('clamps a limit above MAX_ENTERPRISE_ORDERS_LIMIT to the ceiling', async () => {
    const getPaginated = vi.fn().mockResolvedValue(emptyPage);

    await invokeGetPaginated({
      query: { limit: String(MAX_ENTERPRISE_ORDERS_LIMIT + 1), skip: '0' },
      repository: { getOrderById: vi.fn(), getPaginated },
    });

    expect(getPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ limit: MAX_ENTERPRISE_ORDERS_LIMIT }),
    );
  });

  it('leaves an ordinary limit below the ceiling untouched', async () => {
    const getPaginated = vi.fn().mockResolvedValue(emptyPage);

    await invokeGetPaginated({
      query: { limit: '25', skip: '50' },
      repository: { getOrderById: vi.fn(), getPaginated },
    });

    expect(getPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 25, skip: 50 }),
    );
  });
});
