// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { createGetFormRoutesStub } from './createGetFormRoutesStub.util';

afterEach(cleanup);

describe('createGetFormRoutesStub', () => {
  it('renders the fields in a GET form that submits to /results', () => {
    const { Stub } = createGetFormRoutesStub({
      fields: <input defaultValue='one' name='a' />,
    });

    render(<Stub initialEntries={['/']} />);

    const form = screen.getByRole('textbox').closest('form');

    expect(form?.getAttribute('method')).toBe('get');
    expect(form?.getAttribute('action')).toBe('/results');
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('shows the query the results loader received', async () => {
    const { resultsLoader, Stub } = createGetFormRoutesStub({
      fields: <input defaultValue='one two' name='a' />,
    });

    render(<Stub initialEntries={['/']} />);
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

    const result = await screen.findByRole('status');

    expect(result.textContent).toBe('?a=one+two');
    expect(resultsLoader).toHaveBeenCalledTimes(1);
  });
});
