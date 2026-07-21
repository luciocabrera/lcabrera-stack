import { CopyButton } from '@lcabrera/ui/components/CopyButton';
import { StaticTable } from '@lcabrera/ui/components/StaticTable';
import { Tabs } from '@lcabrera/ui/components/Tabs';
import * as stylex from '@stylexjs/stylex';

import type { JsonExplorerProps } from './JsonExplorer.types';

import { styles } from './JsonExplorer.stylex';
// TODO: Reevaluate this component as a JSON could be nested, so we might need to use a tree view instead of a table. For now, this is good enough for the current use case.
// or maybe we can make the table component support nested data, but that might be a bit more work than we want to do right now.
export const JsonExplorer = ({ sections }: JsonExplorerProps) => (
  <Tabs
    tabs={sections.map((section) => ({
      children: (
        <>
          <div {...stylex.props(styles.sectionHeader)}>
            <CopyButton
              label='Copy raw JSON'
              value={JSON.stringify(section.rows, undefined, 2)}
            />
          </div>
          <StaticTable
            columns={section.columns}
            rows={section.rows}
            title={section.label}
          />
        </>
      ),
      header: section.label,
      key: section.label,
    }))}
  />
);
