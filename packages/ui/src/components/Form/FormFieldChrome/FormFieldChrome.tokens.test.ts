import { describeStyleTextContrasts } from '#ui/utils/tests/describeStyleTextContrasts.util';
import { PAGE_BACKGROUNDS } from '#ui/utils/tests/tests.constants';

import { styles } from './FormFieldChrome.stylex';

await describeStyleTextContrasts({
  backgrounds: PAGE_BACKGROUNDS,
  path: 'components/Form/FormFieldChrome/FormFieldChrome.stylex.ts',
  sources: import.meta.glob<string>('./FormFieldChrome.stylex.ts', {
    eager: true,
    import: 'default',
    query: '?raw',
  }),
  styles: { error: styles.error, required: styles.required },
  title: 'the FormFieldChrome error text',
});
