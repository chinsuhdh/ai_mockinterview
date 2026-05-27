using System;
using System.Collections.Generic;

namespace AIMockInterviewer.API.Models;

public partial class InterviewFeedback
{
    public Guid Id { get; set; }

    public Guid InterviewSessionId { get; set; }

    public int? OverallScore { get; set; }

    public string? GeneralComment { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual ICollection<FeedbackCriterion> FeedbackCriteria { get; set; } = new List<FeedbackCriterion>();

    public virtual InterviewSession InterviewSession { get; set; } = null!;
}
