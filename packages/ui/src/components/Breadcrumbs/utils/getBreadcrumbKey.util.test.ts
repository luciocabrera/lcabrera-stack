import { describe, expect, it } from 'vite-plus/test';

import { getBreadcrumbKey } from './getBreadcrumbKey.util';

describe('getBreadcrumbKey', () => {
  it('keys an item without a destination by its label', () => {
    expect(getBreadcrumbKey({ label: 'Projects' })).toBe('Projects');
  });

  it('keys an item by its path and label', () => {
    expect(getBreadcrumbKey({ label: 'Reports', to: '/reports' })).toBe(
      '/reports Reports',
    );
  });

  it('keys an item whose destination is a path object by the path it builds', () => {
    expect(
      getBreadcrumbKey({
        label: 'Reports',
        to: { hash: '#top', pathname: '/reports', search: '?page=2' },
      }),
    ).toBe('/reports?page=2#top Reports');
  });

  it('gives the same label at two destinations two keys', () => {
    expect(getBreadcrumbKey({ label: 'Section', to: '/a' })).not.toBe(
      getBreadcrumbKey({ label: 'Section', to: '/a/b' }),
    );
  });
});
