using AIMockInterviewer.API.DTOs;
using AIMockInterviewer.API.Interfaces;
using AIMockInterviewer.API.Models;
using Microsoft.EntityFrameworkCore;
using PayOS;
using PayOS.Models;
using PayOS.Models.V2.PaymentRequests;
using PayOS.Models.Webhooks;

namespace AIMockInterviewer.API.Services
{
    public class PayOsService : IPaymentService
    {
        private readonly PayOSClient _payOs;
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;
        private readonly IEmailService _emailService;

        public PayOsService(AppDbContext context, IConfiguration config, IEmailService emailService)
        {
            _context = context;
            _config = config;
            _emailService = emailService;

            _payOs = new PayOSClient(
                _config["PayOS:ClientId"]!,
                _config["PayOS:ApiKey"]!,
                _config["PayOS:ChecksumKey"]!
            );
        }

        public async Task<string> CreatePaymentLinkAsync(Guid userId, Guid planId, string? returnUrl)
        {
            var user = await _context.Users.FindAsync(userId) ?? throw new Exception("User không tồn tại.");
            var selectedPlan = await _context.SubscriptionPlans.FindAsync(planId)
                              ?? throw new Exception("Gói cước không tồn tại trong hệ thống.");

            long orderCode = long.Parse(DateTimeOffset.Now.ToString("yyMMddHHmmssfff"));

            // Khởi tạo Transaction...
            var transaction = new Transaction
            {
                UserId = userId,
                PlanId = planId,
                Amount = selectedPlan.Price,
                PaymentMethod = "PayOS",
                ExternalTransactionId = orderCode.ToString(),
                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };

            _context.Transactions.Add(transaction);
            await _context.SaveChangesAsync();

            // XỬ LÝ URL ĐỘNG:
            // Lấy URL thành công từ Frontend, nếu null thì lấy từ appsettings
            string finalReturnUrl = !string.IsNullOrEmpty(returnUrl)
                ? returnUrl
                : _config["PayOS:ReturnUrl"]!;

            // Đối với CancelUrl, ta có thể linh hoạt thay đuôi của returnUrl 
            // (từ /dashboard thành /payment-cancel) hoặc lấy từ appsettings
            string finalCancelUrl = !string.IsNullOrEmpty(returnUrl)
                ? returnUrl.Replace("/dashboard", "/payment-cancel")
                : _config["PayOS:CancelUrl"]!;

            var paymentRequest = new CreatePaymentLinkRequest
            {
                OrderCode = orderCode,
                Amount = (int)selectedPlan.Price,
                Description = $"Nang cap {selectedPlan.PlanName}",
                CancelUrl = finalCancelUrl, // Sử dụng URL đã xử lý
                ReturnUrl = finalReturnUrl  // Sử dụng URL đã xử lý
            };

            var paymentLink = await _payOs.PaymentRequests.CreateAsync(paymentRequest);
            return paymentLink.CheckoutUrl;
        }

        public async Task<bool> HandleWebhookAsync(Webhook webhookBody)
        {
            try
            {
                WebhookData verifiedData = await _payOs.Webhooks.VerifyAsync(webhookBody);

                if (webhookBody.Code == "00" || webhookBody.Success)
                {
                    string orderCodeStr = verifiedData.OrderCode.ToString();

                    // Tìm Transaction kèm theo thông tin User
                    var transaction = await _context.Transactions
                        .Include(t => t.User)
                        .FirstOrDefaultAsync(t => t.ExternalTransactionId == orderCodeStr && t.Status == "Pending");

                    if (transaction != null)
                    {
                        transaction.Status = "Success";

                        // SỬ DỤNG TRỰC TIẾP PLAN ID TỪ TRANSACTION
                        SubscriptionPlan? purchasedPlan = null;
                        if (transaction.PlanId.HasValue)
                        {
                            purchasedPlan = await _context.SubscriptionPlans.FindAsync(transaction.PlanId.Value);
                        }

                        if (purchasedPlan != null)
                        {
                            var existingSub = await _context.UserSubscriptions
                                .FirstOrDefaultAsync(s => s.UserId == transaction.UserId);

                            if (existingSub != null)
                            {
                                existingSub.PlanId = purchasedPlan.Id;
                                existingSub.Status = "Active";
                                existingSub.StartDate = DateTime.UtcNow;
                                existingSub.EndDate = DateTime.UtcNow.AddMonths(1);
                                existingSub.InterviewsUsedThisMonth = 0;
                            }
                            else
                            {
                                _context.UserSubscriptions.Add(new UserSubscription
                                {
                                    UserId = transaction.UserId,
                                    PlanId = purchasedPlan.Id,
                                    Status = "Active",
                                    StartDate = DateTime.UtcNow,
                                    EndDate = DateTime.UtcNow.AddMonths(1)
                                });
                            }
                        }

                        await _context.SaveChangesAsync();

                        // Gửi email xác nhận đã được cô lập bằng try-catch
                        if (transaction.User != null && !string.IsNullOrEmpty(transaction.User.Email) && purchasedPlan != null)
                        {
                            try
                            {
                                string subject = $"🎉 Nâng cấp {purchasedPlan.PlanName} Thành Công - AI Mock Interviewer";
                                string body = $@"
                                    <h2>Cảm ơn bạn đã tin tưởng hệ thống!</h2>
                                    <p>Giao dịch trị giá <strong>{transaction.Amount:N0} VNĐ</strong> đã được xác nhận.</p>
                                    <p>Tài khoản <b>{transaction.User.Email}</b> của bạn đã được nâng cấp lên gói <strong>{purchasedPlan.PlanName}</strong>.</p>
                                    <p>Chúc bạn có những buổi luyện tập phỏng vấn thật hiệu quả và sớm nhận được Offer như ý nhé!</p>";

                                await _emailService.SendEmailAsync(transaction.User.Email, subject, body);
                            }
                            catch (Exception emailEx)
                            {
                                // Log lỗi ra console để debug, PayOS vẫn nhận được kết quả true (giao dịch thành công)
                                Console.WriteLine($"Webhook - Lỗi gửi email xác nhận: {emailEx.Message}");
                            }
                        }

                        return true;
                    }
                }
                return false;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Webhook Error: {ex.Message}");
                return false;
            }
        }

        public async Task<List<SubscriptionPlanDto>> GetSubscriptionPlansAsync()
        {
            var plans = await _context.SubscriptionPlans
                .OrderBy(p => p.Price)
                .ToListAsync();

            var planDtos = plans.Select(p => new SubscriptionPlanDto
            {
                Id = p.Id,
                Name = p.PlanName,
                Price = p.Price,
                MaxInterviewsPerMonth = p.MaxInterviewsPerMonth,
                Description = p.Description,
                Features = p.Description
                    .Split(new[] { '.', ';' }, StringSplitOptions.RemoveEmptyEntries)
                    .Select(f => f.Trim())
                    .Where(f => !string.IsNullOrEmpty(f))
                    .ToList(),
                IsHighlight = p.PlanName.ToLower() == "premium"
            }).ToList();

            return planDtos;
        }
    }
}