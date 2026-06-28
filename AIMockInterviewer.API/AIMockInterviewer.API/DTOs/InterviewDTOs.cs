using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;

namespace AIMockInterviewer.API.DTOs
{
    // --- REQUEST CLASSES ---
    public class StartInterviewRequest
    {
        public string? JdTitle { get; set; }
        public string? JdContent { get; set; }
        public IFormFile? JdFile { get; set; }
        public IFormFile? CvFile { get; set; }
    }

    public class ChatRequest
    {
        public Guid SessionId { get; set; }
        public string UserMessage { get; set; } = null!;
        public string Language { get; set; } = "vi";
    }

    // --- BASE RESPONSE TỪNG API ---
    public class BaseResponse<T>
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public T? Data { get; set; }
    }

    // --- DATA CLASSES TRẢ VỀ CHO FRONTEND ---
    public class StartInterviewData
    {
        public Guid SessionId { get; set; }
        public string? FirstQuestion { get; set; }
        public string? FirstQuestionEn { get; set; }
        public List<QuestionItem> Script { get; set; } = new();
    }

    public class ChatResponseData
    {
        public string Response { get; set; } = string.Empty;
        public string Feedback { get; set; } = string.Empty;
        public string NextQuestionEn { get; set; } = string.Empty;
    }

    public class EndSessionData
    {
        public AiEvaluationResponse Evaluation { get; set; } = new();
        public Services.FillerWordAnalysisResult Analytics { get; set; } = new();
    }

    public class ResumeSessionData
    {
        public Guid SessionId { get; set; }
        public string JobTitle { get; set; } = string.Empty;
        public bool IsCompleted { get; set; }
        public List<MessageDto> Messages { get; set; } = new();
    }

    // --- SUB-CLASSES DÙNG CHUNG ---
    public class QuestionItem
    {
        public string vi { get; set; } = null!;
        public string en { get; set; } = null!;
    }

    public class AiEvaluationResponse
    {
        public int overallScore { get; set; }
        public string generalComment { get; set; } = string.Empty;
        public List<AiCriterion> criteria { get; set; } = new();
    }

    public class AiCriterion
    {
        public string name { get; set; } = string.Empty;
        public int score { get; set; }
        public string comment { get; set; } = string.Empty;
    }

    public class GeminiChatResponse
    {
        public string feedback { get; set; } = null!;
        public string nextQuestion { get; set; } = null!;
        public string nextQuestionEn { get; set; } = null!;
    }

    public class HintRequest
    {
        public Guid SessionId { get; set; }
        public string CurrentQuestion { get; set; } = null!;
    }
}