import apiClient from '../api';

/**
 * Payment Service – /api/Payment/* (yêu cầu Bearer Token)
 */

/**
 * Tạo payment link (VNPay / MoMo / …).
 *
 * @param {Object} data
 * @param {string|number} data.planId   – ID gói muốn mua
 * @param {string}        [data.returnUrl] – URL callback sau thanh toán (optional, tuỳ backend)
 */
export const createPaymentLink = (data) =>
    apiClient.post('/api/Payment/create-link', {
        planId: data.planId,
        returnUrl: data.returnUrl ?? window.location.origin + '/dashboard',
    });

    export const getSubscriptionPlans = () => 
    apiClient.get('/api/Payment/plans');