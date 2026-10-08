import type { z } from 'zod';

import { stringShape } from './stringShape.util.ts';

type FreeStringPathsArgs = {
  readonly path?: string;
  readonly schema: z.core.$ZodType;
};

const CLOSED_TYPES = new Set([
  'bigint',
  'boolean',
  'date',
  'enum',
  'int',
  'literal',
  'nan',
  'null',
  'number',
]);

export const freeStringPaths = ({
  path = '',
  schema,
}: FreeStringPathsArgs): readonly string[] => {
  const def = (schema as z.core.$ZodTypes)._zod.def;

  if (CLOSED_TYPES.has(def.type)) {
    return [];
  }

  const child = (key: string) => (path ? `${path}.${key}` : key);

  switch (def.type) {
    case 'array': {
      const elementPath = `${path}[]`;
      const elements = freeStringPaths({
        path: elementPath,
        schema: def.element,
      });

      return elements.includes(elementPath)
        ? [path, ...elements.filter((entry) => entry !== elementPath)]
        : elements;
    }
    case 'nullable':
    case 'optional':
    case 'readonly': {
      return freeStringPaths({ path, schema: def.innerType });
    }
    case 'object': {
      return Object.entries(def.shape).flatMap(([key, field]) =>
        freeStringPaths({ path: child(key), schema: field }),
      );
    }
    case 'record': {
      const keys = freeStringPaths({ path: `${path}{}`, schema: def.keyType });

      if (keys.length > 0) {
        throw new Error(`the keys of ${path} can hold free text`);
      }

      return freeStringPaths({ path: child('*'), schema: def.valueType });
    }
    case 'string': {
      return stringShape(schema as z.core.$ZodString).kind === 'free'
        ? [path]
        : [];
    }
    case 'union': {
      return [
        ...new Set(
          def.options.flatMap((option) =>
            freeStringPaths({ path, schema: option }),
          ),
        ),
      ];
    }
    default: {
      throw new Error(
        `cannot tell whether ${path || 'the root'} (${def.type}) holds free text`,
      );
    }
  }
};
