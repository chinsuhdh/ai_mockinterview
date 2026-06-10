using AIMockInterviewer.API.Models;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace AIMockInterviewer.API.Services
{
    public class PdfReportService
    {
        public byte[] GenerateInterviewReport(string candidateName, string jobTitle, int overallScore, string generalComment, List<FeedbackCriterion> criteria)
        {
            return Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(2, Unit.Centimetre);
                    page.PageColor(Colors.White);
                    // Dùng font mặc định hỗ trợ Unicode
                    page.DefaultTextStyle(x => x.FontSize(12).FontFamily(Fonts.Arial));

                    // HEADER
                    page.Header().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingBottom(10).Row(row =>
                    {
                        row.RelativeItem().Column(col =>
                        {
                            col.Item().Text("AI MOCK INTERVIEWER").FontSize(24).SemiBold().FontColor(Colors.Blue.Darken2);
                            col.Item().Text("Báo Cáo Đánh Giá Năng Lực Phỏng Vấn").FontSize(14).FontColor(Colors.Grey.Medium);
                        });
                        row.ConstantItem(100).AlignRight().Text(DateTime.Now.ToString("dd/MM/yyyy")).FontSize(10);
                    });

                    // CONTENT
                    page.Content().PaddingVertical(20).Column(col =>
                    {
                        // Thông tin ứng viên
                        col.Item().Background(Colors.Grey.Lighten4).Padding(10).Row(row =>
                        {
                            row.RelativeItem().Text($"Ứng viên: {candidateName}").SemiBold();
                            row.RelativeItem().Text($"Vị trí: {jobTitle}").SemiBold();
                        });

                        col.Item().PaddingVertical(15).LineHorizontal(1).LineColor(Colors.Grey.Lighten3);

                        // Điểm tổng quan
                        col.Item().AlignCenter().Text(text =>
                        {
                            text.Span("ĐIỂM TỔNG QUAN: ").FontSize(16).SemiBold();
                            text.Span($"{overallScore}/100").FontSize(20).Bold().FontColor(overallScore >= 80 ? Colors.Green.Medium : (overallScore >= 60 ? Colors.Orange.Medium : Colors.Red.Medium));
                        });

                        // Nhận xét chung
                        col.Item().PaddingTop(20).Text("Nhận Xét Chung").FontSize(14).SemiBold().FontColor(Colors.Blue.Darken2);
                        col.Item().PaddingTop(5).Text(generalComment);

                        // Tiêu chí chi tiết
                        col.Item().PaddingTop(25).Text("Đánh Giá Chi Tiết").FontSize(14).SemiBold().FontColor(Colors.Blue.Darken2);

                        foreach (var criterion in criteria)
                        {
                            col.Item().PaddingTop(15).Background(Colors.Blue.Lighten5).Padding(10).Column(innerCol =>
                            {
                                innerCol.Item().Row(row =>
                                {
                                    row.RelativeItem().Text(criterion.CriteriaName).SemiBold();
                                    row.ConstantItem(50).AlignRight().Text($"{criterion.Score}/100").Bold();
                                });
                                innerCol.Item().PaddingTop(5).Text(criterion.Comment).FontSize(11).FontColor(Colors.Grey.Darken3);
                            });
                        }
                    });

                    // FOOTER
                    page.Footer().AlignCenter().Text(x =>
                    {
                        x.Span("Trang ");
                        x.CurrentPageNumber();
                        x.Span(" / ");
                        x.TotalPages();
                    });
                });
            }).GeneratePdf();
        }
    }
}