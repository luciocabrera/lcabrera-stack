// @vitest-environment jsdom

import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SpacerRow } from './SpacerRow.component';

describe('SpacerRow', () => {
  it('renders an aria-hidden tr element', () => {
    const { container } = render(
      <table>
        <tbody>
          <SpacerRow height={40} />
        </tbody>
      </table>,
    );

    const row = container.querySelector('tr');
    expect(row).not.toBeNull();
    expect(row?.getAttribute('aria-hidden')).toBe('true');
  });

  it('colSpan is applied to the inner td when provided', () => {
    const { container } = render(
      <table>
        <tbody>
          <SpacerRow height={40} />
        </tbody>
      </table>,
    );

    const cell = container.querySelector('td');
    expect(cell?.getAttribute('colspan')).toBe('5');
  });
});
