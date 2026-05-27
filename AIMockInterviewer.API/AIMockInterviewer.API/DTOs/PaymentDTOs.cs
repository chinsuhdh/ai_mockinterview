namespace AIMockInterviewer.API.DTOs
{
    public class SubscriptionPlanDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = null!;
        public decimal Price { get; set; }
        public int MaxInterviewsPerMonth { get; set; }
        public string Description { get; set; } = null!;
        public List<string> Features { get; set; } = new();
        public bool IsHighlight { get; set; } 
    }
}