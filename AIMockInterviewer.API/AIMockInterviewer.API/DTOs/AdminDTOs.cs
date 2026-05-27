namespace AIMockInterviewer.API.DTOs
{
    public class DashboardStatsResponse
    {
        public int TotalUsers { get; set; }
        public int TotalInterviews { get; set; }
        public decimal TotalRevenueThisMonth { get; set; }
        public int ActivePremiumUsers { get; set; }
    }

    public class UserManageResponse
    {
        public Guid Id { get; set; }
        public string Email { get; set; } = null!;
        public string FullName { get; set; } = null!;
        public bool IsActive { get; set; }
        public DateTime? CreatedAt { get; set; }
    }

    public class SubscriptionPlanRequest
    {
        public string PlanName { get; set; } = null!;
        public decimal Price { get; set; }
        public string? Description { get; set; }
        public int MaxInterviewsPerMonth { get; set; }
    }

    public class SubscriptionPlanResponse
    {
        public Guid Id { get; set; }
        public string PlanName { get; set; } = null!;
        public decimal Price { get; set; }
        public string? Description { get; set; }
        public int MaxInterviewsPerMonth { get; set; }
    }

    public class InterviewManageResponse
    {
        public Guid Id { get; set; }
        public string UserFullName { get; set; } = null!;
        public string UserEmail { get; set; } = null!;
        public string JobTitle { get; set; } = null!;
        public int? Score { get; set; }
        public DateTime CreatedAt { get; set; }
        public string Status { get; set; } = null!;
    }

    public class TransactionManageResponse
    {
        public Guid Id { get; set; }
        public string InvoiceNo { get; set; } = null!;
        public string UserEmail { get; set; } = null!;
        public string PlanName { get; set; } = null!;
        public decimal Amount { get; set; }
        public DateTime CreatedAt { get; set; }
        public string Status { get; set; } = null!;
    }
}