using System;
using System.Collections.Generic;
using System.Text.RegularExpressions;

namespace AIMockInterviewer.API.Services
{
    public class FillerWordAnalysisResult
    {
        public int TotalFillerWords { get; set; }
        public Dictionary<string, int> Details { get; set; } = new();
        public string EvaluationMessage { get; set; } = string.Empty;
    }

    public class InterviewAnalyticsService
    {
        // Danh sách từ đệm phổ biến theo ngôn ngữ
        private readonly Dictionary<string, List<string>> _fillerWordsRepo = new()
        {
            { "vi", new List<string> { "ừm", "ừ", "à", "thì", "mà", "là", "kiểu", "kiểu như", "đấy", "thế" } },
            { "en", new List<string> { "uh", "ah", "um", "uhm", "like", "so", "basically", "you know", "actually" } }
        };

        /// <summary>
        /// Phân tích tần suất xuất hiện của từ đệm trong đoạn hội thoại
        /// </summary>
        public FillerWordAnalysisResult AnalyzeFillerWords(string transcript, string language)
        {
            var result = new FillerWordAnalysisResult();
            if (string.IsNullOrWhiteSpace(transcript)) return result;

            string langKey = language.ToLower() == "en" ? "en" : "vi";
            var targetList = _fillerWordsRepo.ContainsKey(langKey) ? _fillerWordsRepo[langKey] : _fillerWordsRepo["vi"];

            // Chuẩn hóa chuỗi văn bản về chữ thường để so khớp chính xác
            string normalizedText = " " + transcript.ToLower().Trim() + " ";

            foreach (var word in targetList)
            {
                // Sử dụng Regex biên từ (\b) hoặc khoảng trắng để tránh đếm nhầm từ nằm trong từ khác
                // Ví dụ: tránh đếm nhầm chữ "là" trong từ "làm việc"
                string pattern = langKey == "vi"
                    ? $"(?<=\\s){Regex.Escape(word)}(?=\\s)"
                    : $"\\b{Regex.Escape(word)}\\b";

                int count = Regex.Matches(normalizedText, pattern).Count;
                if (count > 0)
                {
                    result.TotalFillerWords += count;
                    result.Details[word] = count;
                }
            }

            // Đưa ra nhận xét tự động dựa trên số lượng từ đệm
            result.EvaluationMessage = result.TotalFillerWords switch
            {
                0 => langKey == "en" ? "Excellent focus and fluency." : "Tuyệt vời, phong thái nói rất dứt khoát và trôi chảy.",
                <= 3 => langKey == "en" ? "Good control, minimal filler words used." : "Khá tốt, lượng từ đệm ở mức tự nhiên, kiểm soát tốt.",
                <= 7 => langKey == "en" ? "Moderate filler words. Try to pause naturally instead of saying filler words." : "Mức độ trung bình. Bạn nên tập ngắt nghỉ tự nhiên thay vì dùng từ đệm.",
                _ => langKey == "en" ? "High usage of filler words. Practicing slower speech might improve confidence appearance." : "Tần suất từ đệm quá cao. Điều này khiến câu trả lời thiếu tự tin, cần luyện tập phản xạ chậm lại."
            };

            return result;
        }

        /// <summary>
        /// Tính toán tốc độ nói (Words Per Minute)
        /// </summary>
        /// <param name="wordCount">Tổng số từ trong câu</param>
        /// <param name="durationInSeconds">Thời lượng audio ghi âm (giây)</param>
        public double CalculateSpeakingRate(int wordCount, double durationInSeconds)
        {
            if (durationInSeconds <= 0) return 0;
            double minutes = durationInSeconds / 60.0;
            return Math.Round(wordCount / minutes, 1);
        }
    }
}