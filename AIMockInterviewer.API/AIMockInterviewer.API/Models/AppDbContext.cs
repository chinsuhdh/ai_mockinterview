using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace AIMockInterviewer.API.Models;

public partial class AppDbContext : DbContext
{
    public AppDbContext()
    {
    }

    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<AuditLog> AuditLogs { get; set; }
    public virtual DbSet<EmailVerification> EmailVerifications { get; set; }
    public virtual DbSet<FeedbackCriterion> FeedbackCriteria { get; set; }
    public virtual DbSet<InterviewFeedback> InterviewFeedbacks { get; set; }
    public virtual DbSet<InterviewMessage> InterviewMessages { get; set; }
    public virtual DbSet<InterviewSession> InterviewSessions { get; set; }
    public virtual DbSet<JobDescription> JobDescriptions { get; set; }
    public virtual DbSet<Notification> Notifications { get; set; }
    public virtual DbSet<Role> Roles { get; set; }
    public virtual DbSet<SubscriptionPlan> SubscriptionPlans { get; set; }
    public virtual DbSet<SystemPrompt> SystemPrompts { get; set; }
    public virtual DbSet<Transaction> Transactions { get; set; }
    public virtual DbSet<User> Users { get; set; }
    public virtual DbSet<UserProfile> UserProfiles { get; set; }
    public virtual DbSet<UserSubscription> UserSubscriptions { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        if (!optionsBuilder.IsConfigured)
        {
            IConfigurationRoot configuration = new ConfigurationBuilder()
                .SetBasePath(AppDomain.CurrentDomain.BaseDirectory)
                .AddJsonFile("appsettings.json")
                .Build();

            var connectionString = configuration.GetConnectionString("DefaultConnection");

            optionsBuilder.UseNpgsql(connectionString);
        }
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasPostgresExtension("pgcrypto");

        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("audit_logs_pkey");
            entity.ToTable("audit_logs");
            entity.Property(e => e.Id).HasDefaultValueSql("gen_random_uuid()").HasColumnName("id");
            entity.Property(e => e.Action).HasMaxLength(255).HasColumnName("action");
            entity.Property(e => e.EntityName).HasMaxLength(100).HasColumnName("entity_name");
            entity.Property(e => e.Timestamp).HasDefaultValueSql("CURRENT_TIMESTAMP").HasColumnName("timestamp");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.HasOne(d => d.User).WithMany(p => p.AuditLogs).HasForeignKey(d => d.UserId).OnDelete(DeleteBehavior.SetNull).HasConstraintName("audit_logs_user_id_fkey");
        });

        modelBuilder.Entity<EmailVerification>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("email_verifications_pkey");
            entity.ToTable("email_verifications");
            entity.Property(e => e.Id).HasDefaultValueSql("gen_random_uuid()").HasColumnName("id");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP").HasColumnName("created_at");
            entity.Property(e => e.Email).HasMaxLength(255).HasColumnName("email");
            entity.Property(e => e.ExpiryTime).HasColumnName("expiry_time");
            entity.Property(e => e.IsUsed).HasDefaultValue(false).HasColumnName("is_used");
            entity.Property(e => e.VerificationCode).HasMaxLength(10).HasColumnName("verification_code");
        });

        modelBuilder.Entity<FeedbackCriterion>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("feedback_criteria_pkey");
            entity.ToTable("feedback_criteria");
            entity.Property(e => e.Id).HasDefaultValueSql("gen_random_uuid()").HasColumnName("id");
            entity.Property(e => e.Comment).HasColumnName("comment");
            entity.Property(e => e.CriteriaName).HasMaxLength(100).HasColumnName("criteria_name");
            entity.Property(e => e.FeedbackId).HasColumnName("feedback_id");
            entity.Property(e => e.Score).HasColumnName("score");
            entity.HasOne(d => d.Feedback).WithMany(p => p.FeedbackCriteria).HasForeignKey(d => d.FeedbackId).HasConstraintName("feedback_criteria_feedback_id_fkey");
        });

        modelBuilder.Entity<InterviewFeedback>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("interview_feedbacks_pkey");
            entity.ToTable("interview_feedbacks");
            entity.HasIndex(e => e.InterviewSessionId, "interview_feedbacks_interview_session_id_key").IsUnique();
            entity.Property(e => e.Id).HasDefaultValueSql("gen_random_uuid()").HasColumnName("id");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP").HasColumnName("created_at");
            entity.Property(e => e.GeneralComment).HasColumnName("general_comment");
            entity.Property(e => e.InterviewSessionId).HasColumnName("interview_session_id");
            entity.Property(e => e.OverallScore).HasColumnName("overall_score");
            entity.HasOne(d => d.InterviewSession).WithOne(p => p.InterviewFeedback).HasForeignKey<InterviewFeedback>(d => d.InterviewSessionId).HasConstraintName("interview_feedbacks_interview_session_id_fkey");
        });

        modelBuilder.Entity<InterviewMessage>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("interview_messages_pkey");
            entity.ToTable("interview_messages");
            entity.HasIndex(e => new { e.InterviewSessionId, e.CreatedAt }, "idx_messages_session");
            entity.Property(e => e.Id).ValueGeneratedOnAdd().HasColumnName("id");
            entity.Property(e => e.AudioUrl).HasMaxLength(500).HasColumnName("audio_url");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP").HasColumnName("created_at");
            entity.Property(e => e.InterviewSessionId).HasColumnName("interview_session_id");
            entity.Property(e => e.MessageContent).HasColumnName("message_content");
            entity.Property(e => e.SenderRole).HasMaxLength(20).HasColumnName("sender_role");
            entity.HasOne(d => d.InterviewSession).WithMany(p => p.InterviewMessages).HasForeignKey(d => d.InterviewSessionId).HasConstraintName("interview_messages_interview_session_id_fkey");
        });

        modelBuilder.Entity<InterviewSession>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("interview_sessions_pkey");
            entity.ToTable("interview_sessions");
            entity.Property(e => e.Id).ValueGeneratedOnAdd().HasColumnName("id");
            entity.Property(e => e.EndedAt).HasColumnName("ended_at");
            entity.Property(e => e.JobDescriptionId).HasColumnName("job_description_id");
            entity.Property(e => e.StartedAt).HasDefaultValueSql("CURRENT_TIMESTAMP").HasColumnName("started_at");
            entity.Property(e => e.Status).HasMaxLength(50).HasDefaultValueSql("'In-Progress'::character varying").HasColumnName("status");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.HasOne(d => d.JobDescription).WithMany(p => p.InterviewSessions).HasForeignKey(d => d.JobDescriptionId).OnDelete(DeleteBehavior.ClientSetNull).HasConstraintName("interview_sessions_job_description_id_fkey");
            entity.HasOne(d => d.User).WithMany(p => p.InterviewSessions).HasForeignKey(d => d.UserId).HasConstraintName("interview_sessions_user_id_fkey");
        });

        modelBuilder.Entity<JobDescription>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("job_descriptions_pkey");
            entity.ToTable("job_descriptions");
            entity.Property(e => e.Id).ValueGeneratedOnAdd().HasColumnName("id");
            entity.Property(e => e.Content).HasColumnName("content");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP").HasColumnName("created_at");
            entity.Property(e => e.Title).HasMaxLength(255).HasColumnName("title");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.HasOne(d => d.User).WithMany(p => p.JobDescriptions).HasForeignKey(d => d.UserId).HasConstraintName("job_descriptions_user_id_fkey");
        });

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("notifications_pkey");
            entity.ToTable("notifications");
            entity.HasIndex(e => e.UserId, "idx_notifications_unread").HasFilter("(is_read = false)");
            entity.Property(e => e.Id).HasDefaultValueSql("gen_random_uuid()").HasColumnName("id");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP").HasColumnName("created_at");
            entity.Property(e => e.IsRead).HasDefaultValue(false).HasColumnName("is_read");
            entity.Property(e => e.Message).HasColumnName("message");
            entity.Property(e => e.Title).HasMaxLength(255).HasColumnName("title");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.HasOne(d => d.User).WithMany(p => p.Notifications).HasForeignKey(d => d.UserId).HasConstraintName("notifications_user_id_fkey");
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("roles_pkey");
            entity.ToTable("roles");
            entity.HasIndex(e => e.RoleName, "roles_role_name_key").IsUnique();
            entity.Property(e => e.Id).HasDefaultValueSql("gen_random_uuid()").HasColumnName("id");
            entity.Property(e => e.RoleName).HasMaxLength(50).HasColumnName("role_name");
        });

        modelBuilder.Entity<SubscriptionPlan>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("subscription_plans_pkey");
            entity.ToTable("subscription_plans");
            entity.Property(e => e.Id).HasDefaultValueSql("gen_random_uuid()").HasColumnName("id");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.MaxInterviewsPerMonth).HasColumnName("max_interviews_per_month");
            entity.Property(e => e.PlanName).HasMaxLength(50).HasColumnName("plan_name");
            entity.Property(e => e.Price).HasPrecision(10, 2).HasColumnName("price");
        });

        modelBuilder.Entity<SystemPrompt>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("system_prompts_pkey");
            entity.ToTable("system_prompts");
            entity.Property(e => e.Id).HasDefaultValueSql("gen_random_uuid()").HasColumnName("id");
            entity.Property(e => e.Content).HasColumnName("content");
            entity.Property(e => e.IsActive).HasDefaultValue(true).HasColumnName("is_active");
            entity.Property(e => e.Name).HasMaxLength(100).HasColumnName("name");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP").HasColumnName("updated_at");
        });

        modelBuilder.Entity<Transaction>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("transactions_pkey");
            entity.ToTable("transactions");
            entity.Property(e => e.Id).HasDefaultValueSql("gen_random_uuid()").HasColumnName("id");
            entity.Property(e => e.Amount).HasPrecision(10, 2).HasColumnName("amount");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP").HasColumnName("created_at");
            entity.Property(e => e.Currency).HasMaxLength(10).HasDefaultValueSql("'VND'::character varying").HasColumnName("currency");
            entity.Property(e => e.ExternalTransactionId).HasMaxLength(100).HasColumnName("external_transaction_id");
            entity.Property(e => e.PaymentMethod).HasMaxLength(50).HasColumnName("payment_method");
            entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValueSql("'Pending'::character varying").HasColumnName("status");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.HasOne(d => d.User).WithMany(p => p.Transactions).HasForeignKey(d => d.UserId).OnDelete(DeleteBehavior.ClientSetNull).HasConstraintName("transactions_user_id_fkey");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("users_pkey");
            entity.ToTable("users");
            entity.HasIndex(e => e.Email, "users_email_key").IsUnique();
            entity.Property(e => e.Id).HasDefaultValueSql("gen_random_uuid()").HasColumnName("id");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP").HasColumnName("created_at");
            entity.Property(e => e.Email).HasMaxLength(255).HasColumnName("email");
            entity.Property(e => e.IsActive).HasDefaultValue(true).HasColumnName("is_active");
            entity.Property(e => e.PasswordHash).HasMaxLength(255).HasColumnName("password_hash");
            entity.Property(e => e.OtpCode).HasColumnName("otp_code");
            entity.Property(e => e.OtpExpiry).HasColumnName("otp_expiry");
            entity.HasMany(d => d.Roles).WithMany(p => p.Users)
                .UsingEntity<Dictionary<string, object>>(
                    "UserRole",
                    r => r.HasOne<Role>().WithMany()
                        .HasForeignKey("RoleId")
                        .HasConstraintName("user_roles_role_id_fkey"),
                    l => l.HasOne<User>().WithMany()
                        .HasForeignKey("UserId")
                        .HasConstraintName("user_roles_user_id_fkey"),
                    j =>
                    {
                        j.HasKey("UserId", "RoleId").HasName("user_roles_pkey");
                        j.ToTable("user_roles");
                        j.IndexerProperty<Guid>("UserId").HasColumnName("user_id");
                        j.IndexerProperty<Guid>("RoleId").HasColumnName("role_id");
                    });
        });

        modelBuilder.Entity<UserProfile>(entity =>
        {
            entity.HasKey(e => e.UserId).HasName("user_profiles_pkey");
            entity.ToTable("user_profiles");
            entity.Property(e => e.UserId).ValueGeneratedNever().HasColumnName("user_id");
            entity.Property(e => e.FullName).HasMaxLength(255).HasColumnName("full_name");
            entity.Property(e => e.Major).HasMaxLength(255).HasColumnName("major");
            entity.Property(e => e.University).HasMaxLength(255).HasColumnName("university");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP").HasColumnName("updated_at");
            entity.HasOne(d => d.User).WithOne(p => p.UserProfile).HasForeignKey<UserProfile>(d => d.UserId).HasConstraintName("user_profiles_user_id_fkey");
        });

        modelBuilder.Entity<UserSubscription>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("user_subscriptions_pkey");
            entity.ToTable("user_subscriptions");
            entity.HasIndex(e => e.UserId, "idx_user_subs_active").HasFilter("((status)::text = 'Active'::text)");
            entity.Property(e => e.Id).HasDefaultValueSql("gen_random_uuid()").HasColumnName("id");
            entity.Property(e => e.EndDate).HasColumnName("end_date");
            entity.Property(e => e.InterviewsUsedThisMonth).HasDefaultValue(0).HasColumnName("interviews_used_this_month");
            entity.Property(e => e.PlanId).HasColumnName("plan_id");
            entity.Property(e => e.StartDate).HasDefaultValueSql("CURRENT_TIMESTAMP").HasColumnName("start_date");
            entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValueSql("'Active'::character varying").HasColumnName("status");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.HasOne(d => d.Plan).WithMany(p => p.UserSubscriptions).HasForeignKey(d => d.PlanId).OnDelete(DeleteBehavior.ClientSetNull).HasConstraintName("user_subscriptions_plan_id_fkey");
            entity.HasOne(d => d.User).WithMany(p => p.UserSubscriptions).HasForeignKey(d => d.UserId).HasConstraintName("user_subscriptions_user_id_fkey");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}