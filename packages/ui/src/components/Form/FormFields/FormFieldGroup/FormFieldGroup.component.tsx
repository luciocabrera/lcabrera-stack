import * as stylex from '@stylexjs/stylex';
import { useId, useState } from 'react';

import type { FieldNode } from '#ui/components/Form/Form.types';

import { useFormFieldsRendererContext } from '#ui/components/Form/FormFields/contexts/FormFieldsRendererContext/useFormFieldsRendererContext.hook';

import type { FormFieldGroupProps } from './FormFieldGroup.types';

import { styles } from './FormFieldGroup.stylex';

/**
 * When `collapsible`, the header becomes a button that expands/collapses the body;
 * collapsed fields are hidden with `display:none` (not unmounted), so their values still
 * submit.
 */
export const FormFieldGroup = <TValues extends Record<string, unknown>>({
  field,
}: FormFieldGroupProps<TValues>) => {
  const renderFields = useFormFieldsRendererContext();
  const bodyId = useId();
  const [isCollapsed, setIsCollapsed] = useState(
    Boolean(field.defaultCollapsed),
  );

  const isOpen = !field.collapsible || !isCollapsed;

  const handleToggle = () => {
    setIsCollapsed((previous) => !previous);
  };

  return (
    <div {...stylex.props(styles.card)}>
      {Boolean(field.collapsible) && (
        <button
          aria-controls={bodyId}
          aria-expanded={isOpen}
          aria-label={field.label ? undefined : 'Toggle section'}
          onClick={handleToggle}
          type='button'
          {...stylex.props(
            styles.header,
            styles.headerButton,
            isOpen && styles.headerOpen,
          )}
        >
          <span {...stylex.props(styles.label)}>{field.label}</span>
          <span
            {...stylex.props(styles.caret, !isOpen && styles.caretCollapsed)}
          />
        </button>
      )}
      {!field.collapsible && Boolean(field.label) && (
        <div {...stylex.props(styles.header, styles.headerOpen)}>
          <span {...stylex.props(styles.label)}>{field.label}</span>
        </div>
      )}
      <div
        hidden={!isOpen}
        id={bodyId}
        {...stylex.props(styles.body, !isOpen && styles.bodyHidden)}
      >
        {renderFields(
          field.fields as readonly FieldNode<Record<string, unknown>>[],
        )}
      </div>
    </div>
  );
};
