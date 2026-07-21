import type { FormMode } from '@lcabrera/ui/components/Form/Form.types';

import { useMetaStore } from '@lcabrera/ui/components/Form/contexts/FormContext/useMetaStore.hook';

export const useGetFormMode = () =>
  useMetaStore<FormMode>((state) => state.mode);
