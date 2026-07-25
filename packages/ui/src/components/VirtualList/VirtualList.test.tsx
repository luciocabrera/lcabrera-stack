// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vite-plus/test';

import type { VirtualListDataState } from './VirtualList.types';

import { VirtualList } from './VirtualList.component';

afterEach(cleanup);

const baseDataState: VirtualListDataState = {
  data: ['Alpha', 'Beta', 'Gamma'],
  hasMore: false,
  isLoading: false,
  isLoadingMore: false,
};

/** Same shape as `baseDataState`, wired for infinite scroll (`onFetchMore`). */
const pagedDataState: VirtualListDataState = {
  ...baseDataState,
  hasMore: true,
};

const observeSpy = vi.fn();

class MockIntersectionObserver {
  observe = observeSpy;

  disconnect() {
    // no-op
  }

  takeRecords(): readonly IntersectionObserverEntry[] {
    return [];
  }

  unobserve() {
    // no-op
  }
}

beforeEach(() => {
  observeSpy.mockClear();
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const getFooterModeButtons = () => {
  const footer = screen.getByText(/Loaded:/).parentElement;
  if (!footer) {
    throw new Error('Expected the footer to be rendered');
  }
  return within(footer).getAllByRole('button');
};

describe('VirtualList', () => {
  it('renders the search input, the options, and the footer count', () => {
    render(<VirtualList dataState={baseDataState} onChange={vi.fn()} />);

    expect(screen.getByPlaceholderText('Search options...')).toBeTruthy();
    expect(screen.getByText('Select All')).toBeTruthy();
    expect(screen.getByText('Alpha')).toBeTruthy();
    expect(screen.getByText('Beta')).toBeTruthy();
    expect(screen.getByText('Gamma')).toBeTruthy();
    expect(screen.getByText(/Loaded: 3/)).toBeTruthy();
  });

  it('filters the options by search term and restores them on clear', () => {
    render(<VirtualList dataState={baseDataState} onChange={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('Search options...'), {
      target: { value: 'Alp' },
    });

    expect(screen.getByText('Alpha')).toBeTruthy();
    expect(screen.queryByText('Beta')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));

    expect(screen.getByText('Beta')).toBeTruthy();
    expect(
      screen.getByPlaceholderText<HTMLInputElement>('Search options...').value,
    ).toBe('');
  });

  it('shows the empty state when nothing matches the search', () => {
    render(<VirtualList dataState={baseDataState} onChange={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('Search options...'), {
      target: { value: 'zzz' },
    });

    expect(screen.getByText('No options found')).toBeTruthy();
  });

  it('arms the infinite-scroll sentinel while options are rendered', () => {
    render(
      <VirtualList
        dataState={pagedDataState}
        onChange={vi.fn()}
        onFetchMore={vi.fn()}
      />,
    );

    expect(screen.getByTestId('virtual-list-sentinel')).toBeTruthy();
    expect(observeSpy).toHaveBeenCalled();
  });

  it('disarms the infinite-scroll sentinel when the search term matches nothing', () => {
    render(
      <VirtualList
        dataState={pagedDataState}
        onChange={vi.fn()}
        onFetchMore={vi.fn()}
      />,
    );

    observeSpy.mockClear();

    fireEvent.change(screen.getByPlaceholderText('Search options...'), {
      target: { value: 'aaa' },
    });

    expect(screen.getByText('No options found')).toBeTruthy();
    expect(screen.queryByTestId('virtual-list-sentinel')).toBeNull();
    expect(observeSpy).not.toHaveBeenCalled();
  });

  it('disarms the infinite-scroll sentinel when the selected filter mode is empty', () => {
    render(
      <VirtualList
        dataState={pagedDataState}
        onChange={vi.fn()}
        onFetchMore={vi.fn()}
      />,
    );

    observeSpy.mockClear();

    const selectedModeButton = getFooterModeButtons()[1];
    if (!selectedModeButton) {
      throw new Error('Expected the selected-mode button');
    }
    fireEvent.click(selectedModeButton);

    expect(screen.getByText('No options found')).toBeTruthy();
    expect(screen.queryByTestId('virtual-list-sentinel')).toBeNull();
    expect(observeSpy).not.toHaveBeenCalled();
  });

  it('re-arms the infinite-scroll sentinel once the search is cleared', () => {
    render(
      <VirtualList
        dataState={pagedDataState}
        onChange={vi.fn()}
        onFetchMore={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText('Search options...'), {
      target: { value: 'aaa' },
    });
    observeSpy.mockClear();
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));

    expect(screen.getByTestId('virtual-list-sentinel')).toBeTruthy();
    expect(observeSpy).toHaveBeenCalled();
  });

  it('emits onChange with the toggled option', () => {
    const onChange = vi.fn();

    render(
      <VirtualList
        dataState={baseDataState}
        hasSelectAll={false}
        onChange={onChange}
      />,
    );

    const firstCheckbox = screen.getAllByRole('checkbox')[0];
    if (!firstCheckbox) {
      throw new Error('Expected at least one checkbox');
    }
    fireEvent.click(firstCheckbox);

    expect(onChange).toHaveBeenCalledWith({
      type: 'select',
      values: ['Alpha'],
    });
  });

  it('emits onChange with every visible option on Select All', () => {
    const onChange = vi.fn();

    render(<VirtualList dataState={baseDataState} onChange={onChange} />);

    fireEvent.click(screen.getByText('Select All'));

    expect(onChange).toHaveBeenCalledWith({
      type: 'select',
      values: ['Alpha', 'Beta', 'Gamma'],
    });
  });

  it('shows only the selected options in the selected filter mode', () => {
    render(
      <VirtualList
        dataState={baseDataState}
        filter={{ type: 'select', values: ['Beta'] }}
        onChange={vi.fn()}
      />,
    );

    const selectedModeButton = getFooterModeButtons()[1];
    if (!selectedModeButton) {
      throw new Error('Expected the selected-mode button');
    }
    fireEvent.click(selectedModeButton);

    expect(screen.getByText('Beta')).toBeTruthy();
    expect(screen.queryByText('Alpha')).toBeNull();
    expect(screen.queryByText('Gamma')).toBeNull();
  });

  it('calls onFetchInitial once on mount', () => {
    const onFetchInitial = vi.fn();

    render(
      <VirtualList
        dataState={baseDataState}
        onChange={vi.fn()}
        onFetchInitial={onFetchInitial}
      />,
    );

    expect(onFetchInitial).toHaveBeenCalledTimes(1);
  });

  it('renders the loading skeleton during the initial load', () => {
    render(
      <VirtualList
        dataState={{
          data: [],
          hasMore: false,
          isLoading: true,
          isLoadingMore: false,
        }}
        onChange={vi.fn()}
      />,
    );

    expect(screen.queryByText('No options found')).toBeNull();
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
    expect(screen.queryByText(/Loaded:/)).toBeNull();
  });

  it('hides checkboxes and filter-mode buttons when hasCheckboxes is false', () => {
    render(
      <VirtualList
        dataState={baseDataState}
        hasCheckboxes={false}
        hasSelectAll={false}
        onChange={vi.fn()}
      />,
    );

    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
    expect(
      screen.getByText(/Loaded: 3/).parentElement?.querySelectorAll('button'),
    ).toHaveLength(0);
  });

  it('applies the name to the search input', () => {
    render(
      <VirtualList
        dataState={baseDataState}
        name='country-filter'
        onChange={vi.fn()}
      />,
    );

    expect(
      screen.getByPlaceholderText<HTMLInputElement>('Search options...').name,
    ).toBe('country-filter');
  });
});
