import { state } from './state.js';

export async function apiRequest(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (state.currentUser.token) {
    headers.Authorization = `Bearer ${state.currentUser.token}`;
  }

  const response = await fetch(`/api${path}`, { ...options, headers });
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.error || 'Ocurrió un error al comunicarse con el servidor');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}
