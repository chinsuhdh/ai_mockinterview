using AIMockInterviewer.API.Interfaces;
using MailKit.Net.Smtp;
using MimeKit;

namespace AIMockInterviewer.API.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _config;

        public EmailService(IConfiguration config)
        {
            _config = config;
        }

        public async Task SendEmailAsync(string toEmail, string subject, string body)
        {
            ArgumentNullException.ThrowIfNull(toEmail);
            ArgumentNullException.ThrowIfNull(subject);

            // Lấy cấu hình, cung cấp giá trị mặc định tránh null
            var senderName = _config["EmailConfiguration:SenderName"] ?? "AI Mock Interviewer";
            var senderEmail = _config["EmailConfiguration:SenderEmail"] ?? throw new ArgumentNullException("SenderEmail configuration is missing.");
            var smtpServer = _config["EmailConfiguration:SmtpServer"] ?? throw new ArgumentNullException("SmtpServer configuration is missing.");
            var password = _config["EmailConfiguration:Password"] ?? string.Empty;

            int smtpPort = int.TryParse(_config["EmailConfiguration:SmtpPort"], out int port) ? port : 587;

            var email = new MimeMessage();
            email.From.Add(new MailboxAddress(senderName, senderEmail));
            email.To.Add(MailboxAddress.Parse(toEmail));
            email.Subject = subject;

            var builder = new BodyBuilder { HtmlBody = body };
            email.Body = builder.ToMessageBody();

            using var smtp = new SmtpClient();
            await smtp.ConnectAsync(smtpServer, smtpPort, MailKit.Security.SecureSocketOptions.StartTls);
            await smtp.AuthenticateAsync(senderEmail, password);
            await smtp.SendAsync(email);
            await smtp.DisconnectAsync(true);
        }

        public async Task SendEmailWithAttachmentAsync(string to, string subject, string body, byte[] attachmentBytes, string attachmentFileName)
        {
            ArgumentNullException.ThrowIfNull(to);
            ArgumentNullException.ThrowIfNull(subject);
            ArgumentNullException.ThrowIfNull(attachmentBytes);
            ArgumentNullException.ThrowIfNull(attachmentFileName);

            var senderName = _config["Email:SenderName"] ?? "AI Mock Interviewer";
            var senderEmail = _config["Email:SenderEmail"] ?? throw new ArgumentNullException("SenderEmail configuration is missing.");
            var smtpServer = _config["Email:SmtpServer"] ?? throw new ArgumentNullException("SmtpServer configuration is missing.");
            var smtpUser = _config["Email:SmtpUser"] ?? senderEmail;
            var smtpPass = _config["Email:SmtpPass"] ?? string.Empty;

            int smtpPort = int.TryParse(_config["Email:SmtpPort"], out int port) ? port : 587;

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(senderName, senderEmail));
            message.To.Add(new MailboxAddress("", to));
            message.Subject = subject;

            var bodyBuilder = new BodyBuilder { HtmlBody = body };

            // Đính kèm file PDF từ mảng byte
            bodyBuilder.Attachments.Add(attachmentFileName, attachmentBytes, new ContentType("application", "pdf"));

            message.Body = bodyBuilder.ToMessageBody();

            using var client = new SmtpClient();
            await client.ConnectAsync(smtpServer, smtpPort, true);
            await client.AuthenticateAsync(smtpUser, smtpPass);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);
        }
    }
}