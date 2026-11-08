// @vitest-environment jsdom

import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { TextInput } from '#ui/components/TextInput';
import { createGetFormRoutesStub } from '#ui/utils/tests/createGetFormRoutesStub.util';
import { getFormQuery } from '#ui/utils/tests/getFormQuery.util';
import { hydrateServerMarkup } from '#ui/utils/tests/hydrateServerMarkup.util';
import { renderServerMarkup } from '#ui/utils/tests/renderServerMarkup.util';

import { Select } from './Select.component';

const unmounts: (() => void)[] = [];

afterEach(() => {
  for (const unmount of unmounts.splice(0)) unmount();
  cleanup();
});

const createStub = () =>
  createGetFormRoutesStub({
    fields: (
      <>
        <Select
          defaultValue='closed'
          id='state'
          label='State'
          name='a'
          options={[
            { label: 'Open', value: 'open' },
            { label: 'Closed', value: 'closed' },
          ]}
        />
        <TextInput
          defaultValue='main'
          id='branch'
          label='Branch'
          name='branch'
        />
      </>
    ),
  });

describe('Select and TextInput in a router GET form', () => {
  it('render named native controls that submit without any script', () => {
    const { Stub } = createStub();
    const container = renderServerMarkup(<Stub initialEntries={['/']} />);
    const form = container.querySelector('form') as HTMLFormElement;

    expect(getFormQuery(form)).toBe('a=closed&branch=main');

    (form.elements.namedItem('a') as HTMLSelectElement).value = 'open';
    (form.elements.namedItem('branch') as HTMLInputElement).value = 'release';

    expect(getFormQuery(form)).toBe('a=open&branch=release');

    container.remove();
  });

  it('submit ?a=<value>&branch=<text> through the router once hydrated', async () => {
    const { resultsLoader, Stub } = createStub();
    const tree = <Stub initialEntries={['/']} />;
    const { onRecoverableError, unmount } = await hydrateServerMarkup({
      container: renderServerMarkup(tree),
      tree,
    });

    unmounts.push(unmount);

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

  it('hydrate the generated label ids without a mismatch when no id is passed', async () => {
    const { Stub } = createGetFormRoutesStub({
      fields: (
        <>
          <Select
            label='State'
            name='a'
            options={[{ label: 'Open', value: 'open' }]}
          />
          <TextInput label='Branch' name='branch' />
        </>
      ),
    });
    const tree = <Stub initialEntries={['/']} />;
    const container = renderServerMarkup(tree);
    const serverIds = [...container.querySelectorAll('select, input')].map(
      (control) => control.id,
    );
    const { onRecoverableError, unmount } = await hydrateServerMarkup({
      container,
      tree,
    });

    unmounts.push(unmount);

    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(serverIds.every((id) => id.length > 0)).toBe(true);
    expect([
      screen.getByLabelText('State').id,
      screen.getByLabelText('Branch').id,
    ]).toStrictEqual(serverIds);
  });
});
