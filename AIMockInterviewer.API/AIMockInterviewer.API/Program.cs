using AIMockInterviewer.API.Interfaces;
using AIMockInterviewer.API.Models;
using AIMockInterviewer.API.Services;
using AIMockInterviewer.API.Hubs; // --- THÊM SIGNALR: Nhớ using namespace chứa InterviewHub ---
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Microsoft.SemanticKernel;
using System.Security.Claims;
using System.Text;

namespace AIMockInterviewer.API
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            builder.Services.AddHttpContextAccessor();
            builder.Services.AddDbContext<AppDbContext>();

            // Khởi tạo In-Memory Cache để lưu trữ Chat History trên RAM
            builder.Services.AddMemoryCache();

            builder.Services.AddScoped<IEmailService, EmailService>();
            builder.Services.AddScoped<IAuthService, AuthService>();

            // Cấu hình Semantic Kernel cho Gemini
            var geminiApiKey = builder.Configuration["Gemini:ApiKey"]
                ?? throw new Exception("Thiếu cấu hình Gemini:ApiKey!");

            builder.Services.AddKernel()
                .AddGoogleAIGeminiChatCompletion(
                    modelId: "gemini-2.5-flash",
                    apiKey: geminiApiKey
                );

            builder.Services.AddScoped<AiInterviewerService>();
            builder.Services.AddScoped<IPaymentService, PayOsService>();
            builder.Services.AddScoped<IInterviewService, InterviewService>();
            builder.Services.AddScoped<IUserService, UserService>();
            builder.Services.AddScoped<IAdminService, AdminService>();
            builder.Services.AddHostedService<TransactionCleanupService>();
            builder.Services.AddScoped<PdfReportService>();
            builder.Services.AddScoped<IAudioProcessingService, AudioProcessingService>();
            builder.Services.AddScoped<InterviewAnalyticsService>();

            builder.Services.AddHttpClient();
            builder.Services.AddSingleton<IVisitorTrackingService, VisitorTrackingService>();

            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowAll",
                    policyBuilder => policyBuilder
                        .WithOrigins("http://localhost:5173", "http://localhost:5174", "https://ai-mockinterview-chinsuhdhs-projects.vercel.app")
                        .AllowAnyMethod()
                        .AllowAnyHeader()
                        .AllowCredentials()); // Bắt buộc AllowCredentials khi dùng SignalR
            });

            var jwtSettings = builder.Configuration.GetSection("JwtSettings");
            builder.Services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwtSettings["Issuer"],
                    ValidAudience = jwtSettings["Audience"],
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["Key"]!)),
                    RoleClaimType = ClaimTypes.Role
                };

                // --- THÊM SIGNALR: Cấu hình nhận JWT token từ query string cho WebSockets ---
                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        var accessToken = context.Request.Query["access_token"];
                        var path = context.HttpContext.Request.Path;
                        if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/interviewHub"))
                        {
                            context.Token = accessToken;
                        }
                        return Task.CompletedTask;
                    }
                };
            });

            builder.Services.AddControllers();
            builder.Services.AddEndpointsApiExplorer();

            // --- THÊM SIGNALR: Đăng ký SignalR Service ---
            builder.Services.AddSignalR(options =>
            {
                options.EnableDetailedErrors = true; // Bật để dễ debug trong môi trường Dev
                options.MaximumReceiveMessageSize = 1024 * 1024 * 5; // Cấp max 5MB cho việc stream Audio
            });

            builder.Services.AddSwaggerGen(c =>
            {
                c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
                {
                    Description = "Authorization",
                    Name = "Authorization",
                    In = ParameterLocation.Header,
                    Type = SecuritySchemeType.Http,
                    Scheme = "bearer",
                    BearerFormat = "JWT"
                });

                c.AddSecurityRequirement(new OpenApiSecurityRequirement
                {
                    {
                        new OpenApiSecurityScheme
                        {
                            Reference = new OpenApiReference
                            {
                                Type = ReferenceType.SecurityScheme,
                                Id = "Bearer"
                            }
                        },
                        Array.Empty<string>()
                    }
                });
            });

            builder.Services.Configure<ForwardedHeadersOptions>(options =>
            {
                options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
                options.KnownNetworks.Clear();
                options.KnownProxies.Clear();
            });

            QuestPDF.Settings.License = QuestPDF.Infrastructure.LicenseType.Community;

            var app = builder.Build();

            app.UseForwardedHeaders();

            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseRouting();
            app.UseCors("AllowAll");
            app.UseHttpsRedirection();
            app.UseAuthentication();
            app.UseAuthorization();

            app.MapControllers();

            // --- THÊM SIGNALR: Map Endpoint cho Hub ---
            app.MapHub<InterviewHub>("/interviewHub");

            app.Run();
        }
    }
}