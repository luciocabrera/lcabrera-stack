import { Button } from '@repo/ui/components/Button';
import { useFormField } from '@repo/ui/components/Form/fields/useFormField.hook';
import { FormFieldChrome } from '@repo/ui/components/Form/FormFieldChrome/FormFieldChrome.component';
import { FolderIcon } from '@repo/ui/components/Icons';
import { NO_AUTOFILL_INPUT_PROPS } from '@repo/ui/components/Table/filters/filterInput.constants';
import { useClickOutside } from '@repo/ui/hooks';
import * as stylex from '@stylexjs/stylex';
import { useRef, useState } from 'react';

import type { PathFieldProps } from './PathField.types';

import { PathBrowserModal } from './PathBrowserModal';
import { styles } from './PathField.stylex';

export const PathField = <TValues extends Record<string, unknown>>({
  field,
}: PathFieldProps<TValues>) => {
  const { error, fieldId, isDisabled, setValue, value } =
    useFormField<TValues>(field);
  const [isBrowserOpen, setIsBrowserOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const stringValue = (value as string | undefined) ?? '';

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);
  };

  const handleCloseBrowser = () => {
    setIsBrowserOpen(false);
  };

  const handleOpenBrowser = () => {
    setIsBrowserOpen((previousIsBrowserOpen) => !previousIsBrowserOpen);
  };

  useClickOutside({
    onClickOutside: handleCloseBrowser,
    ref: containerRef,
  });

  return (
    <FormFieldChrome
      description={field.description}
      error={error}
      fieldId={fieldId}
      isRequired={field.clientValidation?.required}
      label={field.label}
    >
      <div ref={containerRef} {...stylex.props(styles.fieldContainer)}>
        <div {...stylex.props(styles.container)}>
          <input
            {...NO_AUTOFILL_INPUT_PROPS}
            disabled={isDisabled}
            id={fieldId}
            name={field.accessor}
            onChange={handleChange}
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
            onClick={handleOpenBrowser}
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
          onClose={handleCloseBrowser}
          onSelect={setValue}
        />
      </div>
    </FormFieldChrome>
  );
};
