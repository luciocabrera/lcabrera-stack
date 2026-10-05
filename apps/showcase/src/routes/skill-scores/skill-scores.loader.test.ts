import type { LoaderFunctionArgs } from 'react-router';

import { describe, expect, it } from 'vite-plus/test';

import { loader } from './skill-scores.loader';

const invokeLoader = async (search = '') =>
  loader({
    request: new Request(`http://localhost/skill-scores${search}`),
  } as LoaderFunctionArgs);

describe('skill-scores loader', () => {
  it('returns a columnsState with no function anywhere in it', async () => {
    const { columnsState } = await invokeLoader();

    expect(() => structuredClone(columnsState)).not.toThrow();
  });

  it('sends a call of every built-in kind', async () => {
    const { columnsState } = await invokeLoader();
    const kinds = new Set(
      columnsState.columns.map((column) => column.cell?.kind),
    );

    expect(kinds).toEqual(new Set(['badge', 'delta', 'text']));
  });

  it('sends the tone its calls name that no built-in defines', async () => {
    const { columnsState } = await invokeLoader();
    const toneNames = JSON.stringify(
      columnsState.columns.map((column) => column.cell?.params),
    );

    expect(toneNames).toContain('"caution"');
    expect(Object.keys(columnsState.cellPalette ?? {})).toEqual(['caution']);
  });

  it('returns the rows sorted the way the URL asks', async () => {
    const { dataPromise } = await invokeLoader(
      `?sorting=${encodeURIComponent(JSON.stringify({ overall: 'desc' }))}`,
    );
    const { data } = await dataPromise;

    expect(data[0]?.skill).toBe('epic');
  });
});
