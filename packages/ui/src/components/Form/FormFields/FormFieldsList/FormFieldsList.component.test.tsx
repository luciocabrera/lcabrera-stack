// @vitest-environment jsdom

import type { FieldNode } from '@lcabrera/ui/components/Form/Form.types';

import { FormProvider } from '@lcabrera/ui/components/Form/contexts';
import * as stylex from '@stylexjs/stylex';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { FormFieldsList } from './FormFieldsList.component';
import { styles } from './FormFieldsList.stylex';

afterEach(() => {
  cleanup();
});

type FindByStyleArgs = {
  readonly container: HTMLElement;
  readonly style: stylex.StyleXStyles;
};

type Values = { readonly city: string; readonly name: string };

const NESTED_FIELDS: readonly FieldNode<Values>[] = [
  { accessor: 'name', label: 'Name', type: 'text' },
  {
    fields: [{ accessor: 'city', label: 'City', type: 'text' }],
    label: 'Address',
    type: 'group',
  },
];

const TABBED_FIELDS: readonly FieldNode<Values>[] = [
  {
    tabs: [
      {
        fields: [{ accessor: 'name', label: 'Name', type: 'text' }],
        label: 'Details',
      },
    ],
    type: 'tab',
  },
];

const findByStyle = ({ container, style }: FindByStyleArgs) => {
  const expected = (stylex.props(style).className ?? '')
    .split(' ')
    .filter(Boolean);

  return [...container.querySelectorAll('div')].filter((element) =>
    expected.every((className) => element.classList.contains(className)),
  );
};

const renderList = (fields: readonly FieldNode<Values>[]) =>
  render(
    <FormProvider<Values> cancelTo='/' fields={fields} mode='create'>
      <FormFieldsList<Values> fields={fields} />
    </FormProvider>,
  );

describe('FormFieldsList', () => {
  it('scrolls at the outermost list and no other', () => {
    const { container } = renderList(NESTED_FIELDS);

    // Without this the scroll assertion below would also pass on a tree that
    // never recursed — the case it is meant to catch.
    expect(
      findByStyle({ container, style: styles.stack }).length,
    ).toBeGreaterThan(1);

    // A nested list inheriting `scroll` would make every group/row/tab its own
    // scroll container, clipping VirtualSelect dropdowns inside them.
    expect(findByStyle({ container, style: styles.scroll })).toHaveLength(1);
  });

  it('yields the scroll boundary to a lone tab node', () => {
    const { container } = renderList(TABBED_FIELDS);

    // The tab panel is the scroll container here. A second one on the root
    // would reserve a scrollbar gutter it can never use, and the insets stack.
    expect(findByStyle({ container, style: styles.scroll })).toHaveLength(0);

    // It still owns the height — the tab panel's `height: 100%` needs it.
    expect(findByStyle({ container, style: styles.region })).toHaveLength(1);
  });
});
