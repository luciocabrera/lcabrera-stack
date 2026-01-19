import type { ApiConfig } from '@/types/api.types';

export const CONFIG: ApiConfig = {
  dev: { apiHost: '/api' }, // Proxied by Vite
  localhost: { apiHost: 'http://localhost:3001/api' },
  prod: { apiHost: '/api' }, // Same origin in production
};
