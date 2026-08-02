// @vitest-environment jsdom

import * as stylex from '@stylexjs/stylex';
import { cleanup, render, screen } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vite-plus/test';

const { contentRenderCount, metaState, setMetaState } = vi.hoisted(() => {
  const initialMetaState = {
    customStylex: undefined as stylex.StyleXStyles | undefined,
    isAlwaysOpen: false,
    isListVisible: true,
    listboxId: 'listbox-id',
    shouldFillHeight: false,
  };
  const state = { current: { ...initialMetaState } };

  return {
    contentRenderCount: { current: 0 },
    metaState: state,
    setMetaState: (next: Partial<typeof initialMetaState>) => {
      state.current = { ...initialMetaState, ...next };
    },
  };
});

vi.mock('@lcabrera/ui/components/VirtualList', () => ({
  VirtualListContent: () => {
    contentRenderCount.current += 1;
    return <div data-testid='virtual-list-content'>Virtual list content</div>;
  },
}));

vi.mock('@lcabrera/ui/components/VirtualList/contexts/list/selectors', () => ({
  useGetShouldFillHeight: () => metaState.current.shouldFillHeight,
}));

vi.mock('../contexts/meta/selectors', () => ({
  useGetCustomStylex: () => metaState.current.customStylex,
  useGetIsAlwaysOpen: () => metaState.current.isAlwaysOpen,
  useGetIsListVisible: () => metaState.current.isListVisible,
  useGetListboxId: () => metaState.current.listboxId,
}));

// The dropdown anchors to the shell container; these cases mount it without a
// provider, so stand in a detached element. Built once in the factory, not per
// render, or the position effect's dependency would change every render.
vi.mock('../contexts/useVirtualSelectAnchorRef.hook', () => {
  const anchorRef = { current: document.createElement('div') };

  return { useVirtualSelectAnchorRef: () => anchorRef };
});

vi.mock('../contexts/meta/actions', () => ({
  useCloseDropdown: () => vi.fn(),
}));

import { VirtualSelectDropdown } from './VirtualSelectDropdown.component';

/**
 * A consumer style that contradicts the dropdown's own positioning.
 * `OperatorSelect` used to pass one of these, and because `customStylex` came
 * last in the style chain it won — a popover that is not absolutely positioned
 * still sits in the top layer, so the list rendered against the initial
 * containing block, in the viewport's top-left corner.
 */
const consumerStyles = stylex.create({
  positionReset: { position: 'relative' },
  surfaceTweak: { boxShadow: 'none' },
});

beforeEach(() => {
  setMetaState({});
  contentRenderCount.current = 0;
});

afterEach(() => {
  cleanup();
});

describe('VirtualSelectDropdown', () => {
  it('renders nothing while the list is hidden', () => {
    setMetaState({ isListVisible: false });

    const { container } = render(<VirtualSelectDropdown />);

    expect(container.firstChild).toBeNull();
    expect(contentRenderCount.current).toBe(0);
  });

  it('renders the listbox shell around the provider-less list content', () => {
    render(<VirtualSelectDropdown />);

    const listbox = screen.getByRole('listbox');

    expect(listbox.id).toBe('listbox-id');
    expect(screen.getByTestId('virtual-list-content').textContent).toBe(
      'Virtual list content',
    );
  });

  it('keeps the listbox shell when positioned static and fill-height', () => {
    setMetaState({ isAlwaysOpen: true, shouldFillHeight: true });

    render(<VirtualSelectDropdown />);

    expect(screen.getByRole('listbox')).toBeTruthy();
    expect(contentRenderCount.current).toBe(1);
  });

  it('does not let a consumer style override its own positioning', () => {
    render(<VirtualSelectDropdown />);
    const positionedClassName = screen.getByRole('listbox').className;

    cleanup();
    setMetaState({ customStylex: consumerStyles.positionReset });
    render(<VirtualSelectDropdown />);

    // StyleX resolves a conflicting property by argument order and drops the
    // loser's class, so the floating classes surviving intact is the evidence
    // that `customStylex` is applied ahead of the positioning styles.
    const resetClassName = screen.getByRole('listbox').className;
    const survivors = positionedClassName
      .split(' ')
      .filter((className) => resetClassName.split(' ').includes(className));

    expect(survivors).toEqual(positionedClassName.split(' '));
  });

  it('still lets a consumer style override the floating surface', () => {
    render(<VirtualSelectDropdown />);
    const baseClassName = screen.getByRole('listbox').className;

    cleanup();
    setMetaState({ customStylex: consumerStyles.surfaceTweak });
    render(<VirtualSelectDropdown />);

    // The counterpart of the case above: elevation is surface, not placement,
    // so `dropdownFloatingSurface` sits BEFORE `customStylex` and the consumer
    // wins. Composing the whole floating style after `customStylex` would take
    // this away while looking like it only protected positioning.
    const tweakedClassName = screen.getByRole('listbox').className;

    expect(tweakedClassName).not.toBe(baseClassName);
  });
});
