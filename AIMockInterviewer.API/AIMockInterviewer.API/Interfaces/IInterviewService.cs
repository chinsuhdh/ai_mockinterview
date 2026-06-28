using AIMockInterviewer.API.DTOs;
using System;
using System.Threading.Tasks;

namespace AIMockInterviewer.API.Interfaces
{
    public interface IInterviewService
    {
        Task<BaseResponse<StartInterviewData>> StartSessionAsync(Guid userId, StartInterviewRequest request);
        Task<BaseResponse<ChatResponseData>> ChatAsync(Guid userId, ChatRequest request);
        Task<BaseResponse<EndSessionData>> EndSessionAsync(Guid userId, Guid sessionId);
        Task<BaseResponse<ResumeSessionData>> ResumeSessionAsync(Guid userId, Guid sessionId);
    }
}