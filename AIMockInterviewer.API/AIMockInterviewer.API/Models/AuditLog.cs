using System;
using System.Collections.Generic;

namespace AIMockInterviewer.API.Models;

public partial class AuditLog
{
    public Guid Id { get; set; }

    public Guid? UserId { get; set; }

    public string Action { get; set; } = null!;

    public string? EntityName { get; set; }

    public DateTime? Timestamp { get; set; }

    public virtual User? User { get; set; }
}
