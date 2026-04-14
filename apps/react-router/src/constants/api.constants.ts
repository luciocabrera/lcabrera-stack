import type { ApiConfig } from '@/types/api.types';

export const API_SERVER_PORT = 3001;

export const CONFIG: ApiConfig = {
  dev: { apiHost: '/api' }, // Proxied by Vite
  localhost: { apiHost: `http://localhost:${API_SERVER_PORT}/api` },
  prod: { apiHost: '/api' }, // Same origin in production
};
