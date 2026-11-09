// @vitest-environment jsdom

import type { UIMatch } from 'react-router';

import { cleanup, render, renderHook, screen } from '@testing-library/react';
import { createRoutesStub, Outlet } from 'react-router';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import type { BreadcrumbHandle, BreadcrumbItem } from '../Breadcrumbs.types';

import { useRouteBreadcrumbs } from './useRouteBreadcrumbs.hook';

afterEach(cleanup);

type ProjectData = {
  readonly name: string;
};

const TrailProbe = () => (
  <output>{JSON.stringify(useRouteBreadcrumbs())}</output>
);

const rootHandle: BreadcrumbHandle = {
  breadcrumb: () => ({ label: 'Home', to: '/' }),
};

const nullPrototypeHandle: BreadcrumbHandle = Object.assign(
  Object.create(null) as BreadcrumbHandle,
  { breadcrumb: () => ({ label: 'Archive' }) },
);

const projectHandle: BreadcrumbHandle<ProjectData> = {
  breadcrumb: (match: UIMatch<ProjectData>) => ({
    label: match.loaderData?.name ?? 'Project',
    to: match.pathname,
  }),
};

const trailHandle: BreadcrumbHandle = {
  breadcrumb: () => [
    { label: 'Reports', to: '/reports' },
    { label: 'Quarterly' },
  ],
};

const renderTrail = async (path: string) => {
  const Stub = createRoutesStub([
    {
      children: [
        {
          children: [
            {
              children: [
                {
                  Component: TrailProbe,
                  handle: {
                    breadcrumb: () => ({ label: 'Settings' }),
                  } satisfies BreadcrumbHandle,
                  path: 'settings',
                },
                { Component: TrailProbe, path: 'raw' },
                {
                  Component: TrailProbe,
                  handle: nullPrototypeHandle,
                  path: 'archive',
                },
                {
                  Component: TrailProbe,
                  handle: { breadcrumb: 'Not a function' },
                  path: 'malformed',
                },
                {
                  Component: TrailProbe,
                  handle: Reflect.getPrototypeOf(Object.prototype),
                  path: 'null-handle',
                },
              ],
              Component: Outlet,
              handle: projectHandle,
              loader: ({ params }) => ({ name: `Project ${params.projectId}` }),
              path: ':projectId',
            },
          ],
          Component: Outlet,
          handle: { title: 'Projects' },
          path: 'projects',
        },
        {
          Component: TrailProbe,
          handle: trailHandle,
          path: 'reports/quarterly',
        },
        {
          Component: TrailProbe,
          handle: { breadcrumb: () => [] } satisfies BreadcrumbHandle,
          path: 'unlisted',
        },
      ],
      Component: Outlet,
      handle: rootHandle,
      path: '/',
    },
  ]);

  render(<Stub initialEntries={[path]} />);

  const output = await screen.findByRole('status');
  const parsed: unknown = JSON.parse(output.textContent ?? '[]');

  return parsed;
};

describe('useRouteBreadcrumbs', () => {
  it('collects a breadcrumb from every matched route that declares one, outermost first', async () => {
    const expected: readonly BreadcrumbItem[] = [
      { label: 'Home', to: '/' },
      { label: 'Project 42', to: '/projects/42' },
      { label: 'Settings' },
    ];

    expect(await renderTrail('/projects/42/settings')).toEqual(expected);
  });

  it('spreads a trail a flat route returns, in order, after the outer routes', async () => {
    const expected: readonly BreadcrumbItem[] = [
      { label: 'Home', to: '/' },
      { label: 'Reports', to: '/reports' },
      { label: 'Quarterly' },
    ];

    expect(await renderTrail('/reports/quarterly')).toEqual(expected);
  });

  it('adds nothing for a route whose trail is empty', async () => {
    const expected: readonly BreadcrumbItem[] = [{ label: 'Home', to: '/' }];

    expect(await renderTrail('/unlisted')).toEqual(expected);
  });

  it('skips a matched route with no handle and a handle without a breadcrumb', async () => {
    const expected: readonly BreadcrumbItem[] = [
      { label: 'Home', to: '/' },
      { label: 'Project 7', to: '/projects/7' },
    ];

    expect(await renderTrail('/projects/7/raw')).toEqual(expected);
  });

  it('skips a handle whose breadcrumb is not a function', async () => {
    const expected: readonly BreadcrumbItem[] = [
      { label: 'Home', to: '/' },
      { label: 'Project 9', to: '/projects/9' },
    ];

    expect(await renderTrail('/projects/9/malformed')).toEqual(expected);
  });

  it('reads a handle created without a prototype', async () => {
    const expected: readonly BreadcrumbItem[] = [
      { label: 'Home', to: '/' },
      { label: 'Project 5', to: '/projects/5' },
      { label: 'Archive' },
    ];

    expect(Object.getPrototypeOf(nullPrototypeHandle)).toBeNull();
    expect(await renderTrail('/projects/5/archive')).toEqual(expected);
  });

  it('skips a null handle', async () => {
    const expected: readonly BreadcrumbItem[] = [
      { label: 'Home', to: '/' },
      { label: 'Project 3', to: '/projects/3' },
    ];

    expect(Reflect.getPrototypeOf(Object.prototype)).toBeNull();
    expect(await renderTrail('/projects/3/null-handle')).toEqual(expected);
  });

  it('returns no items when no matched route declares a breadcrumb', async () => {
    const Stub = createRoutesStub([
      { Component: TrailProbe, handle: undefined, path: '/' },
    ]);

    render(<Stub />);

    const output = await screen.findByRole('status');

    expect(output.textContent).toBe('[]');
  });

  it('throws outside a data router', () => {
    expect(() => renderHook(() => useRouteBreadcrumbs())).toThrow(
      /data router/,
    );
  });
});
