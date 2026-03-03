import type { DataKey } from '@/components/Table/Table.types';

export type GeneralSectionProps<TData> = {
  columnKey: DataKey<TData>;
};

export type WidthPreset = 'default' | 'max' | 'min' | undefined;
