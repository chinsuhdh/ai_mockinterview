using AIMockInterviewer.API.DTOs;

namespace AIMockInterviewer.API.Interfaces
{
    public interface IVisitorTrackingService
    {
        Task RecordVisitAsync(string ipAddress);
        VisitorStatsResponse GetStats(string currentIp);
        void ClearHistory();
    }
}