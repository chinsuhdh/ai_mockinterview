using AIMockInterviewer.API.Interfaces;
using Microsoft.Extensions.Configuration;
using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace AIMockInterviewer.API.Services
{
    public class AudioProcessingService : IAudioProcessingService
    {
        private readonly HttpClient _httpClient;
        private readonly string _groqApiKey;
        private readonly string _elevenLabsApiKey;

        public AudioProcessingService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;

            _groqApiKey = configuration["Groq:ApiKey"]
                ?? throw new Exception("Thiếu cấu hình Groq:ApiKey trong appsettings.json!");

            _elevenLabsApiKey = configuration["ElevenLabs:ApiKey"]
                ?? throw new Exception("Thiếu cấu hình ElevenLabs:ApiKey trong appsettings.json!");
        }

        public async Task<string> TranscribeAudioAsync(byte[] audioBytes, string language)
        {
            // Dùng Groq API cho STT (Giữ nguyên như cũ)
            using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.groq.com/openai/v1/audio/transcriptions");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _groqApiKey);

            var content = new MultipartFormDataContent();
            var audioContent = new ByteArrayContent(audioBytes);
            audioContent.Headers.ContentType = MediaTypeHeaderValue.Parse("audio/webm");
            content.Add(audioContent, "file", "audio.webm");

            content.Add(new StringContent("whisper-large-v3"), "model");
            content.Add(new StringContent(language), "language");

            request.Content = content;

            var response = await _httpClient.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                var errorMsg = await response.Content.ReadAsStringAsync();
                throw new Exception($"Lỗi Groq STT: {response.StatusCode} - {errorMsg}");
            }

            var responseString = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(responseString);

            return doc.RootElement.GetProperty("text").GetString() ?? string.Empty;
        }

        public async Task<byte[]> GenerateSpeechAsync(string text, string language)
        {
            // ElevenLabs Voice ID (Bạn có thể chọn giọng nam/nữ khác trong tab 'Voices' trên web)
            // Ví dụ mã này là giọng nam "Adam" đọc khá trầm ấm
            string voiceId = "pNInz6obpgDQGcFmaJgB";
            string url = $"https://api.elevenlabs.io/v1/text-to-speech/{voiceId}";

            using var request = new HttpRequestMessage(HttpMethod.Post, url);
            // ElevenLabs dùng header 'xi-api-key' thay vì 'Authorization: Bearer'
            request.Headers.Add("xi-api-key", _elevenLabsApiKey);

            var requestBody = new
            {
                text = text,
                model_id = "eleven_multilingual_v2" 
            };

            var jsonContent = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
            request.Content = jsonContent;

            var response = await _httpClient.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                var errorMsg = await response.Content.ReadAsStringAsync();
                throw new Exception($"Lỗi ElevenLabs TTS: {response.StatusCode} - {errorMsg}");
            }

            return await response.Content.ReadAsByteArrayAsync();
        }
    }
}