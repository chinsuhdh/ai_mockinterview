using System.Text;
using System.Text.Json;

namespace AIMockInterviewer.API.Services
{
    public class AiInterviewerService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;

        public AiInterviewerService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _apiKey = configuration["Gemini:ApiKey"] ?? throw new Exception("Thiếu API Key!");
        }

        public async Task<string> GenerateInterviewResponse(string userMessage, string jobDescription, List<string> history, string language = "vi")
        {
            var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={_apiKey}";

            string systemInstruction = $@"
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
                }}";

            string context = string.Join("\n", history);
            string fullPrompt = $"{systemInstruction}\n\n[Chat History]:\n{context}\n\n[Candidate Answer]: {userMessage}\n\n[AI Response (JSON)]:";

            return await CallGeminiApi(url, fullPrompt);
        }

        // Đổi tên tham số từ jobDescription thành contextData
        public async Task<string> AnalyzeJdAndCreateQuestions(string contextData)
        {
            var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={_apiKey}";

            // Sửa lại prompt một chút để phù hợp với cả 2 trường hợp
            string prompt = $@"
                Act as a Senior Recruiter. Analyze the following context (JD and/or CV): '{contextData}'.
                Task: Create exactly 8 to 10 interview questions based strictly on the provided context.
                - 2 Ice-breaking
                - 3 Behavioral
                - 3-5 Technical or Experience-based questions specific to the provided text.
                
                *** OUTPUT FORMAT (STRICT JSON ARRAY) ***:
                [
                    {{ ""vi"": ""Câu hỏi 1..."", ""en"": ""Question 1..."" }},
                    {{ ""vi"": ""Câu hỏi 2..."", ""en"": ""Question 2..."" }}
                ]";

            return await CallGeminiApi(url, prompt);
        }

        public async Task<string> GetHintForQuestion(string currentQuestion, string jobDescription)
        {
            var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={_apiKey}";
            string prompt = $@"You are an Interview Mentor. Candidate is stuck on: '{currentQuestion}' for JD: '{jobDescription}'. Provide a hint in JSON format: {{ ""hintVi"": ""..."", ""hintEn"": ""..."" }}";
            return await CallGeminiApi(url, prompt);
        }

        private async Task<string> CallGeminiApi(string url, string prompt)
        {
            var requestBody = new
            {
                contents = new[] { new { parts = new[] { new { text = prompt } } } },
                // Ép Gemini trả về JSON chuẩn
                generationConfig = new { responseMimeType = "application/json" }
            };

            var jsonContent = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync(url, jsonContent);

            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                throw new Exception($"Gemini API Error: {error}");
            }

            var responseString = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(responseString);
            return doc.RootElement.GetProperty("candidates")[0].GetProperty("content").GetProperty("parts")[0].GetProperty("text").GetString() ?? "";
        }

        public async Task<string> EvaluateInterviewAsync(string jobDescription, List<string> history)
        {
            var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={_apiKey}";

            string systemInstruction = $@"
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
                }}";

            string context = string.Join("\n", history);
            string fullPrompt = $"{systemInstruction}\n\n[Interview Transcript]:\n{context}\n\n[HR Evaluation (JSON)]:";

            return await CallGeminiApi(url, fullPrompt);
        }

        public async Task<string> GetGeneralChatResponse(string userMessage)
        {
            var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={_apiKey}";

            string prompt = $@"
                Bạn là trợ lý ảo AI của hệ thống Mock Interview. Hãy trả lời ngắn gọn, thân thiện, và hữu ích cho câu hỏi sau: '{userMessage}'
                
                *** OUTPUT FORMAT (JSON ONLY) ***:
                {{
                    ""reply"": ""(Tiếng Việt) Câu trả lời của bạn...""
                }}";

            return await CallGeminiApi(url, prompt);
        }
    }
}