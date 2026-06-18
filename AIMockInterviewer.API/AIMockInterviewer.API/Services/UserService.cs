using AIMockInterviewer.API.DTOs;
using AIMockInterviewer.API.Interfaces;
using AIMockInterviewer.API.Models;
using Microsoft.EntityFrameworkCore;

namespace AIMockInterviewer.API.Services
{
    public class UserService : IUserService
    {
        private readonly AppDbContext _context;

        public UserService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<UserProfileResponse?> GetProfileAsync(Guid userId)
        {
            var user = await _context.Users
                .Include(u => u.UserProfile)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null) return null;

            // Kiểm tra gói cước hiện tại từ bảng Subscriptions
            var activeSub = await _context.UserSubscriptions
                .Include(s => s.Plan)
                .Where(s => s.UserId == userId && s.Status == "Active" && s.EndDate > DateTime.UtcNow)
                .OrderByDescending(s => s.EndDate)
                .FirstOrDefaultAsync();

            // Nếu có gói đang Active thì lấy tên gói, ngược lại mặc định là "Free"
            string currentPlan = (activeSub != null && activeSub.Plan != null)
                ? activeSub.Plan.PlanName
                : "Free";

            // Đếm số lần phỏng vấn trong tháng
            var currentMonth = DateTime.UtcNow.Month;
            var currentYear = DateTime.UtcNow.Year;
            var sessionsThisMonth = await _context.InterviewSessions
                .CountAsync(s => s.UserId == userId && s.StartedAt.HasValue && s.StartedAt.Value.Month == currentMonth && s.StartedAt.Value.Year == currentYear);

            return new UserProfileResponse
            {
                Email = user.Email ?? string.Empty,
                FullName = user.UserProfile?.FullName ?? string.Empty,
                University = user.UserProfile?.University,
                Major = user.UserProfile?.Major,
                CurrentPlan = currentPlan,
                InterviewsDoneThisMonth = sessionsThisMonth
            };
        }

        public async Task<bool> UpdateProfileAsync(Guid userId, UpdateProfileRequest request)
        {
            var profile = await _context.UserProfiles.FirstOrDefaultAsync(p => p.UserId == userId);
            if (profile == null) return false;

            profile.FullName = request.FullName;
            profile.University = request.University;
            profile.Major = request.Major;
            profile.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<object> ChangePasswordAsync(Guid userId, ChangePasswordRequest request)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return new { Success = false, Message = "Tài khoản không tồn tại." };

            // Đã đổi request.OldPassword thành request.CurrentPassword
            if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
                return new { Success = false, Message = "Mật khẩu cũ không chính xác." };

            // Mã hóa mật khẩu mới và lưu
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);

            // Xóa luôn cờ ép đổi mật khẩu (nếu có)
            user.IsActive = true;

            await _context.SaveChangesAsync();

