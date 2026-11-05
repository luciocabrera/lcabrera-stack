import * as stylex from '@stylexjs/stylex';

import { Breadcrumbs } from '#ui/components/Breadcrumbs';
import { Text } from '#ui/components/Text';
import { Title } from '#ui/components/Title';

import type { PageHeaderProps } from './PageHeader.types';

import { styles } from './PageHeader.stylex';
import { PageHeaderRouteBreadcrumbs } from './PageHeaderRouteBreadcrumbs/PageHeaderRouteBreadcrumbs.component';
import { hasDescription } from './utils/hasDescription.util';

export const PageHeader = ({
  actions,
  breadcrumbLabel,
  breadcrumbs,
  description,
  title,
}: PageHeaderProps) => (
  <header {...stylex.props(styles.header)}>
    {breadcrumbs === undefined ? (
      <PageHeaderRouteBreadcrumbs label={breadcrumbLabel} />
    ) : (
      <Breadcrumbs items={breadcrumbs} label={breadcrumbLabel} />
    )}
    <Title actions={actions} level={1} variant='plain'>
      {title}
    </Title>
    {hasDescription(description) && (
      <Text as='div' tone='secondary'>
        {description}
      </Text>
    )}
  </header>
);
