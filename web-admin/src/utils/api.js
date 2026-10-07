import axios from 'axios';

const api = axios.create({
  baseURL: '/api' // Nhờ proxy trong vite.config.js, sẽ gọi đến http://localhost:8080/api
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('adminToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
