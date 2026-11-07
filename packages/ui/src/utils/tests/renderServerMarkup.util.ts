/**
 * Mounts a tree's server-rendered markup in the document, with no React root behind it, the way a browser holds a page before hydration.
 */

import type { ReactElement } from 'react';

import { renderToString } from 'react-dom/server';

export const renderServerMarkup = (tree: ReactElement) => {
  const container = document.createElement('div');

  container.innerHTML = renderToString(tree);
  document.body.append(container);

  return container;
};
