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
        private readonly VnPayService _vnPayService;      // VNPay Service

        public PaymentController(IPaymentService paymentService, VnPayService vnPayService)
        {
            _paymentService = paymentService;
            _vnPayService = vnPayService;
        }

        // ================= PAYOS ENDPOINTS =================

        [Authorize]
        [HttpPost("create-link")] // PayOS Link
        public async Task<IActionResult> CreatePaymentLink()
        {
            try
            {
                var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var userId = Guid.Parse(userIdStr!);

                string checkoutUrl = await _paymentService.CreatePaymentLinkAsync(userId);
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


        // ================= VNPAY ENDPOINTS =================

        [Authorize]
        [HttpPost("create-vnpay-link")] // VNPay Link
        public async Task<IActionResult> CreateVnPayLink()
        {
            try
            {
                var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var userId = Guid.Parse(userIdStr!);

                string checkoutUrl = await _vnPayService.CreatePaymentLinkAsync(userId);
                return Ok(new { Success = true, CheckoutUrl = checkoutUrl });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Success = false, Message = ex.Message });
            }
        }

        [HttpGet("vnpay-ipn")]
        [AllowAnonymous]
        public async Task<IActionResult> VnPayIpn()
        {
            try
            {
                var response = await _vnPayService.HandleIpnAsync(Request.Query);
                return Content(response, "application/json");
            }
            catch (Exception)
            {
                return Content("{\"RspCode\":\"99\",\"Message\":\"Unknown error\"}", "application/json");
            }
        }

        [HttpGet("vnpay-return")]
        [AllowAnonymous]
        public IActionResult VnPayReturn()
        {
            string vnp_ResponseCode = Request.Query["vnp_ResponseCode"].ToString();

            // Lấy URL config từ IConfiguration (bạn có thể hardcode hoặc lấy từ DI nếu muốn)
            // Tạm thời redirect cứng về cổng 3000 giống config của bạn
            if (vnp_ResponseCode == "00")
            {
                return Redirect("http://localhost:3000/payment-success");
            }
            return Redirect("http://localhost:3000/payment-cancel");
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