import {
  SidePanelSection,
  SidePanelSectionHeader,
  SidePanelSectionMain,
} from '@repo/ui/components/SidePanel';
import * as stylex from '@stylexjs/stylex';

import type { DetailsSectionProps } from './DetailsSection.types';

import { busyStyles, styles } from './DetailsSection.stylex';
import { useDetailsRows } from './hooks/useDetailsRows.hook';

export const DetailsSection = ({ isBusy = false }: DetailsSectionProps) => {
  const rows = useDetailsRows();

  return (
    <SidePanelSectionMain>
      <SidePanelSection>
        <SidePanelSectionHeader title='Table Details' />
        <dl {...stylex.props(styles.rows)}>
          {rows.map((row) => (
            <div key={row.key} {...stylex.props(styles.row)}>
              {Boolean(isBusy) && (
                <div {...stylex.props(busyStyles.overlay)}>
                  <div {...stylex.props(busyStyles.wave)} />
                </div>
              )}
              <dt {...stylex.props(styles.label)}>{row.label}</dt>
              <dd {...stylex.props(styles.value)}>{row.value}</dd>
            </div>
          ))}
        </dl>
      </SidePanelSection>
    </SidePanelSectionMain>
  );
};
