import * as stylex from '@stylexjs/stylex';

import { CopyButton } from '#ui/components/CopyButton';
import { StaticTable } from '#ui/components/StaticTable';
import { Tabs } from '#ui/components/Tabs';

import type { JsonExplorerProps } from './JsonExplorer.types';

import { styles } from './JsonExplorer.stylex';

/**
 * One tab per JSON section, each rendering that section's rows as a flat
 * `StaticTable` next to a button copying the section's raw JSON.
 *
 * Sections arrive already shaped — their columns are inferred server-side (see
 * `JsonExplorerProps`) — so this adds no structure of its own. A value that is
 * itself an object or array is passed through to the table as a cell value,
 * not rendered as nested structure.
 */
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
