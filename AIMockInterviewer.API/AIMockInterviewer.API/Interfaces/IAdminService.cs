using AIMockInterviewer.API.DTOs;

namespace AIMockInterviewer.API.Interfaces
{
    public interface IAdminService
    {
        Task<DashboardStatsResponse> GetDashboardStatsAsync();
        Task<List<UserManageResponse>> GetAllUsersAsync();
        Task<bool> ToggleUserStatusAsync(Guid userId);

        Task<List<SubscriptionPlanResponse>> GetAllPlansAsync();
        Task<SubscriptionPlanResponse?> GetPlanByIdAsync(Guid id);
        Task<SubscriptionPlanResponse> CreatePlanAsync(SubscriptionPlanRequest request);
        Task<bool> UpdatePlanAsync(Guid id, SubscriptionPlanRequest request);
        Task<bool> DeletePlanAsync(Guid id);

        Task<List<InterviewManageResponse>> GetAllInterviewsAsync();
        Task<List<TransactionManageResponse>> GetAllTransactionsAsync();
    }
}