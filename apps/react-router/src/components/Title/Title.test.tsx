// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Title } from './Title.component';

describe('Title', () => {
  it('renders nothing when title, icon, and actions are all missing', () => {
    const { container } = render(<Title />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the title from selector', () => {
    render(<Title>Enterprise Orders</Title>);

    const heading = screen.getByRole('heading', { name: 'Enterprise Orders' });
    expect(heading.tagName).toBe('H2');
  });

  it('renders icon and actions slots when provided', () => {
    render(
      <Title
        actions={<button type='button'>Refresh</button>}
        icon={<span>Icon</span>}
      />,
    );

    expect(screen.getByText('Icon').textContent).toBe('Icon');
    expect(screen.getByRole('button', { name: 'Refresh' }).tagName).toBe(
      'BUTTON',
    );
  });
});
