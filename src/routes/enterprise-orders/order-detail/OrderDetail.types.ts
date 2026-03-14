import type { EnterpriseOrder } from '@/services';

export type FieldConfig = {
  format?: 'boolean' | 'currency' | 'date';
  key: keyof EnterpriseOrder;
  label: string;
};
