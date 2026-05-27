using AIMockInterviewer.API.Helpers;
using AIMockInterviewer.API.Interfaces;
using AIMockInterviewer.API.Models;
using Microsoft.EntityFrameworkCore;

namespace AIMockInterviewer.API.Services
{
    public class VnPayService
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;
        private readonly IEmailService _emailService;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public VnPayService(AppDbContext context, IConfiguration config, IEmailService emailService, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _config = config;
            _emailService = emailService;
            _httpContextAccessor = httpContextAccessor;
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
                PaymentMethod = "VNPay",
                ExternalTransactionId = orderCode.ToString(),
                Status = "Pending"
            };
            _context.Transactions.Add(transaction);
            await _context.SaveChangesAsync();

            string vnp_Returnurl = _config["VNPay:ReturnUrl"]!;
            string vnp_Url = _config["VNPay:BaseUrl"]!;
            string vnp_TmnCode = _config["VNPay:TmnCode"]!;
            string vnp_HashSecret = _config["VNPay:HashSecret"]!;

            var ipAddr = _httpContextAccessor.HttpContext?.Connection?.RemoteIpAddress?.ToString() ?? "127.0.0.1";

            VnPayLibrary vnpay = new VnPayLibrary();
            vnpay.AddRequestData("vnp_Version", "2.1.0");
            vnpay.AddRequestData("vnp_Command", "pay");
            vnpay.AddRequestData("vnp_TmnCode", vnp_TmnCode);
            vnpay.AddRequestData("vnp_Amount", ((int)premiumPlan.Price * 100).ToString());
            vnpay.AddRequestData("vnp_CreateDate", DateTime.Now.ToString("yyyyMMddHHmmss"));
            vnpay.AddRequestData("vnp_CurrCode", "VND");
            vnpay.AddRequestData("vnp_IpAddr", ipAddr);
            vnpay.AddRequestData("vnp_Locale", "vn");
            vnpay.AddRequestData("vnp_OrderInfo", "Nang cap Premium qua VNPay");
            vnpay.AddRequestData("vnp_OrderType", "other");
            vnpay.AddRequestData("vnp_ReturnUrl", vnp_Returnurl);
            vnpay.AddRequestData("vnp_TxnRef", orderCode.ToString());

            return vnpay.CreateRequestUrl(vnp_Url, vnp_HashSecret);
        }

        public async Task<string> HandleIpnAsync(IQueryCollection query)
        {
            string vnp_HashSecret = _config["VNPay:HashSecret"]!;
            VnPayLibrary vnpay = new VnPayLibrary();

            foreach (var (key, value) in query)
            {
                if (!string.IsNullOrEmpty(key) && key.StartsWith("vnp_"))
                {
                    vnpay.AddResponseData(key, value.ToString());
                }
            }

            string orderCodeStr = vnpay.GetResponseData("vnp_TxnRef");
            string vnp_SecureHash = query["vnp_SecureHash"].ToString();
            string vnp_ResponseCode = vnpay.GetResponseData("vnp_ResponseCode");

            bool checkSignature = vnpay.ValidateSignature(vnp_SecureHash, vnp_HashSecret);
            if (!checkSignature) return "{\"RspCode\":\"97\",\"Message\":\"Invalid signature\"}";

            var transaction = await _context.Transactions
                .Include(t => t.User)
                .FirstOrDefaultAsync(t => t.ExternalTransactionId == orderCodeStr && t.PaymentMethod == "VNPay");

            if (transaction == null) return "{\"RspCode\":\"01\",\"Message\":\"Order not found\"}";
            if (transaction.Status == "Success") return "{\"RspCode\":\"02\",\"Message\":\"Order already confirmed\"}";

            long vnpAmount = Convert.ToInt64(vnpay.GetResponseData("vnp_Amount")) / 100;
            if (vnpAmount != (long)transaction.Amount) return "{\"RspCode\":\"04\",\"Message\":\"Invalid amount\"}";

            if (vnp_ResponseCode == "00")
            {
                transaction.Status = "Success";
                var premiumPlan = await _context.SubscriptionPlans.FirstOrDefaultAsync(p => p.PlanName == "Premium");
                var existingSub = await _context.UserSubscriptions.FirstOrDefaultAsync(s => s.UserId == transaction.UserId);

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

                if (transaction.User != null && !string.IsNullOrEmpty(transaction.User.Email))
                {
                    string subject = "🎉 Nâng cấp Premium Thành Công qua VNPay - AI Mock Interviewer";
                    string body = $@"
                        <h2>Cảm ơn bạn đã tin tưởng hệ thống!</h2>
                        <p>Giao dịch trị giá <strong>{transaction.Amount:N0} VNĐ</strong> đã được thanh toán thành công.</p>
                        <p>Tài khoản <b>{transaction.User.Email}</b> của bạn đã được nâng cấp lên gói <strong>{premiumPlan?.PlanName}</strong>.</p>
                        <p>Chúc bạn có những buổi luyện tập phỏng vấn thật hiệu quả!</p>";

                    await _emailService.SendEmailAsync(transaction.User.Email, subject, body);
                }
            }
            else
            {
                transaction.Status = "Failed";
                await _context.SaveChangesAsync();
            }

            return "{\"RspCode\":\"00\",\"Message\":\"Confirm Success\"}";
        }
    }
}