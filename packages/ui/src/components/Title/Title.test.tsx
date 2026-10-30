// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { expectServerMarkupMatchesClient } from '#ui/utils/tests/expectServerMarkupMatchesClient.util';
import { hasStylexStyle } from '#ui/utils/tests/hasStylexStyle.util';

import type { TitleLevel } from './Title.types';

import { Title } from './Title.component';
import { styles } from './Title.stylex';

afterEach(cleanup);

const LEVELS: readonly TitleLevel[] = [1, 2, 3];

describe('Title', () => {
  it('renders nothing when title, icon, and actions are all missing', () => {
    const { container } = render(<Title />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the toolbar look on an h2 by default, as before', () => {
    render(<Title data-testid='title'>Section</Title>);

    const heading = screen.getByRole('heading', { level: 2, name: 'Section' });
    const root = screen.getByTestId('title');

    expect(heading.tagName).toBe('H2');
    expect(hasStylexStyle({ element: heading, style: styles.title })).toBe(
      true,
    );
    expect(hasStylexStyle({ element: root, style: styles.container })).toBe(
      true,
    );
    expect(hasStylexStyle({ element: root, style: styles.toolbar })).toBe(true);
  });

  it('renders the icon and actions slots without a heading', () => {
    render(
      <Title
        actions={<button type='button'>Close</button>}
        icon={<svg aria-label='Section icon' role='img' />}
      />,
    );

    const icon = screen.getByRole('img', { name: 'Section icon' });
    const action = screen.getByRole('button', { name: 'Close' });

    expect(icon.parentElement).not.toBeNull();
    expect(
      hasStylexStyle({
        element: icon.parentElement as Element,
        style: styles.icon,
      }),
    ).toBe(true);
    expect(
      hasStylexStyle({
        element: action.parentElement as Element,
        style: styles.actions,
      }),
    ).toBe(true);
    expect(screen.queryByRole('heading')).toBeNull();
  });

  it.each(LEVELS)('renders an h%i for level %i', (level) => {
    render(<Title level={level}>Levelled</Title>);

    expect(
      screen.getByRole('heading', { level, name: 'Levelled' }).tagName,
    ).toBe(`H${level}`);
  });

  it('keeps the toolbar heading styles at every level', () => {
    render(<Title level={1}>Toolbar</Title>);

    const heading = screen.getByRole('heading', { level: 1 });

    expect(hasStylexStyle({ element: heading, style: styles.title })).toBe(
      true,
    );
    expect(
      hasStylexStyle({ element: heading, style: styles.plainLevel[1] }),
    ).toBe(false);
  });

  it('renders a plain h1 with no gradient and no toolbar padding', () => {
    render(
      <Title data-testid='title' level={1} variant='plain'>
        Page
      </Title>,
    );

    const heading = screen.getByRole('heading', { level: 1, name: 'Page' });
    const root = screen.getByTestId('title');

    expect(hasStylexStyle({ element: heading, style: styles.title })).toBe(
      false,
    );
    expect(hasStylexStyle({ element: heading, style: styles.plainTitle })).toBe(
      true,
    );
    expect(hasStylexStyle({ element: root, style: styles.toolbar })).toBe(
      false,
    );
    expect(hasStylexStyle({ element: root, style: styles.container })).toBe(
      true,
    );
  });

  it.each(LEVELS)('sizes a plain heading from level %i', (level) => {
    render(
      <Title level={level} variant='plain'>
        Plain
      </Title>,
    );

    const heading = screen.getByRole('heading', { level });

    expect(
      hasStylexStyle({ element: heading, style: styles.plainLevel[level] }),
    ).toBe(true);
    expect(
      LEVELS.filter((other) => other !== level).some((other) =>
        hasStylexStyle({ element: heading, style: styles.plainLevel[other] }),
      ),
    ).toBe(false);
  });

  it('passes div props through to the container', () => {
    render(
      <Title aria-label='Region heading' data-testid='title' id='page-title'>
        Passed
      </Title>,
    );

    const root = screen.getByTestId('title');

    expect(root.id).toBe('page-title');
    expect(root.getAttribute('aria-label')).toBe('Region heading');
  });

  it('applies a customStylex override to the container', () => {
    render(
      <Title customStylex={styles.actions} data-testid='title'>
        Custom
      </Title>,
    );

    expect(
      hasStylexStyle({
        element: screen.getByTestId('title'),
        style: styles.actions,
      }),
    ).toBe(true);
  });

  it.each([
    { level: 2, variant: 'toolbar' },
    { level: 1, variant: 'plain' },
    { level: 3, variant: 'plain' },
  ] as const)(
    'renders the same markup on the server as on the client ($variant, level $level)',
    ({ level, variant }) => {
      expectServerMarkupMatchesClient(
        <Title
          actions={<button type='button'>Act</button>}
          icon={<span>Icon</span>}
          level={level}
          variant={variant}
        >
          Server
        </Title>,
      );
    },
  );
});
