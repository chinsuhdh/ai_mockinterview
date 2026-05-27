using AIMockInterviewer.API.DTOs;
using AIMockInterviewer.API.Interfaces;
using AIMockInterviewer.API.Services; // Cần thiết để gọi AiInterviewerService trực tiếp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AIMockInterviewer.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class InterviewController : ControllerBase
    {
        private readonly IInterviewService _interviewService;
        private readonly AiInterviewerService _aiService; // Inject AI Service cho API Hint

        public InterviewController(IInterviewService interviewService, AiInterviewerService aiService)
        {
            _interviewService = interviewService;
            _aiService = aiService;
        }

        private Guid GetUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.Parse(userIdClaim!);
        }

        [HttpPost("start")]
        public async Task<IActionResult> StartSession([FromForm] StartInterviewRequest request)
        {
            try
            {
                var userId = GetUserId();
                // Đã đổi object trả về để chứa cả Success property
                dynamic result = await _interviewService.StartSessionAsync(userId, request);

                if (result.Success == false)
                {
                    if (result.Message.Contains("hết")) return StatusCode(403, result);
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = $"Lỗi hệ thống: {ex.Message}" });
            }
        }

        [HttpPost("chat")]
        public async Task<IActionResult> Chat([FromBody] ChatRequest request)
        {
            try
            {
                var userId = GetUserId();
                dynamic result = await _interviewService.ChatAsync(userId, request);

                if (result.Success == false) return BadRequest(result);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = $"Lỗi hệ thống: {ex.Message}" });
            }
        }

        [HttpPost("get-hint")]
        public async Task<IActionResult> GetHint([FromBody] HintRequest request)
        {
            try
            {
                // Gợi ý không cần lưu DB, nên gọi thẳng qua Google Gemini luôn cho tốc độ nhanh
                string hintJson = await _aiService.GetHintForQuestion(request.CurrentQuestion, "Nội dung JD");
                return Ok(hintJson);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = $"Lỗi AI: {ex.Message}" });
            }
        }

        [HttpPost("{sessionId}/end")]
        public async Task<IActionResult> EndSession(Guid sessionId)
        {
            try
            {
                var userId = GetUserId();
                dynamic result = await _interviewService.EndSessionAsync(userId, sessionId);

                if (result.Success == false) return BadRequest(result);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = $"Lỗi hệ thống: {ex.Message}" });
            }
        }
    }
}