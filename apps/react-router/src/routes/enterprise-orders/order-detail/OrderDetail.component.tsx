import * as stylex from '@stylexjs/stylex';
import { useLoaderData } from 'react-router';

import type { loader } from './order-detail.loader';

import { styles } from './OrderDetail.stylex';

export const OrderDetail = () => {
  const { order } = useLoaderData<typeof loader>();

  return (
    <div {...stylex.props(styles.container)}>
      {JSON.stringify(order, undefined, 2)}
    </div>
  );
};
