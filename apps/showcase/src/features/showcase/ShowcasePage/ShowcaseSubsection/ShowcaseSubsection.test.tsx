// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vite-plus/test';

import { ShowcaseSubsection } from './ShowcaseSubsection.component';

afterEach(() => {
  cleanup();
});

it('titles the subsection with a level-3 heading above its content', () => {
  render(
    <ShowcaseSubsection title='Variants'>
      <p>Subsection body</p>
    </ShowcaseSubsection>,
  );

  const heading = screen.getByRole('heading', { level: 3, name: 'Variants' });

  expect(heading.tagName).toBe('H3');
  expect(screen.getAllByRole('heading')).toEqual([heading]);
  expect(
    heading.compareDocumentPosition(screen.getByText('Subsection body')),
  ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
});

it('renders a node title inside the heading', () => {
  render(
    <ShowcaseSubsection
      title={
        <>
          Fetch <em>mode</em>
        </>
      }
    >
      <p>Subsection body</p>
    </ShowcaseSubsection>,
  );

  const heading = screen.getByRole('heading', { level: 3, name: 'Fetch mode' });

  expect(heading.contains(screen.getByText('mode'))).toBe(true);
});
