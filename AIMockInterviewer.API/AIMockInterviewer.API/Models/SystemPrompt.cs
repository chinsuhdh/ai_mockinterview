using System;
using System.Collections.Generic;

namespace AIMockInterviewer.API.Models;

public partial class SystemPrompt
{
    public Guid Id { get; set; }

    public string Name { get; set; } = null!;

    public string Content { get; set; } = null!;

    public bool? IsActive { get; set; }

    public DateTime? UpdatedAt { get; set; }
}
