import type { FieldNode } from '@repo/ui/components/Form';

import { Form } from '@repo/ui/components/Form';
import { SectionCard } from '@repo/ui/components/SectionCard';
import { useActionData, useLoaderData } from 'react-router';

import type { action } from './editScanner.action';
import type { loader } from './editScanner.loader';
import type { EditScannerValues } from './editScanner.schema';

import { toEditScannerInitialValues } from './toEditScannerInitialValues.util';

const FIELDS: readonly FieldNode<EditScannerValues>[] = [
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
    accessor: 'isActive',
    description: 'Inactive scanners disappear from trigger-scan.',
    label: 'Active',
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

export const EditScanner = () => {
  const { scanner } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const serverErrors =
    actionData && 'errors' in actionData ? actionData.errors : undefined;

  return (
    <SectionCard
      description={`Editing ${scanner.display_name} (v${scanner.version}) — saving bumps the version and snapshots the previous state.`}
      title={`Edit Scanner: ${scanner.scanner_id}`}
    >
      <Form<EditScannerValues>
        cancelTo='/cqms/scanners'
        fields={FIELDS}
        initialValues={toEditScannerInitialValues(scanner)}
        mode='edit'
        serverErrors={serverErrors}
      />
    </SectionCard>
  );
};
