import axios from 'axios';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
// Dùng gemini-2.5-flash – đã được xác nhận hoạt động trong dự án này
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// System prompt nhúng vào phần đầu conversation (cách tương thích nhất)
const SYSTEM_PROMPT = `Bạn là "AI Recruiter" – trợ lý tư vấn phỏng vấn của nền tảng AI Mock Interviewer.
Quy tắc của bạn:
1. Chỉ tư vấn về phỏng vấn xin việc, CV, JD, kỹ năng mềm, STAR method.
2. Trả lời Tiếng Việt, thân thiện, ngắn gọn (2-4 câu). Có thể dùng emoji vừa phải.
3. Nếu người dùng hỏi "bạn là ai" → giới thiệu mình là AI Recruiter của AI Mock Interviewer.
4. Có thể đặt câu hỏi phỏng vấn mẫu nếu user yêu cầu luyện tập.
5. KHÔNG nói về chủ đề ngoài tuyển dụng/phỏng vấn.`;

/**
 * Gửi tin nhắn đến Gemini với multi-turn conversation history.
 * @param {Array<{sender: 'user'|'bot', text: string, isGreeting?: boolean}>} historyBeforeUser
 *   Lịch sử các tin nhắn TRƯỚC tin nhắn mới của user (không bao gồm userMessage)
 * @param {string} userMessage - Tin nhắn mới nhất của user
 * @returns {Promise<string>} - Phản hồi text từ AI
 */
export const sendChatMessage = async (historyBeforeUser, userMessage) => {
    const contents = [];

    // Tin nhắn đầu tiên luôn là "user" chứa system prompt (trick để tránh role mismatch)
    contents.push({
        role: 'user',
        parts: [{ text: SYSTEM_PROMPT }],
    });
    contents.push({
        role: 'model',
        parts: [{ text: 'Đã hiểu! Mình sẵn sàng tư vấn phỏng vấn cho bạn.' }],
    });

    // Thêm lịch sử hội thoại thực (bỏ qua greeting đầu tiên của bot)
    for (const msg of historyBeforeUser) {
        if (msg.isGreeting) continue; // bỏ qua tin nhắn chào mặc định
        contents.push({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }],
        });
    }

    // Thêm tin nhắn mới của user vào cuối
    contents.push({
        role: 'user',
        parts: [{ text: userMessage }],
    });

    const payload = {
        contents,
        generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 512,
        },
    };

    const res = await axios.post(GEMINI_URL, payload);
    const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('No response from Gemini');
    return text.trim();
};
