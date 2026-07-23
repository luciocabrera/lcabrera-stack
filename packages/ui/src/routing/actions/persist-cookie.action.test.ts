import type { ActionFunctionArgs } from 'react-router';

import { describe, expect, it, vi } from 'vite-plus/test';

vi.mock('@lcabrera/ui/utils/storage/buildCookieString.util', () => ({
  buildCookieString: vi.fn(
    ({ key, value }: { key: string; value: string }) =>
      `${key}=${value}; Path=/; HttpOnly`,
  ),
}));

import { buildCookieString } from '@lcabrera/ui/utils/storage/buildCookieString.util';

import { action } from './persist-cookie.action';

type ActionCallArgs = {
  readonly currentUrl: string;
  readonly entries: readonly {
    readonly key: string;
    readonly searchParamKey: string;
    readonly searchParamValue: string;
    readonly value: string;
  }[];
};

const callAction = async ({ currentUrl, entries }: ActionCallArgs) => {
  const formData = new FormData();
  formData.set('currentUrl', currentUrl);
  formData.set('entries', JSON.stringify(entries));

  const request = new Request('https://example.com/_action/persist-cookie', {
    body: formData,
    method: 'POST',
  });

  return action({ request } as ActionFunctionArgs);
};

describe('persist-cookie.action', () => {
  it('redirects when a query param value changes and sets cookies', async () => {
    const response = await callAction({
      currentUrl: '/enterprise-orders?page=1&sort=%7B%22id%22%3A%22asc%22%7D',
      entries: [
        {
          key: 'orders:sorting',
          searchParamKey: 'sort',
          searchParamValue: '{"id":"desc"}',
          value: '{"id":"desc"}',
        },
      ],
    });

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe(
      'https://example.com/enterprise-orders?page=1&sort=%7B%22id%22%3A%22desc%22%7D',
    );
    expect(response.headers.get('set-cookie')).toContain(
      'orders:sorting={"id":"desc"}',
    );
    expect(buildCookieString).toHaveBeenCalledWith({
      expiresAt: expect.any(Date),
      key: 'orders:sorting',
      value: '{"id":"desc"}',
    });
  });

  it('returns no-content without redirect when query params are unchanged', async () => {
    const response = await callAction({
      currentUrl: '/enterprise-orders?page=1&sort=%7B%22id%22%3A%22asc%22%7D',
      entries: [
        {
          key: 'orders:sorting',
          searchParamKey: 'sort',
          searchParamValue: '{"id":"asc"}',
          value: '{"id":"asc"}',
        },
      ],
    });

    expect(response.status).toBe(204);
    expect(response.headers.get('location')).toBeNull();
    expect(response.headers.get('set-cookie')).toContain(
      'orders:sorting={"id":"asc"}',
    );
  });

  it('returns no-content without redirect when only cookie entries are provided', async () => {
    const response = await callAction({
      currentUrl: '/enterprise-orders?page=1',
      entries: [
        {
          key: 'orders:columnOrder',
          searchParamKey: '',
          searchParamValue: '',
          value: '["id","name"]',
        },
      ],
    });

    expect(response.status).toBe(204);
    expect(response.headers.get('location')).toBeNull();
    expect(response.headers.get('set-cookie')).toContain(
      'orders:columnOrder=["id","name"]',
    );
  });

  it('redirects when deleting an existing query param', async () => {
    const response = await callAction({
      currentUrl:
        '/enterprise-orders?page=1&filters=%7B%22status%22%3A%5B%22paid%22%5D%7D',
      entries: [
        {
          key: 'orders:filters',
          searchParamKey: 'filters',
          searchParamValue: '',
          value: '{}',
        },
      ],
    });

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe(
      'https://example.com/enterprise-orders?page=1',
    );
  });

  it('returns no-content when deleting a query param that does not exist', async () => {
    const response = await callAction({
      currentUrl: '/enterprise-orders?page=1',
      entries: [
        {
          key: 'orders:filters',
          searchParamKey: 'filters',
          searchParamValue: '',
          value: '{}',
        },
      ],
    });

    expect(response.status).toBe(204);
    expect(response.headers.get('location')).toBeNull();
    expect(response.headers.get('set-cookie')).toContain('orders:filters={}');
  });
});
