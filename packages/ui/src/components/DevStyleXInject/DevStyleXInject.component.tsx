import { useEffect } from 'react';

import type { DevStyleXInjectProps } from './DevStyleXInject.types';

export const DevStyleXInject = ({ cssHref }: DevStyleXInjectProps) => {
  useEffect(() => {
    if (import.meta.env.DEV) {
      void import('virtual:stylex:runtime');
    }
  }, []);

  return import.meta.env.DEV ? (
    <link href='/virtual:stylex.css' rel='stylesheet' />
  ) : (
    cssHref && <link href={cssHref} rel='stylesheet' />
  );
};
