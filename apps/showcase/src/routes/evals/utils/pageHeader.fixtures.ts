import { screen, within } from '@testing-library/react';

export const breadcrumbTrail = () =>
  within(screen.getByRole('navigation', { name: 'Breadcrumb' }))
    .getAllByRole('listitem')
    .map((item) => {
      const link = within(item).queryByRole('link');
      const current = item.querySelector('[aria-current="page"]');

      return {
        href: link?.getAttribute('href'),
        isCurrent: current !== null,
        label: (link ?? current ?? item).textContent,
      };
    });

export const evalsTrail = (page: string) => [
  { href: '/evals', isCurrent: false, label: 'Evals' },
  { href: undefined, isCurrent: true, label: page },
];
