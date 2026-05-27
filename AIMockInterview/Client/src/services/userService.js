import apiClient from '../api';

/**
 * User Service – /api/User/* (yêu cầu Bearer Token)
 */

/** Lấy thông tin profile của user hiện tại */
export const getProfile = () =>
    apiClient.get('/api/User/profile');

/** Cập nhật profile (fullName, avatar, …) */
export const updateProfile = (data) =>
    apiClient.put('/api/User/profile', data);

/** Đổi mật khẩu */
export const changePassword = (data) =>
    apiClient.post('/api/User/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
    });

/** Lấy danh sách lịch sử phỏng vấn */
export const getInterviewHistory = () =>
    apiClient.get('/api/User/interviews-history');

/** Lấy chi tiết một phiên phỏng vấn */
export const getInterviewDetail = (sessionId) =>
    apiClient.get(`/api/User/interviews-history/${sessionId}`);
