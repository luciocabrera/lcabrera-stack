import { Button, TableLayout } from '@lcabrera/ui';
import * as stylex from '@stylexjs/stylex';

import type { MockResponse, MockRow } from '../ShowcasePage.types';

import {
  FAKE_API_DELAY_MS,
  getTableDataPromise,
  resetTableDataPromise,
  SHOWCASE_COLUMNS_STATE,
  SHOWCASE_META_STATE,
} from '../showcaseData.util';
import { ShowcaseSection } from '../ShowcaseSection';
import { styles } from './TableSection.stylex';

export const TableSection = () => (
  <ShowcaseSection title='Table'>
    <div {...stylex.props(styles.controls)}>
      <Button onClick={resetTableDataPromise} variant='secondary'>
        🔄 Reload Table Data (Test Loading)
      </Button>
      <span {...stylex.props(styles.delayLabel)}>
        Simulated delay: {FAKE_API_DELAY_MS}ms
      </span>
    </div>
    <div {...stylex.props(styles.tableContainer)}>
      <TableLayout<MockRow, MockResponse>
        columnsState={SHOWCASE_COLUMNS_STATE}
        dataPromise={getTableDataPromise()}
        dataSelector={(response) => response.data}
        dataTotalSelector={(response) => response.total}
        metaState={SHOWCASE_META_STATE}
      />
    </div>
  </ShowcaseSection>
);
