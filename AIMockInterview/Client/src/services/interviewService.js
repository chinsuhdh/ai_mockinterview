import apiClient from '../api';

/**
 * Interview Service – /api/Interview/* (yêu cầu Bearer Token)
 */

/**
 * Bắt đầu phiên phỏng vấn mới.
 * Backend nhận [FromForm] → gửi FormData.
 *
 * @param {Object} data
 * @param {string}   data.jobDescription  – Nội dung JD (text hoặc đã extract)
 * @param {File}     [data.resumeFile]    – File CV (PDF/DOCX), nếu có
 * @param {string}   data.language        – 'vi' | 'en'
 * @param {string}   [data.model]         – 'gemini' | 'gpt4'
 * @param {number}   [data.questionCount] – Số câu hỏi mong muốn
 */
export const startInterview = (data) => {
    const formData = new FormData();
    formData.append('jobDescription', data.jobDescription ?? '');
    formData.append('language', data.language ?? 'vi');
    if (data.resumeFile)    formData.append('resumeFile',    data.resumeFile);
    if (data.model)         formData.append('model',         data.model);
    if (data.questionCount) formData.append('questionCount', String(data.questionCount));

    return apiClient.post('/api/Interview/start', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};

/**
 * Gửi câu trả lời của user, nhận phản hồi + câu hỏi tiếp theo.
 *
 * @param {Object} data
 * @param {string} data.sessionId
 * @param {string} data.userMessage  – Câu trả lời của user
 * @param {string} [data.jobDescription]
 * @param {Array}  [data.history]    – Mảng chuỗi lịch sử hội thoại gần nhất
 */
export const sendChatMessage = (data) =>
    apiClient.post('/api/Interview/chat', {
        sessionId: data.sessionId,
        userMessage: data.userMessage,
        jobDescription: data.jobDescription ?? '',
        history: data.history ?? [],
    });

/**
 * Lấy gợi ý (hint) cho câu hỏi hiện tại.
 *
 * @param {Object} data
 * @param {string} data.sessionId
 * @param {string} data.currentQuestion
 * @param {string} [data.jobDescription]
 */
export const getHint = (data) =>
    apiClient.post('/api/Interview/get-hint', {
        sessionId: data.sessionId,
        currentQuestion: data.currentQuestion,
        jobDescription: data.jobDescription ?? '',
    });

/**
 * Kết thúc phiên phỏng vấn và nhận báo cáo đánh giá.
 *
 * @param {string} sessionId
 */
export const endInterview = (sessionId) =>
    apiClient.post(`/api/Interview/${sessionId}/end`);

/**
 * Tiếp tục phiên phỏng vấn đang dang dở (In-Progress)
 * @param {string} sessionId
 */
export const resumeInterview = (sessionId) =>
    apiClient.get(`/api/Interview/${sessionId}/resume`);