import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const user = localStorage.getItem('user');

  if (user) {
    const token = JSON.parse(user).token;
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      if (localStorage.getItem('user')) {
        localStorage.removeItem('user');
        // If needed, redirect the user to the login page or refresh
        // window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export { api };