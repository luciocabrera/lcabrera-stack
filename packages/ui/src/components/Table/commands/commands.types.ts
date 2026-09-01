import type { ComponentType } from 'react';

import type { IconProps } from '#ui/components/Icons';

export type CommandDescriptor = {
  readonly icon: ComponentType<IconProps>;
  readonly id: CommandId;
  readonly label: string;
};

export type CommandId = string & { readonly __brand: 'CommandId' };
