import type { ComponentType } from 'react';

import type { IconProps } from '#ui/components/Icons';

/**
 * Per ADR-011 the handler stays in the existing action hooks and enablement/active-state
 * is a per-context selector hook — neither belongs on the descriptor.
 */
export type CommandDescriptor = {
  readonly icon: ComponentType<IconProps>;
  readonly id: CommandId;
  readonly label: string;
};

/**
 * Stable identity for a grid command (ADR-011). Branded so a raw string cannot
 * be passed where a command id is expected.
 */
export type CommandId = string & { readonly __brand: 'CommandId' };
