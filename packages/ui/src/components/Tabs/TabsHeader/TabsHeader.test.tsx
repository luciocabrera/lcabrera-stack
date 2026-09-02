// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { TabsHeader } from './TabsHeader.component';

afterEach(() => {
  cleanup();
});

const tabs = [
  { children: <span>Content A</span>, header: 'Tab A', key: 'a' },
  { children: <span>Content B</span>, header: 'Tab B', key: 'b' },
  { children: <span>Content C</span>, header: 'Tab C', key: 'c' },
];

const focusedTab = () => screen.getByRole('tab', { selected: true });

describe('TabsHeader', () => {
  it('renders one tab button per tab', () => {
    render(
      <TabsHeader
        activeTab='a'
        isBusy={false}
        onSelectTab={vi.fn()}
        tabs={tabs}
      />,
    );
    expect(screen.getByRole('tab', { name: 'Tab A' })).not.toBeNull();
    expect(screen.getByRole('tab', { name: 'Tab B' })).not.toBeNull();
    expect(screen.getByRole('tab', { name: 'Tab C' })).not.toBeNull();
  });

  it('marks the active tab as selected with roving tabindex', () => {
    render(
      <TabsHeader
        activeTab='b'
        isBusy={false}
        onSelectTab={vi.fn()}
        tabs={tabs}
      />,
    );
    const tabB = screen.getByRole('tab', { name: 'Tab B' });
    const tabA = screen.getByRole('tab', { name: 'Tab A' });
    expect(tabB.getAttribute('aria-selected')).toBe('true');
    expect(tabB.getAttribute('tabIndex')).toBe('0');
    expect(tabA.getAttribute('aria-selected')).toBe('false');
    expect(tabA.getAttribute('tabIndex')).toBe('-1');
  });

  it('wires each tab button to its panel via ARIA attributes', () => {
    render(
      <TabsHeader
        activeTab='a'
        isBusy={false}
        onSelectTab={vi.fn()}
        tabs={tabs}
      />,
    );
    const tabA = screen.getByRole('tab', { name: 'Tab A' });
    expect(tabA.getAttribute('id')).toBe('tab-a');
    expect(tabA.getAttribute('aria-controls')).toBe('tabpanel-a');
  });

  it('calls onSelectTab with the clicked tab key', () => {
    const onSelectTab = vi.fn();
    render(
      <TabsHeader
        activeTab='a'
        isBusy={false}
        onSelectTab={onSelectTab}
        tabs={tabs}
      />,
    );
    fireEvent.click(screen.getByRole('tab', { name: 'Tab B' }));
    expect(onSelectTab).toHaveBeenCalledWith('b');
  });

  it('selects and focuses the next tab on ArrowRight', () => {
    const onSelectTab = vi.fn();
    render(
      <TabsHeader
        activeTab='a'
        isBusy={false}
        onSelectTab={onSelectTab}
        tabs={tabs}
      />,
    );
    fireEvent.keyDown(focusedTab(), { key: 'ArrowRight' });
    expect(onSelectTab).toHaveBeenCalledWith('b');
    expect(document.activeElement).toBe(
      screen.getByRole('tab', { name: 'Tab B' }),
    );
  });

  it.each([
    { activeTab: 'b', expected: 'a', name: 'the previous tab' },
    { activeTab: 'a', expected: 'c', name: 'the last tab, wrapping' },
  ])('ArrowLeft from $activeTab selects $name', ({ activeTab, expected }) => {
    const onSelectTab = vi.fn();
    render(
      <TabsHeader
        activeTab={activeTab}
        isBusy={false}
        onSelectTab={onSelectTab}
        tabs={tabs}
      />,
    );

    fireEvent.keyDown(focusedTab(), { key: 'ArrowLeft' });

    expect(onSelectTab).toHaveBeenCalledWith(expected);
  });

  it('selects the first tab on Home and the last on End', () => {
    const onSelectTab = vi.fn();
    render(
      <TabsHeader
        activeTab='b'
        isBusy={false}
        onSelectTab={onSelectTab}
        tabs={tabs}
      />,
    );
    fireEvent.keyDown(focusedTab(), { key: 'Home' });
    expect(onSelectTab).toHaveBeenCalledWith('a');
    fireEvent.keyDown(focusedTab(), { key: 'End' });
    expect(onSelectTab).toHaveBeenCalledWith('c');
  });

  it('ignores keys that are not part of tab navigation', () => {
    const onSelectTab = vi.fn();
    render(
      <TabsHeader
        activeTab='a'
        isBusy={false}
        onSelectTab={onSelectTab}
        tabs={tabs}
      />,
    );
    fireEvent.keyDown(focusedTab(), { key: 'Enter' });
    expect(onSelectTab).not.toHaveBeenCalled();
  });

  it('disables all tab buttons when busy', () => {
    render(
      <TabsHeader activeTab='a' isBusy onSelectTab={vi.fn()} tabs={tabs} />,
    );
    const tabButtons = screen.getAllByRole('tab');
    expect(tabButtons).toHaveLength(3);
    for (const tabButton of tabButtons) {
      expect((tabButton as HTMLButtonElement).disabled).toBe(true);
    }
  });

  it('ignores keyboard navigation when busy', () => {
    const onSelectTab = vi.fn();
    render(
      <TabsHeader activeTab='a' isBusy onSelectTab={onSelectTab} tabs={tabs} />,
    );
    fireEvent.keyDown(focusedTab(), { key: 'ArrowRight' });
    expect(onSelectTab).not.toHaveBeenCalled();
  });

  it('falls back to the first tab as navigation origin when activeTab is unknown', () => {
    const onSelectTab = vi.fn();
    render(
      <TabsHeader
        activeTab='missing-tab'
        isBusy={false}
        onSelectTab={onSelectTab}
        tabs={tabs}
      />,
    );
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Tab A' }), {
      key: 'ArrowRight',
    });
    expect(onSelectTab).toHaveBeenCalledWith('b');
  });
});

