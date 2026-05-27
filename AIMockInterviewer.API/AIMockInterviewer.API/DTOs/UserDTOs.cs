namespace AIMockInterviewer.API.DTOs
{
    public class UserProfileResponse
    {
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? University { get; set; }
        public string? Major { get; set; }
        public string CurrentPlan { get; set; } = "Free";
        public int InterviewsDoneThisMonth { get; set; }
    }

    public class UpdateProfileRequest
    {
        public string FullName { get; set; } = null!;
        public string? University { get; set; }
        public string? Major { get; set; }
    }

    public class ChangePasswordRequest
    {
        public string OldPassword { get; set; } = null!;
        public string NewPassword { get; set; } = null!;
    }

    public class InterviewHistoryResponse
    {
        public Guid SessionId { get; set; }
        public string JobTitle { get; set; } = string.Empty;
        public DateTime? StartedAt { get; set; }
        public string Status { get; set; } = string.Empty;
        public int? OverallScore { get; set; }
    }

    public class InterviewDetailResponse
    {
        public Guid SessionId { get; set; }
        public string JobTitle { get; set; } = string.Empty;
        public DateTime? StartedAt { get; set; }
        public DateTime? EndedAt { get; set; }
        public string Status { get; set; } = string.Empty;

        // Điểm và nhận xét tổng quan
        public int? OverallScore { get; set; }
        public string? GeneralComment { get; set; }

        // Danh sách tiêu chí
        public List<CriterionDto> Criteria { get; set; } = new List<CriterionDto>();

        // Lịch sử chat
        public List<MessageDto> Messages { get; set; } = new List<MessageDto>();
    }

    public class CriterionDto
    {
        public string Name { get; set; } = string.Empty;
        public int Score { get; set; }
        public string Comment { get; set; } = string.Empty;
    }

    public class MessageDto
    {
        public string Sender { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public DateTime? Timestamp { get; set; }
    }
}