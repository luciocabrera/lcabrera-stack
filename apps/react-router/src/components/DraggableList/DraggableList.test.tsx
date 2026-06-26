// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { DraggableItem } from './DraggableList.types';

import { DraggableList } from './DraggableList.component';

afterEach(cleanup);

const items: readonly DraggableItem[] = [
  { content: <span>Item A</span>, id: 'a' },
  { content: <span>Item B</span>, id: 'b' },
  { content: <span>Item C</span>, id: 'c' },
];

describe('DraggableList', () => {
  it('renders all items', () => {
    render(<DraggableList items={items} />);

    expect(screen.getByText('Item A')).not.toBeNull();
    expect(screen.getByText('Item B')).not.toBeNull();
    expect(screen.getByText('Item C')).not.toBeNull();
  });

  it('renders a drag handle for each draggable item', () => {
    render(<DraggableList items={items} />);

    expect(screen.getAllByLabelText('Drag handle')).toHaveLength(3);
  });

  it('omits drag handle for non-draggable items', () => {
    const mixedItems: readonly DraggableItem[] = [
      { content: <span>Draggable</span>, id: 'drag' },
      { content: <span>Static</span>, id: 'static', isDraggable: false },
    ];

    render(<DraggableList items={mixedItems} />);

    expect(screen.getAllByLabelText('Drag handle')).toHaveLength(1);
  });

  it('sets draggable attribute to true on enabled items', () => {
    render(<DraggableList items={items} />);

    const listItems = screen.getAllByRole('listitem');

    for (const item of listItems) {
      expect(item.getAttribute('draggable')).toBe('true');
    }
  });

  it('sets draggable attribute to false when isBusy is true', () => {
    render(<DraggableList isBusy items={items} />);

    const listItems = screen.getAllByRole('listitem');

    for (const item of listItems) {
      expect(item.getAttribute('draggable')).toBe('false');
    }
  });

  it('sets draggable attribute to false for non-draggable items', () => {
    const mixedItems: readonly DraggableItem[] = [
      { content: <span>Draggable</span>, id: 'drag' },
      { content: <span>Static</span>, id: 'static', isDraggable: false },
    ];

    render(<DraggableList items={mixedItems} />);

    const listItems = screen.getAllByRole('listitem');

    expect(listItems[0]?.getAttribute('draggable')).toBe('true');
    expect(listItems[1]?.getAttribute('draggable')).toBe('false');
  });

  it('renders busy overlay for each item when isBusy is true', () => {
    const { container } = render(<DraggableList isBusy items={items} />);

    // Each <li> gets an overlay div when busy
    const listItems = container.querySelectorAll('li');

    for (const li of listItems) {
      expect(li.firstChild).not.toBeNull();
    }
  });

  it('calls onOrderChange with reordered items after a drag sequence', () => {
    const onOrderChange = vi.fn();

    render(<DraggableList items={items} onOrderChange={onOrderChange} />);

    const listItems = screen.getAllByRole('listitem');
    const firstItem = listItems[0];
    const thirdItem = listItems[2];

    if (!firstItem || !thirdItem) throw new Error('Expected 3 list items');

    fireEvent.dragStart(firstItem);
    fireEvent.dragEnter(thirdItem);
    fireEvent.dragEnd(firstItem);

    expect(onOrderChange).toHaveBeenCalledOnce();

    const reordered = onOrderChange.mock.calls[0]?.[0] as DraggableItem[];

    expect(reordered.map((i) => i.id)).toEqual(['b', 'c', 'a']);
  });

  it('does not call onOrderChange when dragging an item onto itself', () => {
    const onOrderChange = vi.fn();

    render(<DraggableList items={items} onOrderChange={onOrderChange} />);

    const [firstItem] = screen.getAllByRole('listitem');

    if (!firstItem) throw new Error('Expected list item');

    fireEvent.dragStart(firstItem);
    fireEvent.dragEnter(firstItem);
    fireEvent.dragEnd(firstItem);

    expect(onOrderChange).not.toHaveBeenCalled();
  });

  it('does not call onOrderChange when no drag is initiated', () => {
    const onOrderChange = vi.fn();

    render(<DraggableList items={items} onOrderChange={onOrderChange} />);

    const [firstItem] = screen.getAllByRole('listitem');

    if (!firstItem) throw new Error('Expected list item');

    fireEvent.dragEnd(firstItem);

    expect(onOrderChange).not.toHaveBeenCalled();
  });

  it('syncs to new items when the items prop changes', () => {
    const { rerender } = render(<DraggableList items={items} />);

    const updatedItems: readonly DraggableItem[] = [
      { content: <span>Item X</span>, id: 'x' },
      { content: <span>Item Y</span>, id: 'y' },
    ];

    rerender(<DraggableList items={updatedItems} />);

    expect(screen.getByText('Item X')).not.toBeNull();
    expect(screen.getByText('Item Y')).not.toBeNull();
    expect(screen.queryByText('Item A')).toBeNull();
  });
});
