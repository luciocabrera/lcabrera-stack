import type { FormMode } from '@repo/ui/components/Form/Form.types';

import { useMetaStore } from '@repo/ui/components/Form/contexts/FormContext/useMetaStore.hook';

export const useGetFormMode = () =>
  useMetaStore<FormMode>((state) => state.mode);
