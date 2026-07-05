import type { ComponentPropsWithRef, RefObject } from 'react';

import type { TableEmptyStateConfig } from '../Table.types';

export type TableBodyProps = ComponentPropsWithRef<'tbody'> & {
  readonly emptyState?: TableEmptyStateConfig;
  readonly tableContainerRef: RefObject<HTMLDivElement | null>;
};
