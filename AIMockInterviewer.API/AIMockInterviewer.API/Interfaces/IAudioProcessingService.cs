using System.Threading.Tasks;

namespace AIMockInterviewer.API.Interfaces
{
    public interface IAudioProcessingService
    {
        /// <summary>
        /// Chuyển đổi mảng byte âm thanh thành văn bản (Speech-to-Text)
        /// </summary>
        Task<string> TranscribeAudioAsync(byte[] audioBytes, string language);

        /// <summary>
        /// Chuyển đổi văn bản thành mảng byte âm thanh (Text-to-Speech)
        /// </summary>
        Task<byte[]> GenerateSpeechAsync(string text, string language);
    }
}