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