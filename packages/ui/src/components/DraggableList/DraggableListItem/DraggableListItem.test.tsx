// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { DraggableItem } from '../DraggableList.types';

import { DraggableListItem } from './DraggableListItem.component';

afterEach(cleanup);

const item: DraggableItem = { content: <span>Row</span>, id: 'row-1' };

const renderItem = (
  overrides: Partial<Parameters<typeof DraggableListItem>[0]> = {},
) =>
  render(
    <ul>
      <DraggableListItem
        dragItemId={{ current: undefined }}
        isBusy={false}
        item={item}
        onDragEnd={() => void 0}
        onDragEnter={() => void 0}
        onDragStart={() => void 0}
        {...overrides}
      />
    </ul>,
  );

describe('DraggableListItem', () => {
  it('renders the item content with a drag handle', () => {
    renderItem();

    expect(screen.getByText('Row')).not.toBeNull();
    expect(screen.getByLabelText('Drag handle')).not.toBeNull();
    expect(screen.getByRole('listitem').getAttribute('draggable')).toBe('true');
  });

  it('forwards drag start/enter with the item id', () => {
    const onDragEnter = vi.fn();
    const onDragStart = vi.fn();

    renderItem({ onDragEnter, onDragStart });

    const li = screen.getByRole('listitem');
    fireEvent.dragStart(li);
    fireEvent.dragEnter(li);

    expect(onDragStart).toHaveBeenCalledWith('row-1');
    expect(onDragEnter).toHaveBeenCalledWith('row-1');
  });

  it('disables dragging for non-draggable items', () => {
    const onDragStart = vi.fn();

    renderItem({
      item: { ...item, isDraggable: false },
      onDragStart,
    });

    const li = screen.getByRole('listitem');
    expect(li.getAttribute('draggable')).toBe('false');
    fireEvent.dragStart(li);
    expect(onDragStart).not.toHaveBeenCalled();
    expect(screen.queryByLabelText('Drag handle')).toBeNull();
  });

  it('disables dragging and shows the shimmer overlay when busy', () => {
    renderItem({ isBusy: true });

    expect(screen.getByRole('listitem').getAttribute('draggable')).toBe(
      'false',
    );
  });
});
