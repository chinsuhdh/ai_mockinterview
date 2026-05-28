using AIMockInterviewer.API.DTOs;
using AIMockInterviewer.API.Interfaces;
using AIMockInterviewer.API.Models;
using Microsoft.EntityFrameworkCore;

namespace AIMockInterviewer.API.Services
{
    public class AdminService : IAdminService
    {
        private readonly AppDbContext _context;

        public AdminService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<DashboardStatsResponse> GetDashboardStatsAsync()
        {
            var currentMonth = DateTime.UtcNow.Month;
            var currentYear = DateTime.UtcNow.Year;

            var totalUsers = await _context.Users.CountAsync();
            var totalInterviews = await _context.InterviewSessions.CountAsync();

            var totalRevenue = await _context.Transactions
                .Where(t => t.Status == "Success" && t.CreatedAt != null
                         && t.CreatedAt.Value.Month == currentMonth
                         && t.CreatedAt.Value.Year == currentYear)
                .SumAsync(t => (decimal?)t.Amount);

            var activePremium = await _context.UserSubscriptions
                .CountAsync(s => s.Status == "Active" && s.EndDate > DateTime.UtcNow);

            return new DashboardStatsResponse
            {
                TotalUsers = totalUsers,
                TotalInterviews = totalInterviews,
                TotalRevenueThisMonth = totalRevenue ?? 0m,
                ActivePremiumUsers = activePremium
            };
        }

        public async Task<List<UserManageResponse>> GetAllUsersAsync()
        {
            return await _context.Users
                .Include(u => u.UserProfile)
                .Select(u => new UserManageResponse
                {
                    Id = u.Id,
                    Email = u.Email,
                    FullName = u.UserProfile != null ? u.UserProfile.FullName : "N/A",
                    IsActive = u.IsActive ?? false,
                    CreatedAt = u.CreatedAt
                })
                .OrderByDescending(u => u.CreatedAt)
                .ToListAsync();
        }

        public async Task<bool> ToggleUserStatusAsync(Guid userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return false;

            user.IsActive = !user.IsActive;
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<List<SubscriptionPlanResponse>> GetAllPlansAsync()
        {
            return await _context.SubscriptionPlans
                .Select(p => new SubscriptionPlanResponse
                {
                    Id = p.Id,
                    PlanName = p.PlanName,
                    Price = p.Price,
                    Description = p.Description,
                    MaxInterviewsPerMonth = p.MaxInterviewsPerMonth
                })
                .OrderBy(p => p.Price)
                .ToListAsync();
        }

        public async Task<SubscriptionPlanResponse?> GetPlanByIdAsync(Guid id)
        {
            var plan = await _context.SubscriptionPlans.FindAsync(id);
            if (plan == null) return null;

            return new SubscriptionPlanResponse
            {
                Id = plan.Id,
                PlanName = plan.PlanName,
                Price = plan.Price,
                Description = plan.Description,
                MaxInterviewsPerMonth = plan.MaxInterviewsPerMonth
            };
        }

        public async Task<SubscriptionPlanResponse> CreatePlanAsync(SubscriptionPlanRequest request)
        {
            var plan = new SubscriptionPlan
            {
                PlanName = request.PlanName,
                Price = request.Price,
                Description = request.Description,
                MaxInterviewsPerMonth = request.MaxInterviewsPerMonth
            };

            _context.SubscriptionPlans.Add(plan);
            await _context.SaveChangesAsync();

            return new SubscriptionPlanResponse
            {
                Id = plan.Id,
                PlanName = plan.PlanName,
                Price = plan.Price,
                Description = plan.Description,
                MaxInterviewsPerMonth = plan.MaxInterviewsPerMonth
            };
        }

        public async Task<bool> UpdatePlanAsync(Guid id, SubscriptionPlanRequest request)
        {
            var plan = await _context.SubscriptionPlans.FindAsync(id);
            if (plan == null) return false;

            plan.PlanName = request.PlanName;
            plan.Price = request.Price;
            plan.Description = request.Description;
            plan.MaxInterviewsPerMonth = request.MaxInterviewsPerMonth;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeletePlanAsync(Guid id)
        {
            var plan = await _context.SubscriptionPlans.FindAsync(id);
            if (plan == null) return false;

            var isPlanInUse = await _context.UserSubscriptions.AnyAsync(s => s.PlanId == id);
            if (isPlanInUse)
            {
                throw new InvalidOperationException("Không thể xóa gói cước đang có người sử dụng.");
            }

            _context.SubscriptionPlans.Remove(plan);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<InterviewManageResponse>> GetAllInterviewsAsync()
        {
            return await _context.InterviewSessions
                .Include(i => i.User)
                    .ThenInclude(u => u.UserProfile)
                .Include(i => i.JobDescription)
                .Include(i => i.InterviewFeedback)
                .Select(i => new InterviewManageResponse
                {
                    Id = i.Id,

                    UserFullName = i.User != null && i.User.UserProfile != null
                        ? i.User.UserProfile.FullName
                        : "N/A",

                    UserEmail = i.User != null
                        ? i.User.Email
                        : "N/A",

                    JobTitle = i.JobDescription != null
                        ? i.JobDescription.Title
                        : "Phiên phỏng vấn",

                    Score = i.InterviewFeedback != null
                        ? i.InterviewFeedback.OverallScore
                        : 0,

                    CreatedAt = i.StartedAt ?? DateTime.UtcNow,

                    Status = i.Status ?? "In-Progress"
                })
                .OrderByDescending(i => i.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<TransactionManageResponse>> GetAllTransactionsAsync()
        {
            return await _context.Transactions
                .Include(t => t.User)
                .Select(t => new TransactionManageResponse
                {
                    Id = t.Id,
                    InvoiceNo = "INV-" + t.Id.ToString().Substring(0, 8).ToUpper(),
                    UserEmail = t.User != null ? t.User.Email : "N/A",
                    PlanName = "Gói trả phí",
                    Amount = t.Amount,
                    CreatedAt = t.CreatedAt ?? DateTime.UtcNow,
                    Status = t.Status ?? "Success"
                })
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<InterviewMessageResponse>> GetInterviewMessagesAsync(Guid sessionId)
        {
            return await _context.InterviewMessages
                .Where(m => m.InterviewSessionId == sessionId)
                .OrderBy(m => m.CreatedAt)
                .Select(m => new InterviewMessageResponse
                {
                    Id = m.Id,
                    SenderRole = m.SenderRole, 
                    MessageContent = m.MessageContent,
                    CreatedAt = m.CreatedAt
                })
                .ToListAsync();
        }
    }
}