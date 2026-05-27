using AIMockInterviewer.API.DTOs;

namespace AIMockInterviewer.API.Interfaces
{
    public interface IUserService
    {
        Task<UserProfileResponse?> GetProfileAsync(Guid userId);
        Task<bool> UpdateProfileAsync(Guid userId, UpdateProfileRequest request);
        Task<object> ChangePasswordAsync(Guid userId, ChangePasswordRequest request);
        Task<List<InterviewHistoryResponse>> GetInterviewHistoryAsync(Guid userId);

        Task<InterviewDetailResponse?> GetInterviewDetailAsync(Guid userId, Guid sessionId);
    }
}