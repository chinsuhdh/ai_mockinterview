import apiClient from '../api';

/**
 * Auth Service – POST /api/Auth/*
 * Không cần token (public endpoints)
 */

/** Đăng ký tài khoản mới */
export const register = (data) =>
    apiClient.post('/api/Auth/register', {
        fullName: data.fullName,
        email: data.email,
        password: data.password,
    });

/** Đăng nhập – trả về { token, userId, fullName, role } */
export const login = (data) =>
    apiClient.post('/api/Auth/login', {
        email: data.email,
        password: data.password,
    });

/** Xác thực OTP sau đăng ký hoặc quên mật khẩu */
export const verifyOtp = (data) =>
    apiClient.post('/api/Auth/verify-otp', {
        email: data.email,
        otp: data.otp,
    });

/** Gửi yêu cầu quên mật khẩu – backend sẽ gửi OTP về email */
export const forgotPassword = (email) =>
    apiClient.post('/api/Auth/forgot-password', { email });

/** Đặt lại mật khẩu sau khi xác thực OTP */
export const resetPassword = (data) =>
    apiClient.post('/api/Auth/reset-password', {
        email: data.email,
        otp: data.otp,
        newPassword: data.newPassword,
    });

// ─── Helper: lưu session vào localStorage sau login thành công ───
export const persistAuthSession = (responseData) => {
    if (responseData.token)    localStorage.setItem('token',    responseData.token);
    if (responseData.userId)   localStorage.setItem('userId',   responseData.userId);
    if (responseData.fullName) localStorage.setItem('fullName', responseData.fullName);
    if (responseData.role)     localStorage.setItem('role',     responseData.role);
};

export const clearAuthSession = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('fullName');
    localStorage.removeItem('role');
};
