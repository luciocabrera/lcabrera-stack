import * as stylex from '@stylexjs/stylex';

import { SettingsIcon } from '@/components/Icons';
import {
  SidePanel,
  SidePanelBody,
  SidePanelFooter,
  SidePanelHeader,
  SidePanelTitle,
} from '@/components/SidePanel';
import { ICON_SIZE_LG } from '@/design-system/constants';

import { shimmer, styles } from './TableSettingsDrawerSkeleton.stylex';
import type { PlaceholderProps } from './TableSettingsDrawerSkeleton.types';

const Placeholder = ({ customStylex }: PlaceholderProps) => {
  return (
    <div {...stylex.props(shimmer.placeholderBar, customStylex)}>
      <div {...stylex.props(shimmer.shimmerWave)} />
    </div>
  );
};

export const TableSettingsDrawerSkeleton = () => {
  const renderRow = (key: string) => {
    return (
      <div key={key} {...stylex.props(styles.row)}>
        <Placeholder customStylex={styles.rowCell} />
        <Placeholder customStylex={styles.rowCell} />
        <Placeholder customStylex={styles.rowCell} />
      </div>
    );
  };

  return (
    <SidePanel isOpen={true} isPinned={true} position='right' size='md'>
      <SidePanelHeader
        actions={
          <div {...stylex.props(styles.headerActions)}>
            <Placeholder customStylex={styles.circle} />
            <Placeholder customStylex={styles.circle} />
          </div>
        }
      >
        <SidePanelTitle icon={<SettingsIcon size={ICON_SIZE_LG} />}>
          Table Settings
        </SidePanelTitle>
      </SidePanelHeader>
      <SidePanelBody>
        <div {...stylex.props(styles.body)}>
          <div {...stylex.props(styles.tabs)}>
            <Placeholder customStylex={styles.tab} />
            <Placeholder customStylex={styles.tab} />
            <Placeholder customStylex={styles.tab} />
            <Placeholder customStylex={styles.tab} />
            <Placeholder customStylex={styles.tab} />
          </div>

          <div {...stylex.props(styles.section)}>
            <Placeholder customStylex={[styles.title, styles.widths.medium]} />

            <div {...stylex.props(styles.sectionTable)}>
              <div {...stylex.props(styles.rowHeader)}>
                <Placeholder customStylex={styles.rowCell} />
                <Placeholder customStylex={styles.rowCell} />
                <Placeholder customStylex={styles.rowCell} />
                <Placeholder customStylex={styles.rowCell} />
              </div>

              <div {...stylex.props(styles.rows)}>
                {renderRow('row-1')}
                {renderRow('row-2')}
                {renderRow('row-3')}
                {renderRow('row-4')}
              </div>
            </div>
          </div>

          <div {...stylex.props(styles.group)}>
            <Placeholder customStylex={[styles.line, styles.widths.short]} />
            <Placeholder customStylex={[styles.line, styles.widths.full]} />
            <Placeholder customStylex={[styles.line, styles.widths.full]} />
          </div>
        </div>
      </SidePanelBody>
      <SidePanelFooter>
        <div {...stylex.props(styles.footer)}>
          <Placeholder customStylex={styles.buttonBar} />
          <Placeholder customStylex={styles.buttonBar} />
        </div>
      </SidePanelFooter>
    </SidePanel>
  );
};
