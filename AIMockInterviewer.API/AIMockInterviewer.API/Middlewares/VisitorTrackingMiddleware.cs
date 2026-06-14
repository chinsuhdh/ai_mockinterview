using AIMockInterviewer.API.Interfaces;

namespace AIMockInterviewer.API.Middlewares
{
    public class VisitorTrackingMiddleware
    {
        private readonly RequestDelegate _next;

        public VisitorTrackingMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context, IVisitorTrackingService trackingService)
        {
            // 1. Lọc bỏ các request từ Bot hoặc Render Health Check thông qua User-Agent
            var userAgent = context.Request.Headers["User-Agent"].ToString().ToLower();

            bool isBotOrHealthCheck = userAgent.Contains("render") ||
                                      userAgent.Contains("health") ||
                                      userAgent.Contains("bot") ||
                                      userAgent.Contains("crawler") ||
                                      userAgent.Contains("spider");

            if (isBotOrHealthCheck)
            {
                // Cho request đi tiếp nhưng không lưu log
                await _next(context);
                return;
            }

            // 2. Lấy IP như logic cũ của bạn
            string ip = "Unknown";
            var forwardedHeader = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();

            if (!string.IsNullOrEmpty(forwardedHeader))
            {
                ip = forwardedHeader.Split(',')[0].Trim();
            }
            else
            {
                ip = context.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
            }

            await trackingService.RecordVisitAsync(ip);
            await _next(context);
        }
    }
}