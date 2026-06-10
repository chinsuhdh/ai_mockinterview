import axios from 'axios';

// ─────────────────────────────────────────────
// BACKEND AXIOS INSTANCE (C# .NET)
// ─────────────────────────────────────────────
const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'https://ai-mockinterview.onrender.com',
    headers: { 'Content-Type': 'application/json' },
    timeout: 60000, 
});

apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;

        if (status === 401) {
            
            localStorage.removeItem('token');
            localStorage.removeItem('fullName');
            localStorage.removeItem('role');
            localStorage.removeItem('userId');
            window.location.href = '/auth';
        }

        return Promise.reject(error);
    }
);

export default apiClient;