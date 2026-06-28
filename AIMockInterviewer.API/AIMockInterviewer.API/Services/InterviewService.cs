using AIMockInterviewer.API.DTOs;
using AIMockInterviewer.API.Interfaces;
using AIMockInterviewer.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using System.Text.Json;
using UglyToad.PdfPig;

namespace AIMockInterviewer.API.Services
{
    public class InterviewService : IInterviewService
    {
        private readonly AppDbContext _context;
        private readonly AiInterviewerService _aiService;
        private readonly IEmailService _emailService;
        private readonly PdfReportService _pdfService;
        private readonly IMemoryCache _cache;
        private readonly InterviewAnalyticsService _analyticsService; // Đã thêm Analytics

        public InterviewService(
            AppDbContext context,
            AiInterviewerService aiService,
            IEmailService emailService,
            PdfReportService pdfService,
            IMemoryCache cache,
            InterviewAnalyticsService analyticsService) // Inject qua Constructor
        {
            _context = context;
            _aiService = aiService;
            _emailService = emailService;
            _pdfService = pdfService;
            _cache = cache;
            _analyticsService = analyticsService;
        }

        public async Task<BaseResponse<StartInterviewData>> StartSessionAsync(Guid userId, StartInterviewRequest request)
        {
            var currentMonth = DateTime.UtcNow.Month;
            var currentYear = DateTime.UtcNow.Year;
            var sessionsThisMonth = await _context.InterviewSessions.CountAsync(s => s.UserId == userId && s.StartedAt.HasValue && s.StartedAt.Value.Month == currentMonth && s.StartedAt.Value.Year == currentYear);
            var activeSub = await _context.UserSubscriptions.Include(sub => sub.Plan).FirstOrDefaultAsync(sub => sub.UserId == userId && sub.Status == "Active" && sub.EndDate > DateTime.UtcNow);

            int maxInterviews = activeSub != null ? activeSub.Plan.MaxInterviewsPerMonth : 3;
            if (maxInterviews != -1 && sessionsThisMonth >= maxInterviews)
                return new BaseResponse<StartInterviewData> { Success = false, Message = $"Bạn đã hết {maxInterviews} lượt phỏng vấn miễn phí trong tháng. Vui lòng nâng cấp gói Premium." };

            string cvText = "Ứng viên không cung cấp CV.";
            if (request.CvFile != null && request.CvFile.Length > 0)
            {
                if (!request.CvFile.FileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
                    return new BaseResponse<StartInterviewData> { Success = false, Message = "Hệ thống chỉ hỗ trợ file PDF cho CV." };

                using var stream = request.CvFile.OpenReadStream();
                using var document = PdfDocument.Open(stream);
                cvText = string.Join(" \n", document.GetPages().Select(p => p.Text));
            }

            string jdText = "Không có mô tả công việc (JD). Phỏng vấn dựa trên CV hoặc kỹ năng chung.";
            if (request.JdFile != null && request.JdFile.Length > 0)
            {
                if (!request.JdFile.FileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
                    return new BaseResponse<StartInterviewData> { Success = false, Message = "Hệ thống chỉ hỗ trợ file PDF cho JD." };

                using var stream = request.JdFile.OpenReadStream();
                using var document = PdfDocument.Open(stream);
                jdText = string.Join(" \n", document.GetPages().Select(p => p.Text));
            }
            else if (!string.IsNullOrWhiteSpace(request.JdContent))
            {
                jdText = request.JdContent;
            }

            if (cvText == "Ứng viên không cung cấp CV." && jdText.StartsWith("Không có mô tả công việc"))
            {
                return new BaseResponse<StartInterviewData> { Success = false, Message = "Vui lòng cung cấp ít nhất CV hoặc Mô tả công việc (JD) để bắt đầu." };
            }

            string finalJdTitle = string.IsNullOrWhiteSpace(request.JdTitle) ? "Phỏng vấn Đánh giá năng lực" : request.JdTitle;

            var jd = new JobDescription { UserId = userId, Title = finalJdTitle, Content = jdText };
            _context.JobDescriptions.Add(jd);
            await _context.SaveChangesAsync();

            var session = new InterviewSession { UserId = userId, JobDescriptionId = jd.Id, Status = "In-Progress" };
            _context.InterviewSessions.Add(session);
            await _context.SaveChangesAsync();

            var contextMessage = new InterviewMessage
            {
                InterviewSessionId = session.Id,
                SenderRole = "System",
                MessageContent = $"[HƯỚNG DẪN CHO AI]\nJD: {jdText}\n\nCV Ứng viên:\n{cvText}"
            };
            _context.InterviewMessages.Add(contextMessage);
            await _context.SaveChangesAsync();

            string aiContextData = $"Thông tin tuyển dụng (JD): {jdText}\n\nHồ sơ ứng viên (CV): {cvText}";
            string questionsJson = await _aiService.AnalyzeJdAndCreateQuestions(aiContextData);

            List<QuestionItem> questions = new List<QuestionItem>();
            try
            {
                string cleanJson = questionsJson.Replace("```json", "").Replace("```", "").Trim();
                questions = JsonSerializer.Deserialize<List<QuestionItem>>(cleanJson) ?? new List<QuestionItem>();
            }
            catch
            {
                questions.Add(new QuestionItem { vi = "Bạn hãy giới thiệu bản thân nhé.", en = "Please introduce yourself." });
            }

            // Đảm bảo phần này luôn chạy
            var firstQ = questions.FirstOrDefault();
            if (firstQ == null)
            {
                // Nếu AI không trả về câu hỏi, hãy gán mặc định để tránh lỗi rỗng
                firstQ = new QuestionItem { vi = "Chào bạn, hãy bắt đầu giới thiệu bản thân nhé.", en = "Hello, please introduce yourself." };
            }

            // Lưu AI message
            var aiMessage = new InterviewMessage { InterviewSessionId = session.Id, SenderRole = "AI", MessageContent = firstQ.vi };
            _context.InterviewMessages.Add(aiMessage);
            await _context.SaveChangesAsync();

            // KHỞI TẠO CACHE CHUẨN: Phải có cả System và AI
            var initialHistory = new List<string> {
    $"System: {contextMessage.MessageContent}",
    $"AI: {firstQ.vi}"
};
            _cache.Set($"history_{session.Id}", initialHistory, TimeSpan.FromHours(2));

            return new BaseResponse<StartInterviewData>
            {
                Success = true,
                Message = "Khởi tạo phỏng vấn thành công.",
                Data = new StartInterviewData
                {
                    SessionId = session.Id,
                    FirstQuestion = firstQ?.vi,
                    FirstQuestionEn = firstQ?.en,
                    Script = questions
                }
            };
        }

        public async Task<BaseResponse<ChatResponseData>> ChatAsync(Guid userId, ChatRequest request)
        {
            var session = await _context.InterviewSessions.Include(s => s.JobDescription).FirstOrDefaultAsync(s => s.Id == request.SessionId && s.UserId == userId);
            if (session == null || session.Status != "In-Progress")
                return new BaseResponse<ChatResponseData> { Success = false, Message = "Phiên phỏng vấn không hợp lệ hoặc đã kết thúc." };

            _context.InterviewMessages.Add(new InterviewMessage { InterviewSessionId = session.Id, SenderRole = "User", MessageContent = request.UserMessage });
            await _context.SaveChangesAsync();

            string cacheKey = $"history_{session.Id}";
            if (!_cache.TryGetValue(cacheKey, out List<string> historyList))
            {
                historyList = await _context.InterviewMessages
                    .Where(m => m.InterviewSessionId == session.Id)
                    .OrderBy(m => m.CreatedAt).Take(20)
                    .Select(m => $"{m.SenderRole}: {m.MessageContent}")
                    .ToListAsync();
            }

            string aiJson = await _aiService.GenerateInterviewResponse(request.UserMessage, session.JobDescription.Content, historyList, request.Language);

            string feedback = "";
            string nextQuestion = aiJson;
            string nextQuestionEn = "";

            try
            {
                string cleanJson = aiJson.Replace("```json", "").Replace("```", "").Trim();
                var aiData = JsonSerializer.Deserialize<GeminiChatResponse>(cleanJson);
                if (aiData != null)
                {
                    feedback = aiData.feedback;
                    nextQuestion = aiData.nextQuestion;
                    nextQuestionEn = aiData.nextQuestionEn;
                }
            }
            catch { }

            _context.InterviewMessages.Add(new InterviewMessage { InterviewSessionId = session.Id, SenderRole = "AI", MessageContent = nextQuestion });
            await _context.SaveChangesAsync();

            historyList.Add($"User: {request.UserMessage}");
            historyList.Add($"AI: {nextQuestion}");

            // FIX CẮT LỊCH SỬ CHUẨN: Giữ lại System Context ở vị trí đầu tiên
            if (historyList.Count > 20)
            {
                var systemPrompt = historyList.First();
                var recentChat = historyList.Skip(historyList.Count - 19).ToList();

                historyList = new List<string> { systemPrompt };
                historyList.AddRange(recentChat);
            }

            _cache.Set(cacheKey, historyList, TimeSpan.FromHours(2));

            return new BaseResponse<ChatResponseData>
            {
                Success = true,
                Data = new ChatResponseData
                {
                    Response = nextQuestion,
                    Feedback = feedback,
                    NextQuestionEn = nextQuestionEn
                }
            };
        }

        public async Task<BaseResponse<EndSessionData>> EndSessionAsync(Guid userId, Guid sessionId)
        {
            var session = await _context.InterviewSessions
                .Include(s => s.JobDescription)
                .Include(s => s.User)
                    .ThenInclude(u => u.UserProfile)
                .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId);

            if (session == null)
                return new BaseResponse<EndSessionData> { Success = false, Message = "Phiên phỏng vấn không hợp lệ." };

            if (session.Status == "Completed")
                return new BaseResponse<EndSessionData> { Success = false, Message = "Phiên phỏng vấn này đã kết thúc và được chấm điểm rồi." };

            var fullTranscriptList = await _context.InterviewMessages
                .Where(m => m.InterviewSessionId == sessionId)
                .OrderBy(m => m.CreatedAt)
                .Select(m => $"{m.SenderRole}: {m.MessageContent}")
                .ToListAsync();

            if (fullTranscriptList.Count <= 2)
            {
                session.Status = "Failed";
                session.EndedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                return new BaseResponse<EndSessionData> { Success = false, Message = "Buổi phỏng vấn quá ngắn để đánh giá. Đã hủy phiên." };
            }

            try
            {
                string aiJson = await _aiService.EvaluateInterviewAsync(session.JobDescription.Content, fullTranscriptList);
                string cleanJson = aiJson.Replace("```json", "").Replace("```", "").Trim();

                var evaluation = JsonSerializer.Deserialize<AiEvaluationResponse>(cleanJson);
                if (evaluation == null) throw new Exception("Không thể parse kết quả đánh giá.");

                session.Status = "Completed";
                session.EndedAt = DateTime.UtcNow;

                var feedback = new InterviewFeedback
                {
                    InterviewSessionId = session.Id,
                    OverallScore = evaluation.overallScore,
                    GeneralComment = evaluation.generalComment
                };
                _context.InterviewFeedbacks.Add(feedback);

                var criteriaList = new List<FeedbackCriterion>();
                foreach (var crit in evaluation.criteria)
                {
                    var newCrit = new FeedbackCriterion
                    {
                        FeedbackId = feedback.Id,
                        CriteriaName = crit.name,
                        Score = crit.score,
                        Comment = crit.comment
                    };
                    _context.FeedbackCriteria.Add(newCrit);
                    criteriaList.Add(newCrit);
                }
                await _context.SaveChangesAsync();

                // --- TÍCH HỢP ANALYTICS ĐẾM TỪ ĐỆM ---
                var userOnlyMessages = fullTranscriptList
                    .Where(m => m.StartsWith("User:"))
                    .Select(m => m.Replace("User:", "").Trim());

                string combinedUserTranscript = string.Join(" ", userOnlyMessages);
                var analyticsResult = _analyticsService.AnalyzeFillerWords(combinedUserTranscript, "vi");
                // ------------------------------------

                if (session.User != null && !string.IsNullOrWhiteSpace(session.User.Email))
                {
                    string candidateName = session.User.UserProfile?.FullName ?? "Ứng viên";
                    string jobTitle = session.JobDescription?.Title ?? "Vị trí phỏng vấn";

                    // Chỗ này nếu bạn muốn đẩy thống kê Filler Words vào file PDF thì thêm tham số analyticsResult vào hàm GenerateInterviewReport
                    byte[] pdfBytes = _pdfService.GenerateInterviewReport(
                        candidateName,
                        jobTitle,
                        evaluation.overallScore,
                        evaluation.generalComment,
                        criteriaList
                    );

                    string subject = $"[AI Mock Interviewer] Kết quả phỏng vấn - {jobTitle}";
                    string body = $@"
                        <h3>Chào {candidateName},</h3>
                        <p>Buổi phỏng vấn mô phỏng của bạn cho vị trí <strong>{jobTitle}</strong> đã hoàn tất.</p>
                        <p>Điểm đánh giá tổng quan: <strong>{evaluation.overallScore}/100</strong>.</p>
                        <p><em>Phân tích giọng nói: {analyticsResult.EvaluationMessage} (Bạn dùng tổng cộng {analyticsResult.TotalFillerWords} từ đệm)</em></p>
                        <p>Vui lòng xem file PDF đính kèm để biết chi tiết nhận xét và cách cải thiện kỹ năng.</p>
                        <p>Trân trọng,<br>Đội ngũ AI Mock Interviewer.</p>";

                    _ = _emailService.SendEmailWithAttachmentAsync(
                        session.User.Email,
                        subject,
                        body,
                        pdfBytes,
                        $"Report_{sessionId.ToString().Substring(0, 8)}.pdf"
                    );
                }

                _cache.Remove($"history_{sessionId}");

                return new BaseResponse<EndSessionData>
                {
                    Success = true,
                    Message = "Đã kết thúc và chấm điểm thành công.",
                    Data = new EndSessionData
                    {
                        Evaluation = evaluation,
                        Analytics = analyticsResult // Trả luôn về FE để vẽ biểu đồ nếu muốn
                    }
                };
            }
            catch (Exception ex)
            {
                return new BaseResponse<EndSessionData> { Success = false, Message = $"Lỗi trong quá trình AI chấm điểm: {ex.Message}" };
            }
        }

        public async Task<BaseResponse<ResumeSessionData>> ResumeSessionAsync(Guid userId, Guid sessionId)
        {
            var session = await _context.InterviewSessions
                .Include(s => s.JobDescription)
                .Include(s => s.InterviewMessages)
                .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId);

            if (session == null)
                return new BaseResponse<ResumeSessionData> { Success = false, Message = "Phiên phỏng vấn không tồn tại." };

            if (session.Status != "In-Progress")
                return new BaseResponse<ResumeSessionData> { Success = false, Message = "Phiên phỏng vấn này đã kết thúc, chỉ có thể xem lịch sử.", Data = new ResumeSessionData { IsCompleted = true } };

            string cacheKey = $"history_{sessionId}";
            var historyList = session.InterviewMessages
                .OrderBy(m => m.CreatedAt).Take(20)
                .Select(m => $"{m.SenderRole}: {m.MessageContent}")
                .ToList();

            _cache.Set(cacheKey, historyList, TimeSpan.FromHours(2));

            var messages = session.InterviewMessages
                .Where(m => m.SenderRole != "System")
                .OrderBy(m => m.CreatedAt)
                .Select(m => new MessageDto
                {
                    Sender = m.SenderRole,
                    Content = m.MessageContent,
                    Timestamp = m.CreatedAt ?? DateTime.UtcNow // Handle nullable DateTime
                }).ToList();

            return new BaseResponse<ResumeSessionData>
            {
                Success = true,
                Data = new ResumeSessionData
                {
                    SessionId = session.Id,
                    JobTitle = session.JobDescription?.Title ?? "Phỏng vấn",
                    IsCompleted = false,
                    Messages = messages
                }
            };
        }
    }
}