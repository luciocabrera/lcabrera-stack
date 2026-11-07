// @vitest-environment jsdom

import { describe, expect, it } from 'vite-plus/test';

import { renderServerMarkup } from './renderServerMarkup.util';

describe('renderServerMarkup', () => {
  it('mounts the server markup in the document', () => {
    const container = renderServerMarkup(
      <p data-kind='server'>Rendered on the server</p>,
    );

    expect(container.parentElement).toBe(document.body);
    expect(container.childElementCount).toBe(1);
    expect(container.querySelector('p')?.dataset.kind).toBe('server');
    expect(container.textContent).toBe('Rendered on the server');

    container.remove();
  });
});
