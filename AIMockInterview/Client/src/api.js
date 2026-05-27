import axios from 'axios';

// ─────────────────────────────────────────────
// 1. GEMINI AI – giữ nguyên để các component cũ không bị break
// ─────────────────────────────────────────────
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

export const callGemini = async (prompt, temperature = 0.7) => {
    const response = await axios.post(GEMINI_URL, {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature },
    });
    const rawText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error('Empty response from Gemini');
    const cleanJson = rawText.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanJson);
};

export const callAI = async (prompt, temperature = 0.7, model = 'gemini') => {
    if (model === 'gpt4') {
        const proPrompt = `[ACTING AS A HIGHLY STRICT, SENIOR EXPERT (PRO MODE)]\n${prompt}`;
        return callGemini(proPrompt, temperature);
    }
    return callGemini(prompt, temperature);
};

// ─────────────────────────────────────────────
// 2. BACKEND AXIOS INSTANCE (C# .NET)
// ─────────────────────────────────────────────
const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'https://ai-mockinterview.onrender.com/',
    headers: { 'Content-Type': 'application/json' },
    timeout: 15000,
});

// Request interceptor – tự động gắn JWT token vào header
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

// Response interceptor – xử lý lỗi chung
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;

        if (status === 401) {
            // Token hết hạn hoặc không hợp lệ → clear storage và về trang auth
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