// @vitest-environment jsdom

import * as stylex from '@stylexjs/stylex';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import type { FieldNode } from '#ui/components/Form/Form.types';

import { FormProvider } from '#ui/components/Form/contexts';

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

    expect(
      findByStyle({ container, style: styles.stack }).length,
    ).toBeGreaterThan(1);

    expect(findByStyle({ container, style: styles.scroll })).toHaveLength(1);
  });

  it('yields the scroll boundary to a lone tab node', () => {
    const { container } = renderList(TABBED_FIELDS);

    expect(findByStyle({ container, style: styles.scroll })).toHaveLength(0);

    expect(findByStyle({ container, style: styles.region })).toHaveLength(1);
  });
});
