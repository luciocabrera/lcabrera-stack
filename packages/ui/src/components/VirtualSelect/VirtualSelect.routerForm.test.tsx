// @vitest-environment jsdom

import { cleanup, fireEvent, screen } from '@testing-library/react';
import { useState } from 'react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vite-plus/test';

import { createGetFormRoutesStub } from '#ui/utils/tests/createGetFormRoutesStub.util';
import { getFormQuery } from '#ui/utils/tests/getFormQuery.util';
import { hydrateServerMarkup } from '#ui/utils/tests/hydrateServerMarkup.util';
import { renderServerMarkup } from '#ui/utils/tests/renderServerMarkup.util';

import { VirtualSelect } from './VirtualSelect.component';

const unmounts: (() => void)[] = [];

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
  for (const unmount of unmounts.splice(0)) unmount();
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
      options={[
        { label: 'Open', value: 'open' },
        { label: 'Closed', value: 'closed' },
      ]}
      selected={selected}
    />
  );
};

describe('VirtualSelect in a router GET form', () => {
  it('submits ?a=<value> through the router once hydrated', async () => {
    const { resultsLoader, Stub } = createGetFormRoutesStub({
      fields: <StateField />,
    });
    const tree = <Stub initialEntries={['/']} />;
    const container = renderServerMarkup(tree);

    expect(
      getFormQuery(container.querySelector('form') as HTMLFormElement),
    ).toBe('a=open');

    const { onRecoverableError, unmount } = await hydrateServerMarkup({
      container,
      tree,
    });

    unmounts.push(unmount);

    expect(onRecoverableError).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'State Open' }));
    fireEvent.click(screen.getByRole('button', { name: 'Closed' }));
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

    const result = await screen.findByRole('status');

    expect(result.textContent).toBe('?a=closed');
    expect(resultsLoader).toHaveBeenCalledTimes(1);
  });
});
