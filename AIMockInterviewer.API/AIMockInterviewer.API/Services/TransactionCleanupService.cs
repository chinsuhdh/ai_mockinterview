using AIMockInterviewer.API.Models;
using Microsoft.EntityFrameworkCore;

namespace AIMockInterviewer.API.Services
{
    public class TransactionCleanupService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<TransactionCleanupService> _logger;

        // Bắt buộc phải inject IServiceProvider vì BackgroundService là Singleton,
        // trong khi AppDbContext là Scoped.
        public TransactionCleanupService(IServiceProvider serviceProvider, ILogger<TransactionCleanupService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            // Vòng lặp chạy liên tục cho đến khi ứng dụng bị tắt
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using (var scope = _serviceProvider.CreateScope())
                    {
                        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                        // Tính mốc thời gian: 30 phút trước so với hiện tại
                        var expiryTime = DateTime.UtcNow.AddMinutes(-30);

                        // Tìm các giao dịch "Pending" và tạo cách đây hơn 30 phút
                        var expiredTransactions = await context.Transactions
                            .Where(t => t.Status == "Pending" && t.CreatedAt <= expiryTime)
                            .ToListAsync(stoppingToken);

                        if (expiredTransactions.Any())
                        {
                            context.Transactions.RemoveRange(expiredTransactions);
                            await context.SaveChangesAsync(stoppingToken);

                            _logger.LogInformation($"Đã tự động xoá {expiredTransactions.Count} giao dịch Pending quá 30 phút.");
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Có lỗi xảy ra khi dọn dẹp giao dịch quá hạn.");
                }

                // Chờ 5 phút rồi mới chạy lại vòng lặp (tránh làm nặng Database)
                // Bạn có thể chỉnh lại thành 1 phút nếu muốn test nhanh
                await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
            }
        }
    }
}