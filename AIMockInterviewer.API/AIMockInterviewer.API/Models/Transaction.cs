using System;
using System.Collections.Generic;

namespace AIMockInterviewer.API.Models;

public partial class Transaction
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    // Thêm trường PlanId mapping với cột plan_id trên database
    public Guid? PlanId { get; set; }

    public decimal Amount { get; set; }

    public string? Currency { get; set; }

    public string? PaymentMethod { get; set; }

    public string? ExternalTransactionId { get; set; }

    public string? Status { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual User User { get; set; } = null!;

    // Thêm thuộc tính điều hướng đến bảng SubscriptionPlan
    public virtual SubscriptionPlan? Plan { get; set; }
}