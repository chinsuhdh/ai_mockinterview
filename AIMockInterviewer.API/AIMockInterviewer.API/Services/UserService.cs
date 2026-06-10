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

            // Kiểm tra gói cước hiện tại
            var activeSub = await _context.UserSubscriptions
                .Include(s => s.Plan)
                .FirstOrDefaultAsync(s => s.UserId == userId && s.Status == "Active" && s.EndDate > DateTime.UtcNow);

            // Đếm số lần phỏng vấn trong tháng
            var currentMonth = DateTime.UtcNow.Month;
            var currentYear = DateTime.UtcNow.Year;
            var sessionsThisMonth = await _context.InterviewSessions
                .CountAsync(s => s.UserId == userId && s.StartedAt.HasValue && s.StartedAt.Value.Month == currentMonth && s.StartedAt.Value.Year == currentYear);

            return new UserProfileResponse
            {
                Email = user.Email,
                FullName = user.UserProfile?.FullName ?? "",
                University = user.UserProfile?.University,
                Major = user.UserProfile?.Major,
                CurrentPlan = activeSub != null ? activeSub.Plan.PlanName : "Free",
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

            // Kiểm tra mật khẩu cũ
            if (!BCrypt.Net.BCrypt.Verify(request.OldPassword, user.PasswordHash))
                return new { Success = false, Message = "Mật khẩu cũ không chính xác." };

            // Mã hóa mật khẩu mới và lưu
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            await _context.SaveChangesAsync();

            return new { Success = true, Message = "Đổi mật khẩu thành công." };
        }

        public async Task<List<InterviewHistoryResponse>> GetInterviewHistoryAsync(Guid userId)
        {
            // Lấy danh sách phỏng vấn, join với JD và Feedback để lấy điểm số
            var history = await _context.InterviewSessions
                .Include(s => s.JobDescription)
                .Include(s => s.InterviewFeedback)
                .Where(s => s.UserId == userId)
                .OrderByDescending(s => s.StartedAt) // Xếp mới nhất lên đầu
                .Select(s => new InterviewHistoryResponse
                {
                    SessionId = s.Id,
                    JobTitle = s.JobDescription.Title,
                    StartedAt = s.StartedAt,
                    Status = s.Status,
                    OverallScore = s.InterviewFeedback != null ? s.InterviewFeedback.OverallScore : null
                })
                .ToListAsync();

            return history;
        }

        public async Task<InterviewDetailResponse?> GetInterviewDetailAsync(Guid userId, Guid sessionId)
        {
            // Lấy session, join với JD, Feedback, Criteria và Messages
            var session = await _context.InterviewSessions
                .Include(s => s.JobDescription)
                .Include(s => s.InterviewFeedback)
                    .ThenInclude(f => f.FeedbackCriteria) // Join lồng vào bảng Criteria
                .Include(s => s.InterviewMessages)
                .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId);

            if (session == null) return null; // Không tìm thấy hoặc của user khác

            return new InterviewDetailResponse
            {
                SessionId = session.Id,
                JobTitle = session.JobDescription.Title,
                StartedAt = session.StartedAt,
                EndedAt = session.EndedAt,
                Status = session.Status,
                OverallScore = session.InterviewFeedback?.OverallScore,
                GeneralComment = session.InterviewFeedback?.GeneralComment,

                // Lấy danh sách điểm thành phần
                Criteria = session.InterviewFeedback?.FeedbackCriteria.Select(c => new CriterionDto
                {
                    Name = c.CriteriaName,
                    Score = c.Score ?? 0,
                    Comment = c.Comment ?? ""
                }).ToList() ?? new List<CriterionDto>(),

                // Lấy lịch sử đoạn chat (bỏ qua tin nhắn System chứa text dài ngoằng của JD/CV)
                Messages = session.InterviewMessages
                    .Where(m => m.SenderRole != "System")
                    .OrderBy(m => m.CreatedAt)
                    .Select(m => new MessageDto
                    {
                        Sender = m.SenderRole,
                        Content = m.MessageContent,
                        Timestamp = m.CreatedAt
                    }).ToList()
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
                .GroupBy(s => new { Year = s.StartedAt.Value.Year, Month = s.StartedAt.Value.Month })
                .Select(g =>
                {
                    var allCriteria = g.SelectMany(s => s.InterviewFeedback?.FeedbackCriteria ?? new List<FeedbackCriterion>());

                    var criteriaAverages = allCriteria
                        .GroupBy(c => c.CriteriaName)
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
            // 1. Lấy tất cả các session đã hoàn thành cho JD này
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

            // 2. Gom tất cả tiêu chí từ các feedback lại
            var allCriteria = sessions.SelectMany(s => s.InterviewFeedback!.FeedbackCriteria);

            // 3. Nhóm theo tên tiêu chí và tính trung bình
            var radarData = allCriteria
                .GroupBy(c => c.CriteriaName)
                .Select(g => new RadarPointDto
                {
                    Subject = g.Key, // Ví dụ: "Logic", "Phát âm"
                    Score = Math.Round(g.Average(c => (double?)c.Score) ?? 0.0, 1),
                    FullMark = 100 // Giả định AI chấm trên thang điểm 100
                })
                .ToList();

            // 4. Tính điểm tổng quan trung bình
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