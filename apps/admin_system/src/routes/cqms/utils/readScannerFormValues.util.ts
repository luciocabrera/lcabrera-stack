import { isCheckboxChecked } from '@lcabrera/utils/forms/is-checkbox-checked.util';

type ReadScannerFormValuesArgs = {
  readonly formData: FormData;
};

/**
 * Reads the scanner fields both authoring forms post, ready for
 * scannerFieldsSchema. Each route wraps this with its own extra field.
 *
 * An unchecked checkbox posts nothing at all, hence isCheckboxChecked rather
 * than a `.get()`; every text field falls back to '' so the schema reports a
 * field error instead of zod complaining about the wrong type.
 */
export const readScannerFormValues = ({
  formData,
}: ReadScannerFormValuesArgs) => ({
  allowedTools: formData.get('allowedTools') ?? '',
  commandTemplate: formData.get('commandTemplate') ?? '',
  configDetection: formData.get('configDetection') ?? '',
  description: formData.get('description') ?? '',
  deterministic: isCheckboxChecked({ formData, name: 'deterministic' }),
  displayName: formData.get('displayName') ?? '',
  rawArtifactFileName: formData.get('rawArtifactFileName') ?? '',
  stepsMarkdown: formData.get('stepsMarkdown') ?? '',
  supportsDiffScope: isCheckboxChecked({ formData, name: 'supportsDiffScope' }),
});
