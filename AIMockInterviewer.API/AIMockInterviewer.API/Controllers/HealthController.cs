using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AIMockInterviewer.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class HealthController : ControllerBase
    {
        // Endpoint: GET or HEAD api/health/ping
        [HttpGet("ping")]
        [HttpHead("ping")] // Thêm dòng này để nhận request HEAD từ UptimeRobot
        [AllowAnonymous]
        public IActionResult Ping()
        {
            return Ok(new { message = "Server is awake!", timestamp = DateTime.UtcNow });
        }
    }
}