type StubViewportArgs = {
  readonly clientWidth: number;
  readonly scrollLeft?: number;
  readonly scrollWidth: number;
  readonly tabLeft?: number;
};

const VIEWPORT_LEFT = 640;

const stubViewport = ({
  clientWidth,
  scrollLeft = 0,
  scrollWidth,
  tabLeft = VIEWPORT_LEFT,
}: StubViewportArgs) => {
  const position = { current: scrollLeft };

  vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(
    clientWidth,
  );
  vi.spyOn(Element.prototype, 'scrollWidth', 'get').mockReturnValue(
    scrollWidth,
  );
  vi.spyOn(Element.prototype, 'scrollLeft', 'get').mockImplementation(
    () => position.current,
  );
  vi.spyOn(Element.prototype, 'scrollLeft', 'set').mockImplementation(
    (next: number) => {
      position.current = next;
    },
  );
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
    function boundingBox(this: Element) {
      const isTab = this.getAttribute('role') === 'tab';
      const left = isTab ? tabLeft : VIEWPORT_LEFT;

      return {
        left,
        right: isTab ? left : VIEWPORT_LEFT + clientWidth,
      } as DOMRect;
    },
  );

  return position;
};

const renderHeader = async () => {
  render(
    <TabsHeader
      activeTab='a'
      isBusy={false}
      onSelectTab={vi.fn()}
      tabs={tabs}
    />,
  );

  await act(async () => {});
};

describe('TabsHeader when the tabs do not fit', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('offers no scroll affordance while every tab fits', async () => {
    stubViewport({ clientWidth: 400, scrollWidth: 400 });
    await renderHeader();

    expect(screen.queryByTestId('tabs-scroll-start')).toBeNull();
    expect(screen.queryByTestId('tabs-scroll-end')).toBeNull();
  });

  it('offers only the forward affordance at the start of the strip', async () => {
    stubViewport({ clientWidth: 200, scrollWidth: 600 });
    await renderHeader();

    expect(screen.queryByTestId('tabs-scroll-start')).toBeNull();
    expect(screen.getByTestId('tabs-scroll-end')).not.toBeNull();
  });

  it('offers only the backward affordance at the end of the strip', async () => {
    stubViewport({ clientWidth: 200, scrollLeft: 400, scrollWidth: 600 });
    await renderHeader();

    expect(screen.getByTestId('tabs-scroll-start')).not.toBeNull();
    expect(screen.queryByTestId('tabs-scroll-end')).toBeNull();
  });

  it('offers both once the strip is scrolled part way', async () => {
    stubViewport({ clientWidth: 200, scrollLeft: 100, scrollWidth: 600 });
    await renderHeader();

    expect(screen.getByTestId('tabs-scroll-start')).not.toBeNull();
    expect(screen.getByTestId('tabs-scroll-end')).not.toBeNull();
  });

  it('brings the active tab back into view on mount', async () => {
    const position = stubViewport({
      clientWidth: 200,
      scrollLeft: 300,
      scrollWidth: 600,
      tabLeft: VIEWPORT_LEFT - 300,
    });

    await renderHeader();

    expect(position.current).toBe(0);
  });

  it('moves the strip by most of a viewport in the direction clicked', async () => {
    const position = stubViewport({
      clientWidth: 200,
      scrollLeft: 100,
      scrollWidth: 600,
    });

    await renderHeader();

    fireEvent.click(screen.getByTestId('tabs-scroll-end'));
    expect(position.current).toBe(260);

    fireEvent.click(screen.getByTestId('tabs-scroll-start'));
    expect(position.current).toBe(100);
  });
});
