// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { renderTriggerContent } from './renderTriggerContent.util';

afterEach(cleanup);

describe('renderTriggerContent', () => {
  it('renders the placeholder when there is no selection', () => {
    render(
      renderTriggerContent({
        hasSelection: false,
        mode: 'single',
        onRemoveTag: vi.fn(),
        overflowCount: 0,
        placeholder: 'Pick one',
        selected: [],
        visibleTags: [],
      }),
    );

    expect(screen.getByText('Pick one').textContent).toBe('Pick one');
  });

  it('renders the single selected label', () => {
    render(
      renderTriggerContent({
        hasSelection: true,
        mode: 'single',
        onRemoveTag: vi.fn(),
        overflowCount: 0,
        placeholder: 'Pick one',
        selected: ['Alpha'],
        visibleTags: ['Visible Alpha'],
      }),
    );

    expect(screen.getByText('Visible Alpha').textContent).toBe('Visible Alpha');
  });

  it('renders removable multi tags with overflow text', () => {
    const onRemoveTag = vi.fn();

    render(
      renderTriggerContent({
        hasSelection: true,
        mode: 'multi',
        onRemoveTag,
        overflowCount: 2,
        placeholder: 'Pick one',
        selected: ['Alpha', 'Bravo'],
        visibleTags: ['Alpha'],
      }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Remove Alpha' }));

    expect(onRemoveTag).toHaveBeenCalledWith('Alpha');
    expect(screen.getByText('+2 more').textContent).toBe('+2 more');
  });
});
