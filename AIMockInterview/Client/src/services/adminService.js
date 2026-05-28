import apiClient from '../api';

/**
 * Admin Service – /api/Admin/* (yêu cầu Bearer Token + Role Admin)
 */

// ── Dashboard ──────────────────────────────
export const getDashboard = () =>
    apiClient.get('/api/Admin/dashboard');

// ── Users ──────────────────────────────────
export const getUsers = () =>
    apiClient.get('/api/Admin/users');

export const toggleUserStatus = (userId) =>
    apiClient.put(`/api/Admin/users/${userId}/toggle-status`);

// ── Plans (gói dịch vụ) ────────────────────
export const getPlans = () =>
    apiClient.get('/api/Admin/plans');

export const getPlanById = (id) =>
    apiClient.get(`/api/Admin/plans/${id}`);

export const createPlan = (data) =>
    apiClient.post('/api/Admin/plans', data);

export const updatePlan = (id, data) =>
    apiClient.put(`/api/Admin/plans/${id}`, data);

export const deletePlan = (id) =>
    apiClient.delete(`/api/Admin/plans/${id}`);


// ── Interviews ─────────────────────────────
export const getInterviews = () =>
    apiClient.get('/api/Admin/interviews');


// ── Transactions ───────────────────────────
export const getTransactions = () =>
    apiClient.get('/api/Admin/transactions');


export const getVisitorStats = () => apiClient.get('/api/Admin/visitor-stats');
export const clearVisitorStats = () => apiClient.delete('/api/Admin/visitor-stats/clear');