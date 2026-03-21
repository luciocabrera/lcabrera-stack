// @vitest-environment jsdom

import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SpacerCell } from './SpacerCell.component';

describe('SpacerCell', () => {
  it('renders a th element when isHeader is true', () => {
    const { container } = render(
      <table>
        <thead>
          <tr>
            <SpacerCell isHeader />
          </tr>
        </thead>
      </table>,
    );

    const cell = container.querySelector('th');
    expect(cell).not.toBeNull();
    expect(cell?.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders a td element when isHeader is false (default)', () => {
    const { container } = render(
      <table>
        <tbody>
          <tr>
            <SpacerCell />
          </tr>
        </tbody>
      </table>,
    );

    const cell = container.querySelector('td');
    expect(cell).not.toBeNull();
    expect(cell?.getAttribute('aria-hidden')).toBe('true');
  });
});
