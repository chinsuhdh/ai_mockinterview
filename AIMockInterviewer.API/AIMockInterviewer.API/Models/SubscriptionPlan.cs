using System;
using System.Collections.Generic;

namespace AIMockInterviewer.API.Models;

public partial class SubscriptionPlan
{
    public Guid Id { get; set; }

    public string PlanName { get; set; } = null!;

    public decimal Price { get; set; }

    public int MaxInterviewsPerMonth { get; set; }

    public string? Description { get; set; }

    public virtual ICollection<UserSubscription> UserSubscriptions { get; set; } = new List<UserSubscription>();
}
