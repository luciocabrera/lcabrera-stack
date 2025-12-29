import { useEffect } from 'react';

import type { DevStyleXInjectProps } from './DevStyleXInject.types';

export const DevStyleXInject = ({ cssHref }: DevStyleXInjectProps) => {
  useEffect(() => {
    if (import.meta.env.DEV) {
      void import('virtual:stylex:runtime');
    }
  }, []);

  if (import.meta.env.DEV) {
    return <link href='/virtual:stylex.css' rel='stylesheet' />;
  }

  return cssHref && <link href={cssHref} rel='stylesheet' />;
};
