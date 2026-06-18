using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using AIMockInterviewer.API.Interfaces;
using Microsoft.Extensions.Configuration;

namespace AIMockInterviewer.API.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _config;
        private readonly IHttpClientFactory _httpClientFactory;

        public EmailService(IConfiguration config, IHttpClientFactory httpClientFactory)
        {
            _config = config;
            _httpClientFactory = httpClientFactory;
        }

        public async Task SendEmailAsync(string toEmail, string subject, string body)
        {
            await SendBrevoEmailHttpAsync(toEmail, subject, body, null, null);
        }

        public async Task SendEmailWithAttachmentAsync(string to, string subject, string body, byte[] attachmentBytes, string attachmentFileName)
        {
            await SendBrevoEmailHttpAsync(to, subject, body, attachmentBytes, attachmentFileName);
        }

        // Hàm Core xử lý gọi HTTP API qua Port 443
        private async Task SendBrevoEmailHttpAsync(string toEmail, string subject, string body, byte[]? attachmentBytes, string? attachmentFileName)
        {
            ArgumentNullException.ThrowIfNull(toEmail);
            ArgumentNullException.ThrowIfNull(subject);

            var senderName = _config["EmailConfiguration:SenderName"] ?? "AI Mock Interviewer";
            var senderEmail = _config["EmailConfiguration:SenderEmail"] ?? throw new ArgumentNullException("SenderEmail configuration is missing.");
            var apiKey = _config["EmailConfiguration:ApiKey"] ?? throw new ArgumentNullException("Brevo API Key is missing.");

            // 1. Build Payload theo chuẩn API của Brevo
            var payload = new
            {
                sender = new { name = senderName, email = senderEmail },
                to = new[] { new { email = toEmail } },
                subject = subject,
                htmlContent = body,
                // Xử lý đính kèm file PDF nếu có (encode sang Base64)
                attachment = attachmentBytes != null ? new[]
                {
                    new { content = Convert.ToBase64String(attachmentBytes), name = attachmentFileName }
                } : null
            };

            // Ép JSON bỏ qua các trường null (quan trọng khi không có file đính kèm)
            var jsonOptions = new JsonSerializerOptions { DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull };
            var jsonPayload = JsonSerializer.Serialize(payload, jsonOptions);
            var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

            // 2. Khởi tạo HttpClient và gắn API Key
            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Clear();
            client.DefaultRequestHeaders.Add("api-key", apiKey);
            client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

            // 3. Bắn HTTP POST Request tới API của Brevo
            var response = await client.PostAsync("https://api.brevo.com/v3/smtp/email", content);

            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                throw new Exception($"Lỗi khi gửi email qua Brevo API: {error}");
            }
        }
    }
}