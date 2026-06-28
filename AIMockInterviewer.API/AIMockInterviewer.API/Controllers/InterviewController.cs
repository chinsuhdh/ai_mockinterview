using AIMockInterviewer.API.DTOs;
using AIMockInterviewer.API.Interfaces;
using AIMockInterviewer.API.Services;
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
        private readonly AiInterviewerService _aiService;

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
                // Sử dụng var thay vì dynamic, kết quả trả về là BaseResponse<StartInterviewData>
                var result = await _interviewService.StartSessionAsync(userId, request);

                if (!result.Success)
                {
                    if (result.Message.Contains("hết")) return StatusCode(403, result);
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new BaseResponse<object> { Success = false, Message = $"Lỗi hệ thống: {ex.Message}" });
            }
        }

        [HttpPost("chat")]
        public async Task<IActionResult> Chat([FromBody] ChatRequest request)
        {
            try
            {
                var userId = GetUserId();
                var result = await _interviewService.ChatAsync(userId, request);

                if (!result.Success) return BadRequest(result);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new BaseResponse<object> { Success = false, Message = $"Lỗi hệ thống: {ex.Message}" });
            }
        }

        [HttpPost("get-hint")]
        public async Task<IActionResult> GetHint([FromBody] HintRequest request)
        {
            try
            {
                string hintJson = await _aiService.GetHintForQuestion(request.CurrentQuestion, "Nội dung JD");
                return Ok(hintJson);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new BaseResponse<object> { Success = false, Message = $"Lỗi AI: {ex.Message}" });
            }
        }

        [HttpPost("{sessionId}/end")]
        public async Task<IActionResult> EndSession(Guid sessionId)
        {
            try
            {
                var userId = GetUserId();
                var result = await _interviewService.EndSessionAsync(userId, sessionId);

                if (!result.Success) return BadRequest(result);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new BaseResponse<object> { Success = false, Message = $"Lỗi hệ thống: {ex.Message}" });
            }
        }

        [HttpGet("{sessionId}/resume")]
        public async Task<IActionResult> ResumeSession(Guid sessionId)
        {
            try
            {
                var userId = GetUserId();
                var result = await _interviewService.ResumeSessionAsync(userId, sessionId);

                if (!result.Success) return BadRequest(result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new BaseResponse<object> { Success = false, Message = $"Lỗi hệ thống: {ex.Message}" });
            }
        }

        public class GeneralChatRequestDto
        {
            public string UserMessage { get; set; } = null!;
        }

        [AllowAnonymous]
        [HttpPost("general-chat")]
        public async Task<IActionResult> GeneralChat([FromBody] GeneralChatRequestDto request)
        {
            try
            {
                if (request == null || string.IsNullOrWhiteSpace(request.UserMessage))
                    return BadRequest(new BaseResponse<object> { Success = false, Message = "Tin nhắn không được để trống." });

                string jsonResponse = await _aiService.GetGeneralChatResponse(request.UserMessage);

                string finalReply = "";
                try
                {
                    string cleanJson = jsonResponse.Replace("```json", "").Replace("```", "").Trim();
                    using var doc = System.Text.Json.JsonDocument.Parse(cleanJson);
                    finalReply = doc.RootElement.GetProperty("reply").GetString() ?? "";
                }
                catch
                {
                    finalReply = jsonResponse;
                }

                return Ok(new { response = finalReply });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new BaseResponse<object> { Success = false, Message = $"Lỗi hệ thống AI: {ex.Message}" });
            }
        }
    }
}