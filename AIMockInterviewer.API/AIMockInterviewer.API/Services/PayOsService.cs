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
        private readonly IEmailService _emailService; // Inject service gửi mail

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

        public async Task<string> CreatePaymentLinkAsync(Guid userId)
        {
            var user = await _context.Users.FindAsync(userId) ?? throw new Exception("User không tồn tại.");
            var premiumPlan = await _context.SubscriptionPlans.FirstOrDefaultAsync(p => p.PlanName == "Premium")
                              ?? throw new Exception("Chưa cấu hình gói Premium trong DB.");

            long orderCode = long.Parse(DateTimeOffset.Now.ToString("yyMMddHHmmssfff"));

            var transaction = new Transaction
            {
                UserId = userId,
                Amount = premiumPlan.Price,
                PaymentMethod = "PayOS",
                ExternalTransactionId = orderCode.ToString(),
                Status = "Pending"
            };
            _context.Transactions.Add(transaction);
            await _context.SaveChangesAsync();

            var paymentRequest = new CreatePaymentLinkRequest
            {
                OrderCode = orderCode,
                Amount = (int)premiumPlan.Price,
                Description = "Nang cap Premium",
                CancelUrl = _config["PayOS:CancelUrl"]!,
                ReturnUrl = _config["PayOS:ReturnUrl"]!
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

                    var transaction = await _context.Transactions
                        .Include(t => t.User) // Kèm theo User để lấy Email
                        .FirstOrDefaultAsync(t => t.ExternalTransactionId == orderCodeStr && t.Status == "Pending");

                    if (transaction != null)
                    {
                        transaction.Status = "Success";
                        var premiumPlan = await _context.SubscriptionPlans.FirstOrDefaultAsync(p => p.PlanName == "Premium");

                        var existingSub = await _context.UserSubscriptions
                            .FirstOrDefaultAsync(s => s.UserId == transaction.UserId);

                        if (existingSub != null)
                        {
                            existingSub.PlanId = premiumPlan!.Id;
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
                                PlanId = premiumPlan!.Id,
                                Status = "Active",
                                StartDate = DateTime.UtcNow,
                                EndDate = DateTime.UtcNow.AddMonths(1)
                            });
                        }

                        await _context.SaveChangesAsync();

                        // TIẾN HÀNH GỬI EMAIL CẢM ƠN
                        if (transaction.User != null && !string.IsNullOrEmpty(transaction.User.Email))
                        {
                            string subject = "🎉 Nâng cấp Premium Thành Công - AI Mock Interviewer";
                            string body = $@"
                                <h2>Cảm ơn bạn đã tin tưởng hệ thống!</h2>
                                <p>Giao dịch trị giá <strong>{transaction.Amount:N0} VNĐ</strong> đã được xác nhận.</p>
                                <p>Tài khoản <b>{transaction.User.Email}</b> của bạn đã được nâng cấp lên gói <strong>{premiumPlan?.PlanName}</strong>.</p>
                                <p>Chúc bạn có những buổi luyện tập phỏng vấn thật hiệu quả và sớm nhận được Offer như ý nhé!</p>";

                            await _emailService.SendEmailAsync(transaction.User.Email, subject, body);
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
                .OrderBy(p => p.Price) // Sắp xếp từ Free -> Basic -> Premium -> Ultra
                .ToListAsync();

            var planDtos = plans.Select(p => new SubscriptionPlanDto
            {
                Id = p.Id,
                Name = p.PlanName,
                Price = p.Price,
                MaxInterviewsPerMonth = p.MaxInterviewsPerMonth,
                Description = p.Description,
                // Tách chuỗi Description thành mảng Features dựa vào dấu "." 
                Features = p.Description
                    .Split(new[] { '.', ';' }, StringSplitOptions.RemoveEmptyEntries)
                    .Select(f => f.Trim())
                    .Where(f => !string.IsNullOrEmpty(f))
                    .ToList(),
                // Highlight gói Premium (99k) làm mồi nhử marketing
                IsHighlight = p.PlanName.ToLower() == "premium"
            }).ToList();

            return planDtos;
        }
    }
}