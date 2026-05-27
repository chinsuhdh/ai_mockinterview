using System;
using System.Collections.Generic;

namespace AIMockInterviewer.API.Models;

public partial class InterviewSession
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserId { get; set; }

    public Guid JobDescriptionId { get; set; }

    public string? Status { get; set; }

    public DateTime? StartedAt { get; set; }

    public DateTime? EndedAt { get; set; }

    public virtual InterviewFeedback? InterviewFeedback { get; set; }

    public virtual ICollection<InterviewMessage> InterviewMessages { get; set; } = new List<InterviewMessage>();

    public virtual JobDescription JobDescription { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
