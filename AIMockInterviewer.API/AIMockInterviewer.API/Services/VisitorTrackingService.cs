using AIMockInterviewer.API.DTOs;
using AIMockInterviewer.API.Interfaces;
using System.Collections.Concurrent;
using System.Text.Json;

namespace AIMockInterviewer.API.Services
{
    public class VisitorTrackingService : IVisitorTrackingService
    {
        private readonly ConcurrentQueue<VisitorLog> _logs = new();
        private int _totalVisits = 0;
        private readonly IHttpClientFactory _httpClientFactory;

        public VisitorTrackingService(IHttpClientFactory httpClientFactory)
        {
            _httpClientFactory = httpClientFactory;
        }

        public async Task RecordVisitAsync(string ipAddress)
        {
            if (string.IsNullOrEmpty(ipAddress) || ipAddress == "Unknown") return;

            if (ipAddress == "::1" ||
                ipAddress == "127.0.0.1" ||
                ipAddress.StartsWith("10.") ||
                ipAddress.StartsWith("172.") ||
                ipAddress.StartsWith("192.168."))
            {
                return;
            }

            var lastVisit = _logs.LastOrDefault(x => x.IpAddress == ipAddress);
            if (lastVisit != null && (DateTime.UtcNow - lastVisit.Timestamp).TotalSeconds < 10)
                return;

            string location = "Unknown";

            try
            {
                var client = _httpClientFactory.CreateClient();
                var response = await client.GetAsync($"https://ipinfo.io/{ipAddress}/json");

                if (response.IsSuccessStatusCode)
                {
                    var jsonString = await response.Content.ReadAsStringAsync();
                    using var doc = JsonDocument.Parse(jsonString);

                    string city = doc.RootElement.TryGetProperty("city", out var cityElement) ? cityElement.GetString() : "";
                    string country = doc.RootElement.TryGetProperty("country", out var countryElement) ? countryElement.GetString() : "";

                    if (!string.IsNullOrEmpty(city) && !string.IsNullOrEmpty(country))
                    {
                        location = $"{city}, {country}";
                    }
                }
            }
            catch
            {
                location = "Unknown";
            }

            _logs.Enqueue(new VisitorLog { IpAddress = ipAddress, Timestamp = DateTime.UtcNow, Location = location });
            _totalVisits++;

            if (_logs.Count > 1000) _logs.TryDequeue(out _);
        }

        public VisitorStatsResponse GetStats(string currentIp)
        {
            var today = DateTime.UtcNow.Date;
            var todayVisits = _logs.Count(x => x.Timestamp.Date == today);

            var topIpLog = _logs.GroupBy(x => x.IpAddress)
                                .OrderByDescending(g => g.Count())
                                .Select(g => g.FirstOrDefault())
                                .FirstOrDefault();

            var topIp = topIpLog?.IpAddress ?? "N/A";
            var topLocation = topIpLog?.Location ?? "Unknown";

            var recent = _logs.Reverse().Take(5)
                .Select(x => $"> [{x.Timestamp.ToLocalTime():MM/dd HH:mm}] {x.IpAddress} ({x.Location}) | Trạng thái: Active")
                .ToList();

            return new VisitorStatsResponse
            {
                CurrentIp = currentIp ?? "Unknown",
                TodayVisits = todayVisits,
                TotalVisits = _totalVisits,
                TopIp = topIp,
                TopLocation = topLocation,
                ServerTime = DateTime.UtcNow.ToLocalTime(),
                UptimeSeconds = Environment.TickCount64 / 1000,
                RecentLogs = recent
            };
        }

        public void ClearHistory()
        {
            _logs.Clear();
            _totalVisits = 0;
        }
    }
}