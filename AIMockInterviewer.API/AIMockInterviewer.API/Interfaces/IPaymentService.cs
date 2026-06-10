using AIMockInterviewer.API.DTOs;
using PayOS.Models.Webhooks;

namespace AIMockInterviewer.API.Interfaces
{
    public interface IPaymentService
    {
        // Thêm tham số cancelUrl
        Task<string> CreatePaymentLinkAsync(Guid userId, Guid planId, string? returnUrl, string? cancelUrl);
        Task<bool> HandleWebhookAsync(Webhook webhookBody);
        Task<List<SubscriptionPlanDto>> GetSubscriptionPlansAsync();
    }
}