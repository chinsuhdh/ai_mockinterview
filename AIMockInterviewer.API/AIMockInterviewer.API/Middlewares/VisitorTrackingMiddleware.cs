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
            var ip = context.Connection.RemoteIpAddress?.ToString();

            await trackingService.RecordVisitAsync(ip ?? "Unknown");

            await _next(context);
        }
    }
}