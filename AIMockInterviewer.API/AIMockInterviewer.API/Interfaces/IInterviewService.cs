using AIMockInterviewer.API.DTOs;

namespace AIMockInterviewer.API.Interfaces
{
    public interface IInterviewService
    {
        Task<object> StartSessionAsync(Guid userId, StartInterviewRequest request);
        Task<object> ChatAsync(Guid userId, ChatRequest request);

        Task<object> EndSessionAsync(Guid userId, Guid sessionId);

        Task<object> ResumeSessionAsync(Guid userId, Guid sessionId);
    }
}