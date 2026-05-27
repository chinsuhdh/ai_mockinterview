using System;
using System.Collections.Generic;

namespace AIMockInterviewer.API.Models;

public partial class FeedbackCriterion
{
    public Guid Id { get; set; }

    public Guid FeedbackId { get; set; }

    public string CriteriaName { get; set; } = null!;

    public int? Score { get; set; }

    public string? Comment { get; set; }

    public virtual InterviewFeedback Feedback { get; set; } = null!;
}
