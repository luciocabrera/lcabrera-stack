// @vitest-environment jsdom

import type { Root } from 'react-dom/client';

import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { useState } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { createRoutesStub, Form, useLoaderData } from 'react-router';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vite-plus/test';

import { getFormQuery } from '#ui/utils/tests/getFormQuery.util';

import { VirtualSelect } from './VirtualSelect.component';

const OPTIONS = [
  { label: 'Open', value: 'open' },
  { label: 'Closed', value: 'closed' },
] as const;

const hydrated: { container: HTMLElement; root: Root }[] = [];

beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      public disconnect() {}

      public observe() {}
    },
  );
});

afterEach(() => {
  for (const { container, root } of hydrated.splice(0)) {
    act(() => {
      root.unmount();
    });
    container.remove();
  }
  vi.unstubAllGlobals();
  cleanup();
});

const StateField = () => {
  const [selected, setSelected] = useState<readonly string[]>(['open']);

  return (
    <VirtualSelect
      label='State'
      mode='single'
      name='a'
      onChange={setSelected}
      options={OPTIONS}
      selected={selected}
    />
  );
};

const Results = () => <output>{useLoaderData<string>()}</output>;

const createStub = () => {
  const resultsLoader = vi.fn(
    ({ request }: { readonly request: Request }) => new URL(request.url).search,
  );
  const Stub = createRoutesStub([
    {
      Component: () => (
        <Form action='/results' method='get'>
          <StateField />
          <button type='submit'>Apply</button>
        </Form>
      ),
      path: '/',
    },
    { Component: Results, loader: resultsLoader, path: '/results' },
  ]);

  return { resultsLoader, Stub };
};

describe('VirtualSelect in a router GET form', () => {
  it('submits ?a=<value> through the router once hydrated', async () => {
    const { resultsLoader, Stub } = createStub();
    const tree = <Stub initialEntries={['/']} />;
    const container = document.createElement('div');
    const onRecoverableError = vi.fn();

    container.innerHTML = renderToString(tree);
    document.body.append(container);

    expect(
      getFormQuery(container.querySelector('form') as HTMLFormElement),
    ).toBe('a=open');

    hydrated.push({
      container,
      root: await act(async () =>
        hydrateRoot(container, tree, { onRecoverableError }),
      ),
    });

    expect(onRecoverableError).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'State Open' }));
    fireEvent.click(screen.getByRole('button', { name: 'Closed' }));
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

    const result = await screen.findByRole('status');

    expect(result.textContent).toBe('?a=closed');
    expect(resultsLoader).toHaveBeenCalledTimes(1);
  });
});
