import type { FormSubmission } from '#ui/components/Form/Form.types';

import { useMetaStore } from '#ui/components/Form/contexts/FormContext/useMetaStore.hook';

/** Submission flavour: RR7 navigation `<Form>` vs `fetcher.Form`. */
export const useGetFormSubmission = () =>
  useMetaStore<FormSubmission>((state) => state.submission);
