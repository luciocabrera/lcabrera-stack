import { describe, expect, it } from 'vite-plus/test';

import type { FieldNode } from '#ui/components/Form/Form.types';

import { hasScrollOwningChild } from './hasScrollOwningChild.util';

type Values = { readonly city: string; readonly name: string };

const LEAF: FieldNode<Values> = {
  accessor: 'name',
  label: 'Name',
  type: 'text',
};

const TAB: FieldNode<Values> = {
  tabs: [{ fields: [LEAF], label: 'Details' }],
  type: 'tab',
};

describe('hasScrollOwningChild', () => {
  it('delegates when the root is a lone tab node', () => {
    expect(hasScrollOwningChild([TAB])).toBe(true);
  });

  it('does not delegate when the tab node has siblings', () => {
    expect(hasScrollOwningChild([TAB, LEAF])).toBe(false);
  });

  it('does not delegate for a plain field tree', () => {
    expect(hasScrollOwningChild([LEAF])).toBe(false);
  });

  it('does not delegate for an empty tree', () => {
    expect(hasScrollOwningChild([])).toBe(false);
  });
});
