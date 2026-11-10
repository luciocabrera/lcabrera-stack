// @vitest-environment jsdom

import { cleanup } from '@testing-library/react';
import { use } from 'react';
import { useLoaderData } from 'react-router';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { expectHydratesWithoutMismatch } from './serverMarkup.fixtures';

const Deferred = () => {
  const { later, now } = useLoaderData<{
    readonly later: Promise<string>;
    readonly now: string;
  }>();

  return (
    <p>
      {now} {use(later)}
    </p>
  );
};

const Plain = () => <p>{String(useLoaderData())}</p>;

const renderCounter = () => {
  let count = 0;

  return () => {
    count += 1;

    return count;
  };
};

const nextRender = renderCounter();

const Mismatched = () => <p>render {nextRender()}</p>;

afterEach(() => {
  cleanup();
});

describe('expectHydratesWithoutMismatch', () => {
  it('passes a page whose deferred data settled on the server', async () => {
    const page = await expectHydratesWithoutMismatch({
      path: '/',
      routes: [
        {
          Component: Deferred,
          loader: () => ({ later: Promise.resolve('later'), now: 'now' }),
          path: '/',
        },
      ],
    });

    expect(page.textContent).toBe('now later');
  });

  it('passes a page whose loader returns a plain value', async () => {
    const page = await expectHydratesWithoutMismatch({
      path: '/',
      routes: [{ Component: Plain, loader: () => 'text', path: '/' }],
    });

    expect(page.textContent).toBe('text');
  });

  it('fails a page that renders differently on the client', async () => {
    await expect(
      expectHydratesWithoutMismatch({
        path: '/',
        routes: [{ Component: Mismatched, path: '/' }],
      }),
    ).rejects.toThrow(/to deeply equal \[\]/u);
  });

  it('refuses a path the server answers with a response', async () => {
    await expect(
      expectHydratesWithoutMismatch({
        path: '/',
        routes: [
          {
            loader: () =>
              new Response(undefined, {
                headers: { Location: '/elsewhere' },
                status: 302,
              }),
            path: '/',
          },
        ],
      }),
    ).rejects.toThrow('the server answered / with a response');
  });
});
