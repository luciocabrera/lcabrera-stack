import type { ClientActionFunctionArgs } from 'react-router';

import { describe, expect, it, vi } from 'vitest';

import { clientAction } from './login.clientAction';

const SERVER_RESULT = { ok: true };

const formRequest = (fields: Record<string, string>) =>
  new Request('http://localhost/login', {
    body: new URLSearchParams(fields),
    method: 'POST',
  });

type InvokeArgs = {
  readonly request: Request;
  readonly serverAction: () => Promise<unknown>;
};

const invoke = ({ request, serverAction }: InvokeArgs) =>
  clientAction({
    request,
    serverAction,
  } as unknown as ClientActionFunctionArgs);

describe('login clientAction', () => {
  it('does not call serverAction when validation fails', async () => {
    const serverAction = vi.fn(() => Promise.resolve(SERVER_RESULT));

    const result = await invoke({
      request: formRequest({ email: 'bad', password: 'short' }),
      serverAction,
    });

    expect(serverAction).not.toHaveBeenCalled();
    expect(result).toEqual({
      errors: { email: expect.any(String), password: expect.any(String) },
    });
  });

  it('delegates to serverAction when validation passes', async () => {
    const serverAction = vi.fn(() => Promise.resolve(SERVER_RESULT));

    const result = await invoke({
      request: formRequest({
        email: 'demo@example.com',
        password: 'demo-password-123',
      }),
      serverAction,
    });

    expect(serverAction).toHaveBeenCalledTimes(1);
    expect(result).toBe(SERVER_RESULT);
  });
});
