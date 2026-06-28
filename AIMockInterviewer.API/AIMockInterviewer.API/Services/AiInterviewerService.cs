using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;

namespace AIMockInterviewer.API.Services
{
    public class AiInterviewerService
    {
        private readonly IChatCompletionService _chatCompletionService;

        public AiInterviewerService(IChatCompletionService chatCompletionService)
        {
            _chatCompletionService = chatCompletionService;
        }

        public async Task<string> GenerateInterviewResponse(string userMessage, string jobDescription, List<string> history, string language = "vi")
        {
            var chatHistory = new ChatHistory($@"
                You are a professional Interviewer for: '{jobDescription}'.
                
                *** MISSION ***:
                1. Analyze the candidate's input.
                2. Provide constructive feedback in VIETNAMESE.
                3. Ask the next question in VIETNAMESE (for display).
                4. Translate that EXACT next question into ENGLISH (for voice generation).

                *** OUTPUT FORMAT (JSON ONLY) ***:
                {{
                    ""feedback"": ""(Tiếng Việt) Nhận xét ngắn gọn về câu trả lời..."",
                    ""nextQuestion"": ""(Tiếng Việt) Câu hỏi tiếp theo..."",
                    ""nextQuestionEn"": ""(English) The exact English translation...""
                }}");

            foreach (var msg in history)
            {
                if (msg.StartsWith("User:"))
                    chatHistory.AddUserMessage(msg.Replace("User:", "").Trim());
                else if (msg.StartsWith("AI:"))
                    chatHistory.AddAssistantMessage(msg.Replace("AI:", "").Trim());
                else
                    chatHistory.AddSystemMessage(msg);
            }

            chatHistory.AddUserMessage(userMessage);

            var executionSettings = new PromptExecutionSettings
            {
                ExtensionData = new Dictionary<string, object>
                {
                    { "response_mime_type", "application/json" }
                }
            };

            var response = await _chatCompletionService.GetChatMessageContentAsync(chatHistory, executionSettings);
            return response.Content ?? "{}";
        }

        public async Task<string> AnalyzeJdAndCreateQuestions(string contextData)
        {
            var chatHistory = new ChatHistory();

            // Đưa toàn bộ context vào UserMessage thay vì constructor (System)
            chatHistory.AddUserMessage($@"
        Act as a Senior Recruiter. Analyze the following context (JD and/or CV): '{contextData}'.
        Task: Create exactly 8 to 10 interview questions based strictly on the provided context.
        - 2 Ice-breaking
        - 3 Behavioral
        - 3-5 Technical or Experience-based questions specific to the provided text.
        
        *** OUTPUT FORMAT (STRICT JSON ARRAY) ***:
        [
            {{ ""vi"": ""Câu hỏi 1..."", ""en"": ""Question 1..."" }},
            {{ ""vi"": ""Câu hỏi 2..."", ""en"": ""Question 2..."" }}
        ]");

            var executionSettings = new PromptExecutionSettings
            {
                ExtensionData = new Dictionary<string, object> { { "response_mime_type", "application/json" } }
            };

            var response = await _chatCompletionService.GetChatMessageContentAsync(chatHistory, executionSettings);
            return response.Content ?? "[]";
        }

        public async Task<string> GetHintForQuestion(string currentQuestion, string jobDescription)
        {
            var chatHistory = new ChatHistory();

            // Tương tự, chuyển prompt thành UserMessage
            chatHistory.AddUserMessage($@"
        You are an Interview Mentor. Candidate is stuck on: '{currentQuestion}' for JD: '{jobDescription}'. 
        Provide a hint in JSON format: 
        {{ ""hintVi"": ""..."", ""hintEn"": ""..."" }}");

            var executionSettings = new PromptExecutionSettings
            {
                ExtensionData = new Dictionary<string, object> { { "response_mime_type", "application/json" } }
            };

            var response = await _chatCompletionService.GetChatMessageContentAsync(chatHistory, executionSettings);
            return response.Content ?? "{}";
        }

        public async Task<string> EvaluateInterviewAsync(string jobDescription, List<string> history)
        {
            var chatHistory = new ChatHistory($@"
                You are an Expert HR Manager. Review the entire interview transcript for the JD: '{jobDescription}'.
                
                *** MISSION ***:
                Evaluate the candidate's performance based on their answers. Provide constructive, detailed feedback in VIETNAMESE.
                
                *** OUTPUT FORMAT (JSON ONLY) ***:
                {{
                    ""overallScore"": (Integer from 0 to 100),
                    ""generalComment"": ""(Tiếng Việt) Nhận xét tổng quan về buổi phỏng vấn (Điểm mạnh lớn nhất, điểm yếu cốt lõi)..."",
                    ""criteria"": [
                        {{
                            ""name"": ""(Tiếng Việt) Tên tiêu chí (VD: Kiến thức chuyên môn, Kỹ năng giao tiếp, Thái độ...)"",
                            ""score"": (Integer from 0 to 100),
                            ""comment"": ""(Tiếng Việt) Nhận xét và gợi ý cải thiện cho tiêu chí này...""
                        }}
                    ]
                }}");

            chatHistory.AddUserMessage($"[Interview Transcript]:\n{string.Join("\n", history)}");

            var executionSettings = new PromptExecutionSettings
            {
                ExtensionData = new Dictionary<string, object> { { "response_mime_type", "application/json" } }
            };

            var response = await _chatCompletionService.GetChatMessageContentAsync(chatHistory, executionSettings);
            return response.Content ?? "{}";
        }

        public async Task<string> GetGeneralChatResponse(string userMessage)
        {
            var chatHistory = new ChatHistory($@"
                Bạn là trợ lý ảo AI của hệ thống Mock Interview. Hãy trả lời ngắn gọn, thân thiện, và hữu ích.
                
                *** OUTPUT FORMAT (JSON ONLY) ***:
                {{
                    ""reply"": ""(Tiếng Việt) Câu trả lời của bạn...""
                }}");

            chatHistory.AddUserMessage(userMessage);

            var executionSettings = new PromptExecutionSettings
            {
                ExtensionData = new Dictionary<string, object> { { "response_mime_type", "application/json" } }
            };

            var response = await _chatCompletionService.GetChatMessageContentAsync(chatHistory, executionSettings);
            return response.Content ?? "{}";
        }
    }
}