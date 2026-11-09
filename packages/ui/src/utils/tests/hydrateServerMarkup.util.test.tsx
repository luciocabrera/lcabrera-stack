// @vitest-environment jsdom

import { fireEvent, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vite-plus/test';

import { hydrateServerMarkup } from './hydrateServerMarkup.util';
import { renderServerMarkup } from './renderServerMarkup.util';

const Counter = () => {
  const [count, setCount] = useState(0);

  return (
    <button
      onClick={() => {
        setCount(count + 1);
      }}
      type='button'
    >
      {count}
    </button>
  );
};

const Clock = () => (
  <p>{typeof window === 'undefined' ? 'server' : 'client'}</p>
);

describe('hydrateServerMarkup', () => {
  it('attaches React to the server markup without replacing it', async () => {
    const tree = <Counter />;
    const container = renderServerMarkup(tree);
    const serverButton = container.querySelector('button');
    const { onRecoverableError, unmount } = await hydrateServerMarkup({
      container,
      tree,
    });

    expect(container.querySelector('button')).toBe(serverButton);
    expect(onRecoverableError).not.toHaveBeenCalled();

    fireEvent.click(serverButton as HTMLButtonElement);

    expect(serverButton?.textContent).toBe('1');

    unmount();

    expect(container.parentElement).toBeNull();
    expect(container.childElementCount).toBe(0);
  });

  it('records a markup mismatch as a recoverable error', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    const container = document.createElement('div');

    container.innerHTML = '<p>server</p>';
    document.body.append(container);

    const { onRecoverableError, unmount } = await hydrateServerMarkup({
      container,
      tree: <Clock />,
    });

    expect(onRecoverableError).toHaveBeenCalled();
    expect(screen.getByText('client').tagName).toBe('P');

    unmount();
    errors.mockRestore();
  });
});
