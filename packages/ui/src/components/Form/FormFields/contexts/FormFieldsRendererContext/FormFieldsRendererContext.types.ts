import type { ReactNode } from 'react';

import type { FieldNode } from '#ui/components/Form/Form.types';

export type RenderFieldsFn = (
  fields: readonly FieldNode<Record<string, unknown>>[],
) => ReactNode;
