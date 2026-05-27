using AIMockInterviewer.API.DTOs;
using PayOS.Models.Webhooks;

namespace AIMockInterviewer.API.Interfaces
{
    public interface IPaymentService
    {
        Task<string> CreatePaymentLinkAsync(Guid userId);

        Task<bool> HandleWebhookAsync(Webhook webhookBody);
        Task<List<SubscriptionPlanDto>> GetSubscriptionPlansAsync();
    }
}