// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { ErrorDescriptive } from './ErrorDescriptive.component';

afterEach(cleanup);

describe('ErrorDescriptive', () => {
  it('renders an accessible SVG illustration labelled by its title and description', () => {
    render(<ErrorDescriptive />);

    const image = screen.getByRole('img');
    expect(image.tagName.toLowerCase()).toBe('svg');

    const labelledBy = image.getAttribute('aria-labelledby');
    expect(labelledBy).not.toBeNull();

    const [titleId, descId] = (labelledBy ?? '').split(' ', 2);
    expect(document.getElementById(titleId ?? '')?.textContent).toBe(
      'Data fetch error',
    );
    expect(document.getElementById(descId ?? '')?.textContent).toContain(
      'breaking link',
    );
  });

  it('composes the illustration parts, including the disruption particles', () => {
    const { container } = render(<ErrorDescriptive />);

    // The particle group emits several <circle> nodes — asserting they exist
    // confirms the DisruptionParticles sub-illustration rendered.
    expect(container.querySelectorAll('circle').length).toBeGreaterThan(0);
  });
});
