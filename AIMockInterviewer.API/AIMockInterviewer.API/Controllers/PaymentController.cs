using AIMockInterviewer.API.DTOs;
using AIMockInterviewer.API.Interfaces;
using AIMockInterviewer.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PayOS.Models.Webhooks;
using System.Security.Claims;

namespace AIMockInterviewer.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentController : ControllerBase
    {
        private readonly IPaymentService _paymentService; // PayOS Service

        public PaymentController(IPaymentService paymentService)
        {
            _paymentService = paymentService;
        }

        // ================= PAYOS ENDPOINTS =================

        [Authorize]
        [HttpPost("create-link")]
        public async Task<IActionResult> CreatePaymentLink([FromBody] CreatePaymentRequestDto request)
        {
            try
            {
                var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var userId = Guid.Parse(userIdStr!);

                // Truyền thêm request.ReturnUrl xuống Service
                string checkoutUrl = await _paymentService.CreatePaymentLinkAsync(userId, request.PlanId, request.ReturnUrl);
                return Ok(new { Success = true, CheckoutUrl = checkoutUrl });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Success = false, Message = ex.Message });
            }
        }

        [HttpPost("payos-webhook")]
        public async Task<IActionResult> PayOsWebhook([FromBody] Webhook webhookBody)
        {
            var result = await _paymentService.HandleWebhookAsync(webhookBody);
            return Ok(new
            {
                success = true,
                message = "Ok",
                data = result ? "Webhook handled successfully" : "Failed to handle webhook"
            });
        }
        // ================= SHARED ENDPOINTS =================

        [HttpGet("plans")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPlans()
        {
            var plans = await _paymentService.GetSubscriptionPlansAsync();
            return Ok(plans);
        }
    }
}