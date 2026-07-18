import type { IconProps } from '@repo/ui/components/Icons';
import type { ComponentType } from 'react';

/**
 * Presentation-neutral identity for a capability command: what it is, not how a
 * surface renders it or when it runs. Per ADR-011 the handler stays in the
 * existing action hooks and enablement/active-state is a per-context selector
 * hook — neither belongs on the descriptor. `label` is a plain string because
 * no i18n exists in the repo; `icon` is the component, which a surface projects
 * into an element at its own size.
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
