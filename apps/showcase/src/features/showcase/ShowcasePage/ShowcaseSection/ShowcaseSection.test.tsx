// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vite-plus/test';

import { ShowcaseSection } from './ShowcaseSection.component';

afterEach(() => {
  cleanup();
});

it('titles the section with a level-2 heading above its content', () => {
  render(
    <ShowcaseSection title='Buttons'>
      <p>Section body</p>
    </ShowcaseSection>,
  );

  const heading = screen.getByRole('heading', { level: 2, name: 'Buttons' });

  expect(heading.tagName).toBe('H2');
  expect(screen.getAllByRole('heading')).toEqual([heading]);
  expect(
    heading.compareDocumentPosition(screen.getByText('Section body')),
  ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
});
