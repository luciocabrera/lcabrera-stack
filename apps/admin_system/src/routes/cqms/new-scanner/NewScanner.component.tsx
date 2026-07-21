import type { FieldNode } from '@lcabrera/ui/components/Form';

import { Form } from '@lcabrera/ui/components/Form';
import { SectionCard } from '@lcabrera/ui/components/SectionCard';
import { useActionData } from 'react-router';

import type { action } from './newScanner.action';
import type { NewScannerValues } from './newScanner.schema';

const FIELDS: readonly FieldNode<NewScannerValues>[] = [
  {
    accessor: 'scannerId',
    clientValidation: { required: true },
    description: 'Lowercase kebab-case natural key, e.g. my-scanner.',
    label: 'Scanner Id',
    type: 'text',
  },
  {
    accessor: 'displayName',
    clientValidation: { required: true },
    label: 'Display Name',
    type: 'text',
  },
  { accessor: 'description', label: 'Description', type: 'textarea' },
  {
    accessor: 'deterministic',
    description:
      'Deterministic scanners run a tool script; non-deterministic ones run an LLM skill session.',
    label: 'Deterministic',
    type: 'boolean',
  },
  {
    accessor: 'supportsDiffScope',
    label: 'Supports diff scope',
    type: 'boolean',
  },
  {
    accessor: 'commandTemplate',
    description:
      'Documentation of the runner invocation — {target}, {scope} and {outputDir} placeholders.',
    label: 'Command Template',
    type: 'text',
  },
  {
    accessor: 'rawArtifactFileName',
    description: 'Defaults to <scanner-id>.raw.json when left empty.',
    label: 'Raw Artifact File Name',
    type: 'text',
  },
  {
    accessor: 'configDetection',
    description: 'Optional JSON object describing config-file detection.',
    label: 'Config Detection',
    type: 'textarea',
  },
  {
    accessor: 'allowedTools',
    description: 'Comma-separated Agent SDK tool patterns (LLM scanners).',
    label: 'Allowed Tools',
    type: 'text',
  },
  {
    accessor: 'stepsMarkdown',
    description: 'Seeds the generated SKILL.md steps section (LLM scanners).',
    label: 'Steps Markdown',
    type: 'textarea',
  },
];

export const NewScanner = () => {
  const actionData = useActionData<typeof action>();
  const serverErrors =
    actionData && 'errors' in actionData ? actionData.errors : undefined;

  return (
    <SectionCard
      description='Register a scanner. Missing on-disk artifacts (SKILL.md or a runner-script scaffold) are generated from templates — existing files are never overwritten.'
      title='New Scanner'
    >
      <Form<NewScannerValues>
        cancelTo='/cqms/scanners'
        fields={FIELDS}
        mode='create'
        serverErrors={serverErrors}
      />
    </SectionCard>
  );
};
