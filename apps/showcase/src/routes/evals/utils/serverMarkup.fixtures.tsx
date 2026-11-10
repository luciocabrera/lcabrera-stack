import type { RouteObject } from 'react-router';

import { act, render } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import {
  createMemoryRouter,
  createStaticHandler,
  createStaticRouter,
  RouterProvider,
  StaticRouterProvider,
} from 'react-router';
import { expect } from 'vite-plus/test';

type ServerMarkupArgs = {
  readonly path: string;
  readonly routes: RouteObject[];
};

const fulfilled = (value: unknown) =>
  Object.assign(Promise.resolve(value), { status: 'fulfilled', value });

const settleDeferred = async (data: unknown) => {
  if (!(data instanceof Object)) {
    return data;
  }

  const entries = await Promise.all(
    Object.entries(data).map(async ([key, value]) => [
      key,
      value instanceof Promise ? fulfilled(await value) : value,
    ]),
  );

  return Object.fromEntries(entries);
};

const serverMarkup = async ({ path, routes }: ServerMarkupArgs) => {
  const handler = createStaticHandler(routes);
  const context = await handler.query(new Request(`http://localhost${path}`));

  if (context instanceof Response) {
    throw new TypeError(`the server answered ${path} with a response`);
  }

  const loaderData = Object.fromEntries(
    await Promise.all(
      Object.entries(context.loaderData).map(async ([id, data]) => [
        id,
        await settleDeferred(data),
      ]),
    ),
  );
  const settled = { ...context, loaderData };

  return {
    html: renderToString(
      <StaticRouterProvider
        context={settled}
        hydrate={false}
        router={createStaticRouter(handler.dataRoutes, settled)}
      />,
    ),
    loaderData,
  };
};

const elementsOf = (root: Element) => [...root.querySelectorAll('*')];

export const expectHydratesWithoutMismatch = async ({
  path,
  routes,
}: ServerMarkupArgs) => {
  const { html, loaderData } = await serverMarkup({ path, routes });
  const container = document.createElement('div');

  container.append(
    ...new DOMParser().parseFromString(html, 'text/html').body.childNodes,
  );

  const server = elementsOf(container);

  await act(async () => {
    render(
      <RouterProvider
        router={createMemoryRouter(routes, {
          hydrationData: { loaderData },
          initialEntries: [path],
        })}
      />,
      { container, hydrate: true, onRecoverableError: () => undefined },
    );
  });

  const client = elementsOf(container);

  expect(
    [...server, ...client].filter(
      (element) => !(server.includes(element) && client.includes(element)),
    ),
  ).toEqual([]);

  return container;
};
