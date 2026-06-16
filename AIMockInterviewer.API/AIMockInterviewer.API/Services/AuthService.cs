using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AIMockInterviewer.API.DTOs;
using AIMockInterviewer.API.Interfaces;
using AIMockInterviewer.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace AIMockInterviewer.API.Services
{
    public class AuthService : IAuthService
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;
        private readonly IEmailService _emailService;

        public AuthService(AppDbContext context, IConfiguration config, IEmailService emailService)
        {
            _context = context;
            _config = config;
            _emailService = emailService;
        }

        public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
        {
            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
                return new AuthResponse { Success = false, Message = "Email đã tồn tại." };

            string otp = new Random().Next(100000, 999999).ToString();

            var user = new User
            {
                Email = request.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                IsActive = false,
                OtpCode = otp,
                OtpExpiry = DateTime.UtcNow.AddMinutes(15)
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var userProfile = new UserProfile { UserId = user.Id, FullName = request.FullName };
            _context.UserProfiles.Add(userProfile);
            await _context.SaveChangesAsync();

            // Thêm Try-Catch xử lý lỗi gửi Mail
            try
            {
                string subject = "Xác thực tài khoản - AI Mock Interviewer";
                string body = $"<p>Mã OTP xác thực tài khoản của bạn là: <strong>{otp}</strong>. Mã có hiệu lực 15 phút.</p>";
                await _emailService.SendEmailAsync(user.Email, subject, body);
            }
            catch (Exception)
            {
                // Nếu gửi mail lỗi, rollback (xóa) user vừa tạo để tránh rác data và cho phép user đăng ký lại
                _context.UserProfiles.Remove(userProfile);
                _context.Users.Remove(user);
                await _context.SaveChangesAsync();

                return new AuthResponse { Success = false, Message = "Tạo tài khoản thất bại do hệ thống gửi email đang gặp sự cố. Vui lòng thử lại sau." };
            }

            return new AuthResponse { Success = true, Message = "Vui lòng kiểm tra email để lấy mã OTP xác thực." };
        }

        public async Task<AuthResponse> VerifyOtpAsync(VerifyOtpRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null) return new AuthResponse { Success = false, Message = "Tài khoản không tồn tại." };

            if (user.OtpCode != request.OtpCode || user.OtpExpiry < DateTime.UtcNow)
                return new AuthResponse { Success = false, Message = "Mã OTP không hợp lệ hoặc đã hết hạn." };

            user.IsActive = true;
            user.OtpCode = null;
            user.OtpExpiry = null;
            await _context.SaveChangesAsync();

            return new AuthResponse { Success = true, Message = "Xác thực thành công. Bạn có thể đăng nhập ngay bây giờ." };
        }

        public async Task<AuthResponse> LoginAsync(LoginRequest request)
        {
            var user = await _context.Users
                .Include(u => u.Roles)
                .FirstOrDefaultAsync(u => u.Email == request.Email);

            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                return new AuthResponse { Success = false, Message = "Email hoặc mật khẩu không đúng." };
            }

            // Sửa lại câu thông báo lỗi cho chuẩn xác với logic IsActive = false
            if (user.IsActive == false)
            {
                return new AuthResponse { Success = false, Message = "Tài khoản chưa được xác thực OTP. Vui lòng kiểm tra email." };
            }

            var userProfile = await _context.UserProfiles.FirstOrDefaultAsync(p => p.UserId == user.Id);

            var authClaims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email ?? "")
            };

            string userRole = null;
            if (user.Roles != null && user.Roles.Any())
            {
                foreach (var role in user.Roles)
                {
                    authClaims.Add(new Claim(ClaimTypes.Role, role.RoleName ?? ""));
                }
                userRole = user.Roles.First().RoleName;
            }

            var jwtKey = _config["JwtSettings:Key"];
            var authSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey ?? ""));

            var token = new JwtSecurityToken(
                issuer: _config["JwtSettings:Issuer"],
                audience: _config["JwtSettings:Audience"],
                expires: DateTime.UtcNow.AddHours(24),
                claims: authClaims,
                signingCredentials: new SigningCredentials(authSigningKey, SecurityAlgorithms.HmacSha256)
            );

            var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

            return new AuthResponse
            {
                Success = true,
                Message = "Đăng nhập thành công.",
                Token = tokenString,
                UserId = user.Id,
                FullName = userProfile?.FullName,
                Role = userRole
            };
        }

        public async Task<AuthResponse> ForgotPasswordAsync(ForgotPasswordRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null)
                return new AuthResponse { Success = false, Message = "Email không tồn tại trong hệ thống." };

            string otp = new Random().Next(100000, 999999).ToString();

            user.OtpCode = otp;
            user.OtpExpiry = DateTime.UtcNow.AddMinutes(15);
            await _context.SaveChangesAsync();

            string subject = "Đặt lại mật khẩu - AI Mock Interviewer";
            string body = $@"
                <h3>Yêu cầu đặt lại mật khẩu</h3>
                <p>Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản {request.Email}.</p>
                <p>Mã OTP của bạn là: <strong style='font-size:20px; color:blue;'>{otp}</strong></p>
                <p>Mã này sẽ hết hạn trong vòng 15 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>";

            await _emailService.SendEmailAsync(user.Email, subject, body);

            return new AuthResponse { Success = true, Message = "Mã OTP đã được gửi đến email của bạn." };
        }

        public async Task<AuthResponse> ResetPasswordAsync(ResetPasswordRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null)
                return new AuthResponse { Success = false, Message = "Email không hợp lệ." };

            if (user.OtpCode != request.OtpCode || user.OtpExpiry < DateTime.UtcNow)
                return new AuthResponse { Success = false, Message = "Mã OTP không chính xác hoặc đã hết hạn." };

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);

            user.OtpCode = null;
            user.OtpExpiry = null;
            await _context.SaveChangesAsync();

            return new AuthResponse { Success = true, Message = "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập ngay bây giờ." };
        }
    }
}