import type { z } from 'zod';

const CLASS_REPEAT = /\[([\da-fA-F-]+)\]\{(\d+)\}/g;

const CLOSED_FORMAT_SAMPLES: Readonly<Record<string, string>> = {
  date: '2026-01-01',
  datetime: '2026-01-01T00:00:00.000Z',
  guid: '00000000-0000-4000-8000-000000000000',
  uuid: '00000000-0000-4000-8000-000000000000',
};

export const stringShape = (schema: z.core.$ZodString) => {
  const { checks = [], format } = schema._zod.def as z.core.$ZodStringDef & {
    readonly format?: string;
  };
  const formatSample =
    format === undefined ? undefined : CLOSED_FORMAT_SAMPLES[format];

  if (formatSample !== undefined) {
    return { kind: 'closed', sample: formatSample } as const;
  }

  const closedRuns = checks
    .map(({ _zod }) => _zod.def)
    .filter(
      (def): def is z.core.$ZodCheckRegexDef =>
        def.check === 'string_format' && 'pattern' in def,
    )
    .map(({ pattern }) => pattern.source)
    .filter((source) => source.startsWith('^') && source.endsWith('$'))
    .map((source) => {
      const body = source.slice(1, -1);
      const runs = body.matchAll(CLASS_REPEAT).toArray();

      return runs.length > 0 && runs.map(([run]) => run).join('') === body
        ? runs
        : undefined;
    })
    .find((runs) => runs !== undefined);

  if (closedRuns === undefined) {
    return { kind: 'free' } as const;
  }

  const sample = closedRuns
    .map(([, alphabet = '0', count = '0']) =>
      alphabet.charAt(0).repeat(Number(count)),
    )
    .join('');

  return { kind: 'closed', sample } as const;
};
