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
    }
}