            return new { Success = true, Message = "Đổi mật khẩu thành công." };
        }

        public async Task<List<InterviewHistoryResponse>> GetInterviewHistoryAsync(Guid userId)
        {
            var history = await _context.InterviewSessions
                .Include(s => s.JobDescription)
                .Include(s => s.InterviewFeedback)
                .Where(s => s.UserId == userId)
                .OrderByDescending(s => s.StartedAt) // Xếp mới nhất lên đầu
                .Select(s => new InterviewHistoryResponse
                {
                    SessionId = s.Id,
                    JobTitle = s.JobDescription != null ? s.JobDescription.Title : string.Empty,
                    StartedAt = s.StartedAt,
                    Status = s.Status ?? string.Empty,
                    OverallScore = s.InterviewFeedback != null ? s.InterviewFeedback.OverallScore : null
                })
                .ToListAsync();

            return history;
        }

        public async Task<InterviewDetailResponse?> GetInterviewDetailAsync(Guid userId, Guid sessionId)
        {
            var session = await _context.InterviewSessions
                .Include(s => s.JobDescription)
                .Include(s => s.InterviewFeedback)
                    .ThenInclude(f => f.FeedbackCriteria)
                .Include(s => s.InterviewMessages)
                .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId);

            if (session == null) return null;

            return new InterviewDetailResponse
            {
                SessionId = session.Id,
                JobTitle = session.JobDescription?.Title ?? string.Empty,
                StartedAt = session.StartedAt,
                EndedAt = session.EndedAt,
                Status = session.Status ?? string.Empty,
                OverallScore = session.InterviewFeedback?.OverallScore,
                GeneralComment = session.InterviewFeedback?.GeneralComment,

                Criteria = session.InterviewFeedback?.FeedbackCriteria?.Select(c => new CriterionDto
                {
                    Name = c.CriteriaName ?? string.Empty,
                    Score = c.Score ?? 0,
                    Comment = c.Comment ?? string.Empty
                }).ToList() ?? new List<CriterionDto>(),

                Messages = session.InterviewMessages?
                    .Where(m => m.SenderRole != "System")
                    .OrderBy(m => m.CreatedAt)
                    .Select(m => new MessageDto
                    {
                        Sender = m.SenderRole ?? string.Empty,
                        Content = m.MessageContent ?? string.Empty,
                        Timestamp = m.CreatedAt
                    }).ToList() ?? new List<MessageDto>()
            };
        }

        public async Task<object> GetUserDashboardStatsAsync(Guid userId)
        {
            var sixMonthsAgo = DateTime.UtcNow.AddMonths(-6);
            var sessions = await _context.InterviewSessions
                .Include(s => s.InterviewFeedback)
                    .ThenInclude(f => f.FeedbackCriteria)
                .Where(s => s.UserId == userId && s.Status == "Completed" && s.StartedAt >= sixMonthsAgo)
                .OrderBy(s => s.StartedAt)
                .ToListAsync();

            var monthlyStats = sessions
                .Where(s => s.StartedAt.HasValue)
                .GroupBy(s => new { Year = s.StartedAt!.Value.Year, Month = s.StartedAt!.Value.Month })
                .Select(g =>
                {
                    var allCriteria = g.SelectMany(s => s.InterviewFeedback?.FeedbackCriteria ?? new List<FeedbackCriterion>());

                    var criteriaAverages = allCriteria
                        .Where(c => !string.IsNullOrEmpty(c.CriteriaName))
                        .GroupBy(c => c.CriteriaName!)
                        .ToDictionary(
                            cg => cg.Key,
                            cg => Math.Round(cg.Average(c => (double?)c.Score) ?? 0.0, 1)
                        );

                    return new
                    {
                        month = $"{g.Key.Month:D2}/{g.Key.Year}",
                        averageScore = Math.Round(g.Average(s => (double?)s.InterviewFeedback?.OverallScore) ?? 0.0, 1),
                        criteria = criteriaAverages
                    };
                })
                .ToList();

            return new { Success = true, Data = monthlyStats };
        }

        public async Task<object> GetSkillGapStatsAsync(Guid userId, Guid jobDescriptionId)
        {
            var sessions = await _context.InterviewSessions
                .Include(s => s.InterviewFeedback)
                    .ThenInclude(f => f.FeedbackCriteria)
                .Where(s => s.UserId == userId
                         && s.JobDescriptionId == jobDescriptionId
                         && s.Status == "Completed"
                         && s.InterviewFeedback != null)
                .ToListAsync();

            if (!sessions.Any())
            {
                return new { Success = false, Message = "Chưa có dữ liệu phỏng vấn hoàn tất cho công việc này." };
            }

            var allCriteria = sessions.SelectMany(s => s.InterviewFeedback!.FeedbackCriteria);

            var radarData = allCriteria
                .Where(c => !string.IsNullOrEmpty(c.CriteriaName))
                .GroupBy(c => c.CriteriaName!)
                .Select(g => new RadarPointDto
                {
                    Subject = g.Key,
                    Score = Math.Round(g.Average(c => (double?)c.Score) ?? 0.0, 1),
                    FullMark = 100
                })
                .ToList();

            var averageOverall = Math.Round(sessions.Average(s => (double?)s.InterviewFeedback!.OverallScore) ?? 0.0, 1);

            var result = new SkillGapRadarResponse
            {
                JobDescriptionId = jobDescriptionId,
                TotalSessions = sessions.Count,
                AverageOverallScore = averageOverall,
                RadarData = radarData
            };

            return new { Success = true, Data = result };
        }
    }
}