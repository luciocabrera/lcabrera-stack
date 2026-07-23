// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { SectionCard } from './SectionCard.component';

afterEach(cleanup);

describe('SectionCard', () => {
  it('renders the title, description, and children', () => {
    render(
      <SectionCard description='A description' title='A Title'>
        <p>Section content</p>
      </SectionCard>,
    );

    expect(
      screen.getByRole('heading', { level: 2, name: 'A Title' }),
    ).toBeDefined();
    expect(screen.getByText('A description')).toBeDefined();
    expect(screen.getByText('Section content')).toBeDefined();
  });

  it('omits the description paragraph when none is given', () => {
    render(
      <SectionCard title='A Title'>
        <p>Section content</p>
      </SectionCard>,
    );

    expect(screen.queryByText('A description')).toBeNull();
  });
});
