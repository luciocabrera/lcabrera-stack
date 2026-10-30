/**
 * Asserts that a tree rendered to a string on the server parses to the same DOM the client render produces.
 */

import type { ReactElement } from 'react';

import { render } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { expect } from 'vite-plus/test';

export const expectServerMarkupMatchesClient = (tree: ReactElement) => {
  const { container } = render(tree);
  const server = new DOMParser().parseFromString(
    renderToString(tree),
    'text/html',
  ).body;

  expect(container.childNodes).toHaveLength(1);
  expect(server.childNodes).toHaveLength(1);
  expect(server.firstChild?.isEqualNode(container.firstChild)).toBe(true);
};
