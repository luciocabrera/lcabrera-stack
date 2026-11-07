// @vitest-environment jsdom

import * as stylex from '@stylexjs/stylex';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { styles as textStyles } from '#ui/components/Text/Text.stylex';
import { expectServerMarkupMatchesClient } from '#ui/utils/tests/expectServerMarkupMatchesClient.util';
import { hasStylexStyle } from '#ui/utils/tests/hasStylexStyle.util';

import { DescriptionList } from './DescriptionList.component';
import { descriptionListStyles } from './DescriptionList.stylex';

const ITEMS = [
  { term: 'Owner', value: 'Platform' },
  { term: 'Runs', value: <strong>42</strong> },
] as const;

const overrideStyles = stylex.create({
  narrow: { columnGap: '2px' },
});

afterEach(cleanup);

const getList = (container: HTMLElement) =>
  container.querySelector('dl') as HTMLDListElement;

describe('DescriptionList', () => {
  it('renders each item as a term and its value, in order', () => {
    const { container } = render(<DescriptionList items={ITEMS} />);

    expect(
      [...getList(container).querySelectorAll('dt, dd')].map((node) => [
        node.tagName,
        node.textContent,
      ]),
    ).toStrictEqual([
      ['DT', 'Owner'],
      ['DD', 'Platform'],
      ['DT', 'Runs'],
      ['DD', '42'],
    ]);
    expect(screen.getByText('42').tagName).toBe('STRONG');
  });

  it('draws a term as small secondary text and a value as small primary text', () => {
    const { container } = render(<DescriptionList items={ITEMS} />);

    const term = container.querySelector('dt') as HTMLElement;
    const value = container.querySelector('dd') as HTMLElement;

    expect(hasStylexStyle({ element: term, style: textStyles.size.sm })).toBe(
      true,
    );
    expect(
      hasStylexStyle({ element: term, style: textStyles.tone.secondary }),
    ).toBe(true);
    expect(hasStylexStyle({ element: value, style: textStyles.size.sm })).toBe(
      true,
    );
    expect(
      hasStylexStyle({ element: value, style: descriptionListStyles.value }),
    ).toBe(true);
  });

  it('pairs each term with its value inside one group', () => {
    const { container } = render(<DescriptionList items={ITEMS} />);

    const groups = [...getList(container).children];

    expect(groups.map((group) => group.tagName)).toStrictEqual(['DIV', 'DIV']);
    expect(
      groups.map((group) => [...group.children].map((child) => child.tagName)),
    ).toStrictEqual([
      ['DT', 'DD'],
      ['DT', 'DD'],
    ]);
  });

  it('lays out as a grid by default', () => {
    const { container } = render(<DescriptionList items={ITEMS} />);

    const list = getList(container);

    expect(
      hasStylexStyle({ element: list, style: descriptionListStyles.list }),
    ).toBe(true);
    expect(
      hasStylexStyle({
        element: list,
        style: descriptionListStyles.layout.grid,
      }),
    ).toBe(true);
    expect(
      hasStylexStyle({
        element: list.firstElementChild as Element,
        style: descriptionListStyles.item.grid,
      }),
    ).toBe(true);
  });

  it('lays out inline when asked', () => {
    const { container } = render(
      <DescriptionList items={ITEMS} layout='inline' />,
    );

    const list = getList(container);

    expect(
      hasStylexStyle({
        element: list,
        style: descriptionListStyles.layout.inline,
      }),
    ).toBe(true);
    expect(
      hasStylexStyle({
        element: list,
        style: descriptionListStyles.layout.grid,
      }),
    ).toBe(false);
    expect(
      hasStylexStyle({
        element: list.firstElementChild as Element,
        style: descriptionListStyles.item.inline,
      }),
    ).toBe(true);
  });

  it('passes native attributes through and applies customStylex last', () => {
    const { container } = render(
      <DescriptionList
        aria-label='Details'
        customStylex={overrideStyles.narrow}
        items={ITEMS}
      />,
    );

    const list = getList(container);

    expect(list.getAttribute('aria-label')).toBe('Details');
    expect(
      hasStylexStyle({ element: list, style: overrideStyles.narrow }),
    ).toBe(true);
    expect(
      hasStylexStyle({
        element: list,
        style: descriptionListStyles.layout.grid,
      }),
    ).toBe(false);
  });

  it('renders the same markup on the server and the client', () => {
    expectServerMarkupMatchesClient(
      <DescriptionList items={ITEMS} layout='inline' />,
    );
  });
});
