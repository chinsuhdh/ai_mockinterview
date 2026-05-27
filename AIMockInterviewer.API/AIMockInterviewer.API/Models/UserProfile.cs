using System;
using System.Collections.Generic;

namespace AIMockInterviewer.API.Models;

public partial class UserProfile
{
    public Guid UserId { get; set; }

    public string? FullName { get; set; }

    public string? University { get; set; }

    public string? Major { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual User User { get; set; } = null!;
}
