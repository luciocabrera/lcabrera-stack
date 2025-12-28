import { useEffect } from 'react';

type DevStyleXInjectProps = {
  /** CSS href to use in production builds (e.g. '/stylex.css') */
  cssHref?: string;
};

export function DevStyleXInject({ cssHref }: DevStyleXInjectProps) {
  useEffect(() => {
    if (import.meta.env.DEV) {
      void import('virtual:stylex:runtime');
    }
  }, []);

  if (import.meta.env.DEV) {
    return <link href='/virtual:stylex.css' rel='stylesheet' />;
  }

  return cssHref ? <link href={cssHref} rel='stylesheet' /> : null;
}
