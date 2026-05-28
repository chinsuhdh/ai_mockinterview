using Microsoft.AspNetCore.Http;

namespace AIMockInterviewer.API.DTOs
{
    public class StartInterviewRequest
    {
        public string? JdTitle { get; set; } 
        public string? JdContent { get; set; } 
        public IFormFile? JdFile { get; set; } 
        public IFormFile? CvFile { get; set; }
    }

    public class StartInterviewResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = null!;
        public Guid? SessionId { get; set; }
    }

    public class StartSessionRequest
    {
        public string JobDescription { get; set; } = null!;
        public string Language { get; set; } = "vi";
    }

    public class ChatRequest
    {
        public Guid SessionId { get; set; } 
        public string UserMessage { get; set; } = null!;
        public string Language { get; set; } = "vi";
    }

    public class HintRequest
    {
        public Guid SessionId { get; set; } 
        public string CurrentQuestion { get; set; } = null!;
    }

    public class QuestionItem
    {
        public string vi { get; set; } = null!;
        public string en { get; set; } = null!;
    }

    public class GeminiChatResponse
    {
        public string feedback { get; set; } = null!;
        public string nextQuestion { get; set; } = null!;
        public string nextQuestionEn { get; set; } = null!;
    }

    public class AiEvaluationResponse
    {
        public int overallScore { get; set; }
        public string generalComment { get; set; } = string.Empty;
        public List<AiCriterion> criteria { get; set; } = new List<AiCriterion>();
    }

    public class AiCriterion
    {
        public string name { get; set; } = string.Empty;
        public int score { get; set; }
        public string comment { get; set; } = string.Empty;
    }


}