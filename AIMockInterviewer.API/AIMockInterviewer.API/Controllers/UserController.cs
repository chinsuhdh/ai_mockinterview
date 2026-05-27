using AIMockInterviewer.API.DTOs;
using AIMockInterviewer.API.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AIMockInterviewer.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Bảo mật 100% bằng JWT
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;

        public UserController(IUserService userService)
        {
            _userService = userService;
        }

        private Guid GetUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.Parse(userIdClaim!);
        }

        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            var profile = await _userService.GetProfileAsync(GetUserId());
            if (profile == null) return NotFound("Không tìm thấy thông tin tài khoản.");
            return Ok(profile);
        }

        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
        {
            var success = await _userService.UpdateProfileAsync(GetUserId(), request);
            if (!success) return BadRequest("Cập nhật thất bại.");
            return Ok(new { Success = true, Message = "Cập nhật hồ sơ thành công." });
        }

        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            dynamic result = await _userService.ChangePasswordAsync(GetUserId(), request);
            if (result.Success == false) return BadRequest(result);
            return Ok(result);
        }

        [HttpGet("interviews-history")]
        public async Task<IActionResult> GetHistory()
        {
            var history = await _userService.GetInterviewHistoryAsync(GetUserId());
            return Ok(history);
        }

        [HttpGet("interviews-history/{sessionId}")]
        public async Task<IActionResult> GetInterviewDetail(Guid sessionId)
        {
            var detail = await _userService.GetInterviewDetailAsync(GetUserId(), sessionId);

            if (detail == null)
                return NotFound("Không tìm thấy thông tin buổi phỏng vấn hoặc bạn không có quyền xem.");

            return Ok(detail);
        }
    }
}