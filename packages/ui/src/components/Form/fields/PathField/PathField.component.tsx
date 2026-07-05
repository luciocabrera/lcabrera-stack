import * as stylex from '@stylexjs/stylex';
import { useId, useState } from 'react';

import { Button } from '@repo/ui/components/Button';
import { FolderIcon } from '@repo/ui/components/Icons';
import { NO_AUTOFILL_INPUT_PROPS } from '@repo/ui/components/Table/filters/filterInput.constants';
import { useSetFieldValue } from '@repo/ui/components/Form/contexts/FormContext/actions';
import {
  useGetFieldError,
  useGetFieldValue,
  useGetFormMode,
} from '@repo/ui/components/Form/contexts/FormContext/selectors';
import { FormFieldChrome } from '@repo/ui/components/Form/FormFieldChrome/FormFieldChrome.component';

import type { PathFieldProps } from './PathField.types';

import { PathBrowserModal } from './PathBrowserModal';
import { styles } from './PathField.stylex';

export const PathField = <TValues extends Record<string, unknown>>({
  field,
}: PathFieldProps<TValues>) => {
  const fieldId = useId();
  const mode = useGetFormMode();
  const value = useGetFieldValue<TValues>(field.accessor);
  const error = useGetFieldError<TValues>(field.accessor);
  const setFieldValue = useSetFieldValue<TValues>();
  const [isBrowserOpen, setIsBrowserOpen] = useState(false);

  const isDisabled = mode === 'view' || Boolean(field.disabled);
  const stringValue = (value as string | undefined) ?? '';

  return (
    <FormFieldChrome
      description={field.description}
      error={error}
      fieldId={fieldId}
      isRequired={field.clientValidation?.required}
      label={field.label}
    >
      <div {...stylex.props(styles.container)}>
        <input
          {...NO_AUTOFILL_INPUT_PROPS}
          disabled={isDisabled}
          id={fieldId}
          name={field.accessor}
          onChange={(event) =>
            setFieldValue(field.accessor, event.target.value)
          }
          placeholder={field.placeholder}
          required={field.clientValidation?.required}
          type='text'
          value={stringValue}
          {...stylex.props(styles.input)}
        />
        <Button
          color='ghost'
          customStylex={styles.browseButton}
          icon={<FolderIcon size={16} />}
          isDisabled={isDisabled}
          isIconOnly
          onClick={() => setIsBrowserOpen(true)}
          size='mini'
          tooltipContent='Browse…'
          type='button'
        >
          Browse…
        </Button>
      </div>
      <PathBrowserModal
        browseAction={field.browseAction}
        initialPath={stringValue || undefined}
        isOpen={isBrowserOpen}
        onClose={() => setIsBrowserOpen(false)}
        onSelect={(path) => setFieldValue(field.accessor, path)}
      />
    </FormFieldChrome>
  );
};
