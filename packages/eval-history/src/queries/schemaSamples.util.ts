import type { z } from 'zod';

import { stringShape } from './stringShape.util.ts';

type SchemaSamplesArgs = {
  readonly marker: string;
  readonly path?: string;
  readonly schema: z.core.$ZodType;
  readonly seedPaths: readonly string[];
};

const PUBLIC_SAMPLE_TEXT = 'public-sample';

export const schemaSamples = ({
  marker,
  path = '',
  schema,
  seedPaths,
}: SchemaSamplesArgs): readonly unknown[] => {
  const def = (schema as z.core.$ZodTypes)._zod.def;
  const at = (child: Pick<SchemaSamplesArgs, 'path' | 'schema'>) =>
    schemaSamples({ marker, seedPaths, ...child });

  switch (def.type) {
    case 'array': {
      const element = (def.element as z.core.$ZodTypes)._zod.def;

      return [
        at({
          path: element.type === 'string' ? path : `${path}[]`,
          schema: def.element,
        }),
      ];
    }
    case 'boolean': {
      return [true];
    }
    case 'enum': {
      return Object.values(def.entries).slice(0, 1);
    }
    case 'literal': {
      return def.values.slice(0, 1);
    }
    case 'nullable':
    case 'optional':
    case 'readonly': {
      return at({ path, schema: def.innerType });
    }
    case 'number': {
      return [1];
    }
    case 'object': {
      const fields = Object.entries(def.shape).map(
        ([key, field]) =>
          [
            key,
            at({ path: path ? `${path}.${key}` : key, schema: field }),
          ] as const,
      );
      const count = Math.max(1, ...fields.map(([, values]) => values.length));

      return Array.from({ length: count }, (_, index) =>
        Object.fromEntries(
          fields.map(([key, values]) => [key, values[index] ?? values[0]]),
        ),
      );
    }
    case 'record': {
      const [value] = at({
        path: path ? `${path}.*` : '*',
        schema: def.valueType,
      });
      const keyDef = (def.keyType as z.core.$ZodTypes)._zod.def;
      const keys =
        keyDef.type === 'enum'
          ? Object.values(keyDef.entries)
          : at({ path: `${path}{}`, schema: def.keyType });

      return [Object.fromEntries(keys.map((key) => [String(key), value]))];
    }
    case 'string': {
      const shape = stringShape(schema as z.core.$ZodString);

      if (shape.kind === 'closed') {
        return [shape.sample];
      }

      return [seedPaths.includes(path) ? marker : PUBLIC_SAMPLE_TEXT];
    }
    case 'union': {
      return def.options.flatMap((option) => at({ path, schema: option }));
    }
    default: {
      throw new Error(`cannot sample ${path || 'the root'} (${def.type})`);
    }
  }
};
