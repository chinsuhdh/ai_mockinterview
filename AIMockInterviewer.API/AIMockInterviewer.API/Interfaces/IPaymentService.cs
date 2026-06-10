using AIMockInterviewer.API.DTOs;
using PayOS.Models.Webhooks;

namespace AIMockInterviewer.API.Interfaces
{
    public interface IPaymentService
    {
        // Thêm string? returnUrl vào signature
        Task<string> CreatePaymentLinkAsync(Guid userId, Guid planId, string? returnUrl);
        Task<bool> HandleWebhookAsync(Webhook webhookBody);
        Task<List<SubscriptionPlanDto>> GetSubscriptionPlansAsync();
    }
}