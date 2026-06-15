import type { DataKey } from '@/components/Table/Table.types';

export type GeneralSectionProps<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly isBussy?: boolean;
};

export type WidthPreset = 'default' | 'max' | 'min' | undefined;
