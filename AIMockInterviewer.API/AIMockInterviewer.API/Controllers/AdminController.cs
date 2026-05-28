using AIMockInterviewer.API.DTOs;
using AIMockInterviewer.API.Interfaces;
using AIMockInterviewer.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AIMockInterviewer.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin,admin")]
    public class AdminController : ControllerBase
    {
        private readonly IAdminService _adminService;

        public AdminController(IAdminService adminService)
        {
            _adminService = adminService;
        }

        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboard()
        {
            var stats = await _adminService.GetDashboardStatsAsync();
            return Ok(stats);
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _adminService.GetAllUsersAsync();
            return Ok(users);
        }

        [HttpPut("users/{userId}/toggle-status")]
        public async Task<IActionResult> ToggleUserStatus(Guid userId)
        {
            var success = await _adminService.ToggleUserStatusAsync(userId);
            if (!success) return NotFound(new { Success = false, Message = "Không tìm thấy User." });

            return Ok(new { Success = true, Message = "Cập nhật trạng thái tài khoản thành công." });
        }

        [HttpGet("plans")]
        public async Task<IActionResult> GetAllPlans()
        {
            var plans = await _adminService.GetAllPlansAsync();
            return Ok(plans);
        }

        [HttpGet("plans/{id}")]
        public async Task<IActionResult> GetPlanById(Guid id)
        {
            var plan = await _adminService.GetPlanByIdAsync(id);
            if (plan == null) return NotFound(new { Success = false, Message = "Không tìm thấy gói cước." });
            return Ok(plan);
        }

        [HttpPost("plans")]
        public async Task<IActionResult> CreatePlan([FromBody] SubscriptionPlanRequest request)
        {
            var newPlan = await _adminService.CreatePlanAsync(request);
            return CreatedAtAction(nameof(GetPlanById), new { id = newPlan.Id }, new { Success = true, Message = "Tạo gói cước thành công.", Data = newPlan });
        }

        [HttpPut("plans/{id}")]
        public async Task<IActionResult> UpdatePlan(Guid id, [FromBody] SubscriptionPlanRequest request)
        {
            var success = await _adminService.UpdatePlanAsync(id, request);
            if (!success) return NotFound(new { Success = false, Message = "Không tìm thấy gói cước." });

            return Ok(new { Success = true, Message = "Cập nhật gói cước thành công." });
        }

        [HttpDelete("plans/{id}")]
        public async Task<IActionResult> DeletePlan(Guid id)
        {
            try
            {
                var success = await _adminService.DeletePlanAsync(id);
                if (!success) return NotFound(new { Success = false, Message = "Không tìm thấy gói cước." });

                return Ok(new { Success = true, Message = "Xóa gói cước thành công." });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Success = false, Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = $"Lỗi hệ thống: {ex.Message}" });
            }
        }

        [HttpGet("interviews")]
        public async Task<IActionResult> GetAllInterviews()
        {
            var interviews = await _adminService.GetAllInterviewsAsync();
            return Ok(interviews);
        }

        [HttpGet("transactions")]
        public async Task<IActionResult> GetAllTransactions()
        {
            var transactions = await _adminService.GetAllTransactionsAsync();
            return Ok(transactions);
        }

        [HttpGet("interviews/{sessionId}/messages")]
        public async Task<IActionResult> GetInterviewMessages(Guid sessionId)
        {
            try
            {
                var messages = await _adminService.GetInterviewMessagesAsync(sessionId);

                return Ok(new { Success = true, Data = messages });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = $"Lỗi hệ thống: {ex.Message}" });
            }
        }

        [HttpGet("visitor-stats")]
        public IActionResult GetVisitorStats([FromServices] IVisitorTrackingService trackingService)
        {
            var currentIp = HttpContext.Connection.RemoteIpAddress?.ToString();
            var stats = trackingService.GetStats(currentIp);
            return Ok(new { Success = true, Data = stats });
        }

        [HttpDelete("visitor-stats/clear")]
        public IActionResult ClearVisitorStats([FromServices] IVisitorTrackingService trackingService)
        {
            trackingService.ClearHistory();
            return Ok(new { Success = true, Message = "Đã xoá toàn bộ lịch sử truy cập." });
        }
    }
}