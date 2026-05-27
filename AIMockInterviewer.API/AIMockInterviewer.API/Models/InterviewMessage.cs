using System;
using System.Collections.Generic;

namespace AIMockInterviewer.API.Models;

public partial class InterviewMessage
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid InterviewSessionId { get; set; }

    public string SenderRole { get; set; } = null!;

    public string MessageContent { get; set; } = null!;

    public string? AudioUrl { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual InterviewSession InterviewSession { get; set; } = null!;
}
