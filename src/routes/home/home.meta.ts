import type { Route } from '../+types/home';

export const meta = ({ ..._props }: Route.MetaArgs) => {

  console.log('Generating meta tags for Home route', _props);
  return [
    { title: 'New React Router App' },
    { content: 'Welcome to React Router!', name: 'description' },
  ];
};
