using System;
using System.Collections.Generic;

namespace AIMockInterviewer.API.Models;

public partial class EmailVerification
{
    public Guid Id { get; set; }

    public string Email { get; set; } = null!;

    public string VerificationCode { get; set; } = null!;

    public DateTime ExpiryTime { get; set; }

    public bool? IsUsed { get; set; }

    public DateTime? CreatedAt { get; set; }
}
