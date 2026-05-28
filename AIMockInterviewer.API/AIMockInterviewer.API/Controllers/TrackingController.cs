using AIMockInterviewer.API.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace AIMockInterviewer.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TrackingController : ControllerBase
    {
        private readonly IVisitorTrackingService _trackingService;

        public TrackingController(IVisitorTrackingService trackingService)
        {
            _trackingService = trackingService;
        }

        [HttpPost("record")]
        public async Task<IActionResult> RecordVisit()
        {
            string ip = "Unknown";
            var forwardedHeader = HttpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault();

            if (!string.IsNullOrEmpty(forwardedHeader))
            {
                ip = forwardedHeader.Split(',')[0].Trim();
            }
            else
            {
                ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
            }

            await _trackingService.RecordVisitAsync(ip);
            return Ok(new { Success = true });
        }
    }
}