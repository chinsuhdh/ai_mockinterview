using System;
using System.Security.Claims;
using System.Threading.Tasks;
using AIMockInterviewer.API.DTOs;
using AIMockInterviewer.API.Interfaces;
using AIMockInterviewer.API.Models;
using AIMockInterviewer.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace AIMockInterviewer.API.Hubs
{
    [Authorize] // Bắt buộc phải có token mới được kết nối vào Hub này
    public class InterviewHub : Hub
    {
        private readonly IInterviewService _interviewService;
        private readonly IAudioProcessingService _audioService;
        private readonly InterviewAnalyticsService _analyticsService; // Thêm service phân tích

        // Inject cả 3 service vào Hub
        public InterviewHub(
            IInterviewService interviewService,
            IAudioProcessingService audioService,
            InterviewAnalyticsService analyticsService)
        {
            _interviewService = interviewService;
            _audioService = audioService;
            _analyticsService = analyticsService;
        }

        public override async Task OnConnectedAsync()
        {
            Console.WriteLine($"[SignalR] Client connected: {Context.ConnectionId}");
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            Console.WriteLine($"[SignalR] Client disconnected: {Context.ConnectionId}");
            await base.OnDisconnectedAsync(exception);
        }

        /// <summary>
        /// Nhận luồng âm thanh (Base64) từ React
        /// </summary>
        public async Task ProcessUserAudio(string sessionIdStr, string base64Audio, string language)
        {
            try
            {
                if (!Guid.TryParse(sessionIdStr, out Guid sessionId))
                {
                    await Clients.Caller.SendAsync("OnError", "SessionId không hợp lệ.");
                    return;
                }

                // Lấy UserId từ JWT Token đã được chứng thực ở Program.cs
                var userIdStr = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!Guid.TryParse(userIdStr, out Guid userId))
                {
                    await Clients.Caller.SendAsync("OnError", "Không xác thực được người dùng.");
                    return;
                }

                // 1. CHUYỂN AUDIO THÀNH TEXT (STT)
                byte[] audioBytes = Convert.FromBase64String(base64Audio);
                string userText = await _audioService.TranscribeAudioAsync(audioBytes, language);

                // Bắn sự kiện báo cho Frontend biết đã nghe được gì để in ra màn hình
                await Clients.Caller.SendAsync("OnUserSpeechRecognized", userText);

                // --- TÍCH HỢP MODULE PHÂN TÍCH SOFT SKILL NGAY TẠI ĐÂY ---
                var analytics = _analyticsService.AnalyzeFillerWords(userText, language);

                Console.WriteLine($"[Soft-Skill Analysis] Phát hiện {analytics.TotalFillerWords} từ đệm.");

                // Bắn Event Real-time về cho React để UI có thể hiển thị số lượng từ đệm
                await Clients.Caller.SendAsync("ReceiveSpeechAnalytics", new
                {
                    totalFillerWords = analytics.TotalFillerWords,
                    details = analytics.Details,
                    evaluation = analytics.EvaluationMessage
                });
                // --------------------------------------------------------

                // 2. GỌI AI SERVICE LẤY CÂU TRẢ LỜI
                var chatRequest = new ChatRequest { SessionId = sessionId, UserMessage = userText, Language = language };

                // Nhận BaseResponse từ ChatAsync
                var chatResult = await _interviewService.ChatAsync(userId, chatRequest);

                if (chatResult.Success && chatResult.Data != null)
                {
                    string aiResponseText = chatResult.Data.Response;
                    string nextQuestionEn = chatResult.Data.NextQuestionEn;

                    // Bắn Text trả về ngay để UI hiển thị không bị độ trễ
                    await Clients.Caller.SendAsync("ReceiveAiMessage", aiResponseText);

                    // 3. CHUYỂN TEXT THÀNH AUDIO (TTS)
                    // Ưu tiên đọc tiếng Anh nếu có để giọng nói tự nhiên hơn
                    string textToSpeak = !string.IsNullOrWhiteSpace(nextQuestionEn) ? nextQuestionEn : aiResponseText;
                    byte[] aiAudioBytes = await _audioService.GenerateSpeechAsync(textToSpeak, language);
                    string aiAudioBase64 = Convert.ToBase64String(aiAudioBytes);

                    // 4. Bắn Audio về cho Frontend phát
                    await Clients.Caller.SendAsync("ReceiveAiVoice", aiAudioBase64);
                }
                else
                {
                    await Clients.Caller.SendAsync("OnError", chatResult.Message ?? "Lỗi xử lý chat từ AI.");
                }
            }
            catch (Exception ex)
            {
                await Clients.Caller.SendAsync("OnError", $"Lỗi xử lý giọng nói: {ex.Message}");
            }
        }
    }
}