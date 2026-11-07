// @vitest-environment jsdom

import type { ReactElement } from 'react';
import type { Root } from 'react-dom/client';

import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { createRoutesStub, Form, useLoaderData } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { TextInput } from '#ui/components/TextInput';
import { getFormQuery } from '#ui/utils/tests/getFormQuery.util';

import { Select } from './Select.component';

const OPTIONS = [
  { label: 'Open', value: 'open' },
  { label: 'Closed', value: 'closed' },
] as const;

const hydrated: { container: HTMLElement; root: Root }[] = [];

afterEach(() => {
  for (const { container, root } of hydrated.splice(0)) {
    act(() => {
      root.unmount();
    });
    container.remove();
  }
  cleanup();
});

const Results = () => <output>{useLoaderData<string>()}</output>;

const createStub = () => {
  const resultsLoader = vi.fn(
    ({ request }: { readonly request: Request }) => new URL(request.url).search,
  );
  const Stub = createRoutesStub([
    {
      Component: () => (
        <Form action='/results' method='get'>
          <Select
            defaultValue='closed'
            id='state'
            label='State'
            name='a'
            options={OPTIONS}
          />
          <TextInput
            defaultValue='main'
            id='branch'
            label='Branch'
            name='branch'
          />
          <button type='submit'>Apply</button>
        </Form>
      ),
      path: '/',
    },
    { Component: Results, loader: resultsLoader, path: '/results' },
  ]);

  return { resultsLoader, Stub };
};

const renderOnServer = (tree: ReactElement) => {
  const container = document.createElement('div');

  container.innerHTML = renderToString(tree);
  document.body.append(container);

  return container;
};

describe('Select and TextInput in a router GET form', () => {
  it('render named native controls that submit without any script', () => {
    const { Stub } = createStub();
    const container = renderOnServer(<Stub initialEntries={['/']} />);
    const form = container.querySelector('form') as HTMLFormElement;

    expect(form.getAttribute('method')).toBe('get');
    expect(form.getAttribute('action')).toBe('/results');
    expect(getFormQuery(form)).toBe('a=closed&branch=main');

    (form.elements.namedItem('a') as HTMLSelectElement).value = 'open';
    (form.elements.namedItem('branch') as HTMLInputElement).value = 'release';

    expect(getFormQuery(form)).toBe('a=open&branch=release');

    container.remove();
  });

  it('submit ?a=<value>&branch=<text> through the router once hydrated', async () => {
    const { resultsLoader, Stub } = createStub();
    const tree = <Stub initialEntries={['/']} />;
    const container = renderOnServer(tree);
    const onRecoverableError = vi.fn();

    hydrated.push({
      container,
      root: await act(async () =>
        hydrateRoot(container, tree, { onRecoverableError }),
      ),
    });

    expect(onRecoverableError).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('State'), {
      target: { value: 'open' },
    });
    fireEvent.change(screen.getByLabelText('Branch'), {
      target: { value: 'release 2' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

    const result = await screen.findByRole('status');

    expect(result.textContent).toBe('?a=open&branch=release+2');
    expect(resultsLoader).toHaveBeenCalledTimes(1);
  });
});
