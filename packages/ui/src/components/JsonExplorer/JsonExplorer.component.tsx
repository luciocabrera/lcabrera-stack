import * as stylex from '@stylexjs/stylex';

import { CopyButton } from '#ui/components/CopyButton';
import { Table } from '#ui/components/Table';
import { Tabs } from '#ui/components/Tabs';

import type { JsonExplorerProps } from './JsonExplorer.types';

import { styles } from './JsonExplorer.stylex';

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
          <Table
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
