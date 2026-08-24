import type { FormSubmission } from '#ui/components/Form/Form.types';

import { useMetaStore } from '#ui/components/Form/contexts/FormContext/useMetaStore.hook';

export const useGetFormSubmission = () =>
  useMetaStore<FormSubmission>((state) => state.submission);
