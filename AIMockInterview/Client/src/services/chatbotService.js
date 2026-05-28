import api from '../api';

export const sendChatbotMessage = async (userMessage) => {
    try {
        const res = await api.post('/api/Interview/general-chat', {
            userMessage: userMessage
        });
        
        return res.data.response;
    } catch (error) {
        console.error("Lỗi Chatbot BE:", error);
        throw error;
    }
};