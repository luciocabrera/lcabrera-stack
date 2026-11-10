import { Table } from '@lcabrera/ui/components/Table';
import { Title } from '@lcabrera/ui/components/Title';
import * as stylex from '@stylexjs/stylex';

import type { AdjudicationSpendProps } from './EvalsAdjudications.types';

import { layoutStyles } from '../evalsLayout.stylex';
import {
  BUILDER_COLUMNS,
  COST_COLUMNS,
  RULE_COLUMNS,
} from './EvalsAdjudications.constants';

export const AdjudicationSpend = ({
  builders,
  costs,
  rules,
}: AdjudicationSpendProps) => (
  <>
    <section {...stylex.props(layoutStyles.section)}>
      <Title level={2} variant='plain'>
        False positives by rule
      </Title>
      <Table
        caption='Cases by analyzer and rule, with the share the true answer called a false positive'
        columns={RULE_COLUMNS}
        density='compact'
        layout='static'
        response={rules}
      />
    </section>
    <section {...stylex.props(layoutStyles.section)}>
      <Title level={2} variant='plain'>
        Cost and time by model
      </Title>
      <Table
        caption='Reported cost, time and tokens of each model on the panel'
        columns={COST_COLUMNS}
        density='compact'
        layout='static'
        response={costs}
      />
    </section>
    <section {...stylex.props(layoutStyles.section)}>
      <Title level={2} variant='plain'>
        Cases by builder model
      </Title>
      <Table
        caption='Cases by the model that built the change, with the panel accuracy on them'
        columns={BUILDER_COLUMNS}
        density='compact'
        layout='static'
        response={builders}
      />
    </section>
  </>
);
