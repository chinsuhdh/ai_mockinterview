import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    User, Mail, Crown, LogOut, ArrowLeft, CheckCircle2, ShieldCheck, 
    Camera, Settings, Bell, Lock, Trophy, Target, Globe, ChevronRight, 
    Loader2, AlertCircle, GraduationCap, BookOpen 
} from 'lucide-react';
import { getProfile, updateProfile } from '../services/userService';
import { getSubscriptionPlans } from '../services/paymentService';

export default function Profile() {
    const navigate = useNavigate();
    
    // --- Các States quản lý dữ liệu và UI ---
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [university, setUniversity] = useState(''); 
    const [major, setMajor] = useState(''); 
    
    const [userRole, setUserRole] = useState(localStorage.getItem('role') || 'free'); 
    
    const [stats, setStats] = useState({ totalInterviews: 0, avgScore: 0, rank: '-' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saved, setSaved] = useState(false);

    // --- States cho gói dịch vụ ---
    const [pricingPlans, setPricingPlans] = useState([]);
    const [loadingPlans, setLoadingPlans] = useState(true);
    const [showPlanModal, setShowPlanModal] = useState(false);

    const currentRoleLower = userRole.toLowerCase();
    const isPaidUser = ['basic', 'premium', 'pro', 'ultra'].includes(currentRoleLower);

    // --- Gọi API lấy thông tin Profile thật từ Backend ---
    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                setLoading(true);
                setError('');
                const res = await getProfile();
                const profileData = res.data?.data || res.data;

                if (profileData) {
                    setFullName(profileData.fullName || profileData.FullName || '');
                    setEmail(profileData.email || profileData.Email || '');
                    setUniversity(profileData.university || profileData.University || '');
                    setMajor(profileData.major || profileData.Major || '');
                    
                    const apiRole = profileData.currentPlan || profileData.CurrentPlan || profileData.role || 'free';
                    setUserRole(apiRole);
                    localStorage.setItem('role', apiRole.toLowerCase());

                    setStats({
                        totalInterviews: profileData.interviewsDoneThisMonth || profileData.InterviewsDoneThisMonth || profileData.totalInterviews || 0,
                        avgScore: profileData.avgScore || profileData.AvgScore || 0,
                        rank: profileData.rank || profileData.Rank || '-'
                    });
                }
            } catch (err) {
                console.error("Lỗi lấy thông tin hồ sơ:", err);
                setError("Không thể tải thông tin hồ sơ cá nhân. Vui lòng thử lại.");
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, []);

    // --- Fetch danh sách gói từ API ---
    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const res = await getSubscriptionPlans();
                const formatted = (res.data || []).map(plan => ({
                    id: plan.id,
                    name: plan.name,
                    price: plan.price === 0 ? '0đ' : `${plan.price / 1000}k`,
                    rawPrice: plan.price,
                    period: plan.price === 0 ? 'Bắt đầu hành trình' : '/ tháng',
                    desc: `${plan.maxInterviewsPerMonth === -1 ? 'Không giới hạn' : plan.maxInterviewsPerMonth} lượt/tháng`,
                    features: plan.features || [],
                    highlight: plan.isHighlight,
                    cta: plan.price === 0 ? 'Dùng thử miễn phí' : 'Nâng cấp ngay',
                }));
                setPricingPlans(formatted);
            } catch (err) {
                console.error('Lỗi lấy danh sách gói:', err);
            } finally {
                setLoadingPlans(false);
            }
        };
        fetchPlans();
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/auth');
    };

    const handleSave = async () => {
        if (!fullName.trim()) return alert("Họ và tên không được để trống!");
        
        try {
            setError('');
            await updateProfile({ 
                fullName, 
                university: university.trim() || null, 
                major: major.trim() || null 
            });
            
            localStorage.setItem('fullName', fullName);
            window.dispatchEvent(new Event('authChange'));

            setSaved(true);
            setTimeout(() => setSaved(false), 2000); 
        } catch (err) {
            console.error("Lỗi cập nhật hồ sơ:", err);
            setError(err.response?.data?.message || "Cập nhật hồ sơ thất bại. Vui lòng thử lại.");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F4F4F5] flex items-center justify-center font-sans">
                <div className="flex flex-col items-center gap-4 text-neutral-500">
                    <Loader2 size={40} className="animate-spin text-amber-500" />
                    <p className="font-bold text-lg">Đang tải hồ sơ của bạn...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F4F4F5] p-4 sm:p-6 md:p-8 font-sans text-neutral-900 tracking-tight">
            {/* ĐÃ SỬA: Thay max-w-[1200px] thành w-full để hiển thị full màn hình */}
            <div className="w-full mx-auto animate-fade-in-up">
                
                {/* Nút Quay lại Dashboard */}
                <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-6 font-bold transition-colors bg-white px-4 py-2 rounded-xl shadow-sm border border-neutral-200 w-fit text-xs">
                    <ArrowLeft size={14} /> Quay lại Dashboard
                </button>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 font-semibold flex items-center gap-3">
                        <AlertCircle size={20} className="shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <div className="grid lg:grid-cols-12 gap-6 items-start">
                    
                    {/* --- CỘT TRÁI (Avatar, Stats, Form chỉnh sửa) --- */}
                    <div className="lg:col-span-8 space-y-6">
                        
                        <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 overflow-hidden">
                            {/* Banner Hexagon */}
                            <div className="h-32 bg-gradient-to-r from-neutral-900 to-neutral-950 relative">
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-25 mix-blend-overlay"></div>
                            </div>
                            
                            <div className="px-6 pb-8 relative">
                                {/* Khu vực Avatar & Badge Xác Thực */}
                                <div className="flex justify-between items-end -mt-10 mb-5">
                                    <div className="relative group">
                                        <div className="w-24 h-24 bg-white rounded-2xl p-1 shadow-md">
                                            <div className="w-full h-full bg-gradient-to-br from-amber-200 to-orange-400 rounded-xl flex items-center justify-center text-white font-black text-4xl shadow-inner">
                                                {fullName ? fullName.charAt(0).toUpperCase() : '?'}
                                            </div>
                                        </div>
                                        <div className="absolute bottom-0 right-0 bg-neutral-900 text-white p-1.5 rounded-lg border border-white shadow cursor-pointer hover:bg-amber-500 transition-colors">
                                            <Camera size={12} />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-600 rounded-full border border-green-200">
                                        <ShieldCheck size={13} className="fill-green-600 text-white" /> 
                                        <span className="text-[10px] font-extrabold uppercase tracking-wider">Đã xác thực</span>
                                    </div>
                                </div>

                                {/* Thông tin cá nhân cơ bản */}
                                <div className="mb-6">
                                    <h1 className="text-2xl font-extrabold text-neutral-900">{fullName || 'Chưa cập nhật tên'}</h1>
                                    <p className="text-neutral-500 font-semibold text-xs flex items-center gap-1.5 mt-1.5">
                                        <Mail size={13} className="text-neutral-400" /> {email}
                                    </p>
                                </div>

                                {/* Khối Thống kê số liệu */}
                                <div className="grid grid-cols-3 gap-3 mb-6">
                                    <div className="bg-[#F8F9FA] rounded-xl p-3.5 text-center border border-neutral-100">
                                        <p className="text-2xl font-black text-neutral-900">{stats.totalInterviews}</p>
                                        <p className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest mt-1">Lượt PV</p>
                                    </div>
                                    <div className="bg-[#F8F9FA] rounded-xl p-3.5 text-center border border-neutral-100">
                                        <p className="text-2xl font-black text-neutral-900">{stats.avgScore}</p>
                                        <p className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest mt-1">Điểm TB</p>
                                    </div>
                                    <div className="bg-[#F8F9FA] rounded-xl p-3.5 text-center border border-neutral-100">
                                        <p className="text-2xl font-black text-neutral-900">{stats.rank}</p>
                                        <p className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest mt-1">Xếp hạng</p>
                                    </div>
                                </div>

                                {/* Form Inputs (Bố cục 2x2 chuẩn UI) */}
                                <div className="space-y-4">
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div className="relative group">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 transition-colors" size={16} />
                                            <input 
                                                type="text" 
                                                value={fullName} 
                                                onChange={(e) => setFullName(e.target.value)} 
                                                className="w-full bg-[#F4F4F5] border border-transparent rounded-xl pl-11 pr-4 py-3 outline-none focus:bg-white focus:border-neutral-300 transition-all font-bold text-sm text-neutral-800" 
                                                placeholder="Họ và tên của bạn"
                                            />
                                        </div>
                                        <div className="relative group opacity-70">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                                            <input 
                                                type="email" 
                                                value={email} 
                                                disabled 
                                                className="w-full bg-[#E4E4E7] border border-transparent rounded-xl pl-11 pr-4 py-3 outline-none font-bold text-sm text-neutral-500 cursor-not-allowed" 
                                            />
                                        </div>
                                    </div>

                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div className="relative group">
                                            <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                                            <input 
                                                type="text" 
                                                value={university} 
                                                onChange={(e) => setUniversity(e.target.value)} 
                                                className="w-full bg-[#F4F4F5] border border-transparent rounded-xl pl-11 pr-4 py-3 outline-none focus:bg-white focus:border-neutral-300 transition-all font-bold text-sm text-neutral-800" 
                                                placeholder="Trường Đại học"
                                            />
                                        </div>
                                        <div className="relative group">
                                            <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                                            <input 
                                                type="text" 
                                                value={major} 
                                                onChange={(e) => setMajor(e.target.value)} 
                                                className="w-full bg-[#F4F4F5] border border-transparent rounded-xl pl-11 pr-4 py-3 outline-none focus:bg-white focus:border-neutral-300 transition-all font-bold text-sm text-neutral-800" 
                                                placeholder="Chuyên ngành"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 pt-2">
                                        <button onClick={handleSave} className="px-5 py-2.5 bg-neutral-950 text-white rounded-xl font-bold text-xs hover:bg-neutral-800 transition-all shadow-sm">Cập nhật hồ sơ</button>
                                        {saved && <span className="flex items-center gap-1.5 text-green-600 font-bold text-xs"><CheckCircle2 size={14}/> Đã lưu thành công</span>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Thanh tiến độ hoàn thiện */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-100">
                            <div className="flex justify-between text-xs font-bold mb-2">
                                <span className="text-neutral-700">Mức độ hoàn thiện hồ sơ</span>
                                <span className="text-green-500">{(fullName && university && major) ? "100%" : (fullName ? "60%" : "30%")}</span>
                            </div>
                            <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden mb-2">
                                <div className="bg-green-500 h-full rounded-full transition-all duration-500" style={{ width: (fullName && university && major) ? '100%' : (fullName ? '60%' : '30%') }}></div>
                            </div>
                            <p className="text-[11px] text-neutral-400 font-medium">
                                {(fullName && university && major) ? "Hồ sơ của bạn đã được điền đầy đủ." : "Vui lòng cập nhật đầy đủ thông tin cá nhân."}
                            </p>
                        </div>
                    </div>

                    {/* --- CỘT PHẢI (Premium, Skills, Achievements, Settings) --- */}
                    <div className="lg:col-span-4 space-y-6">
                        
                        {/* Premium Upgrade Card */}
                        <div className="bg-neutral-950 rounded-2xl p-5 text-white shadow-md relative overflow-hidden group border border-neutral-800">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2 bg-amber-500 rounded-lg shadow-md text-neutral-950"><Crown size={16} className="fill-neutral-950" /></div>
                                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-[#0A2E1A] text-[#4ADE80]">
                                    {isPaidUser ? `Gói ${userRole.toUpperCase()}` : 'Gói Free'}
                                </span>
                            </div>
                            <h3 className="text-md font-bold mb-1">
                                {isPaidUser ? 'Bạn đang dùng gói trả phí' : 'Mở khóa tiềm năng'}
                            </h3>
                            <p className="text-neutral-400 text-xs mb-4 leading-relaxed">
                                {isPaidUser
                                    ? 'Cảm ơn bạn đã đồng hành. Hệ thống đã mở khóa các tính năng cho bạn.'
                                    : 'Nâng cấp để mở khóa thêm lượt phỏng vấn và phân tích AI chuyên sâu.'}
                            </p>

                            {currentRoleLower === 'ultra' ? (
                                <button disabled className="w-full py-2.5 bg-green-500/10 text-green-400 rounded-xl font-bold text-xs cursor-not-allowed flex items-center justify-center gap-2 border border-green-500/20">
                                    <CheckCircle2 size={14} /> Đã kích hoạt gói cao nhất
                                </button>
                            ) : (
                                <button
                                    onClick={() => setShowPlanModal(true)}
                                    className="w-full py-2.5 rounded-xl font-bold text-xs shadow transition-all bg-white text-neutral-950 hover:bg-neutral-100"
                                >
                                    Nâng cấp gói cao hơn
                                </button>
                            )}
                        </div>

                        {/* Kỹ năng phân tích */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-100">
                            <h3 className="font-bold text-neutral-900 mb-4 flex items-center gap-2 text-sm"><Target size={16} className="text-neutral-500"/> Kỹ năng phân tích</h3>
                            {stats.totalInterviews > 0 ? (
                                <div className="space-y-3.5">
                                    {[
                                        { name: "Kỹ năng trả lời", percent: stats.avgScore, color: "bg-blue-500" },
                                        { name: "Sự tự tin phản xạ", percent: stats.avgScore > 0 ? Math.min(stats.avgScore + 4, 100) : 0, color: "bg-emerald-500" }
                                    ].map((skill, idx) => (
                                        <div key={idx}>
                                            <div className="flex justify-between text-xs font-bold mb-1">
                                                <span className="text-neutral-500">{skill.name}</span>
                                                <span className="text-neutral-900">{skill.percent}%</span>
                                            </div>
                                            <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
                                                <div className={`h-full rounded-full transition-all duration-1000 ${skill.color}`} style={{ width: `${skill.percent}%` }}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-neutral-400 italic text-center py-4 bg-neutral-50 rounded-xl">Chưa có dữ liệu phân tích.</p>
                            )}
                        </div>

                        {/* Thành tựu */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-100">
                            <h3 className="font-bold text-neutral-900 mb-3.5 flex items-center gap-2 text-sm"><Trophy size={16} className="text-amber-500"/> Thành tựu</h3>
                            {stats.totalInterviews > 0 ? (
                                <div className="space-y-2">
                                    {stats.avgScore >= 80 && (
                                        <div className="flex items-center gap-3 p-2 bg-amber-50 rounded-xl border border-amber-100">
                                            <div className="bg-amber-200 text-amber-700 p-1.5 rounded-lg"><Crown size={14}/></div>
                                            <div><p className="text-xs font-bold text-neutral-900">Ứng viên Xuất sắc</p><p className="text-[10px] text-neutral-400 font-medium">Điểm trung bình đạt trên 80</p></div>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3 p-2 bg-blue-50/70 rounded-xl border border-blue-100">
                                        <div className="bg-blue-100 text-blue-600 p-1.5 rounded-lg"><CheckCircle2 size={14}/></div>
                                        <div><p className="text-xs font-bold text-neutral-900">Chiến binh Luyện tập</p><p className="text-[10px] text-neutral-400 font-medium">Đã hoàn thành lượt phỏng vấn đầu tiên</p></div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-xs text-neutral-400 italic text-center py-4 bg-neutral-50 rounded-xl">Hoàn thành bài PV đầu tiên để nhận thành tựu.</p>
                            )}
                        </div>

                        {/* Cài đặt & Logout */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-100">
                            <h3 className="font-bold text-neutral-900 mb-3 flex items-center gap-2 text-sm"><Settings size={16} className="text-neutral-500"/> Cài đặt</h3>
                            <div className="space-y-0.5 mb-4">
                                <button className="w-full flex items-center justify-between p-2.5 hover:bg-neutral-50 rounded-xl transition-colors text-left group">
                                    <span className="flex items-center gap-3 text-xs font-bold text-neutral-700 group-hover:text-amber-600"><Bell size={14}/> Thông báo hệ thống</span><ChevronRight size={12} className="text-neutral-400"/>
                                </button>
                                <button onClick={() => navigate('/change-password')} className="w-full flex items-center justify-between p-2.5 hover:bg-neutral-50 rounded-xl transition-colors text-left group">
                                    <span className="flex items-center gap-3 text-xs font-bold text-neutral-700 group-hover:text-amber-600"><Lock size={14}/> Đổi mật khẩu bảo mật</span><ChevronRight size={12} className="text-neutral-400"/>
                                </button>
                                <button className="w-full flex items-center justify-between p-2.5 hover:bg-neutral-50 rounded-xl transition-colors text-left group">
                                    <span className="flex items-center gap-3 text-xs font-bold text-neutral-700 group-hover:text-amber-600"><Globe size={14}/> Ngôn ngữ mặc định (VI)</span><ChevronRight size={12} className="text-neutral-400"/>
                                </button>
                            </div>
                            
                            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 text-red-600 font-bold bg-red-50 hover:bg-red-500 hover:text-white px-4 py-2.5 rounded-xl transition-all text-xs">
                                <LogOut size={14} /> Đăng xuất tài khoản
                            </button>
                        </div>

                    </div>
                </div>
            </div>
            
            {/* Modal chọn gói phụ */}
            {showPlanModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowPlanModal(false)}>
                    <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-6 relative" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowPlanModal(false)} className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                        <div className="flex items-center gap-2 mb-4">
                            <Crown size={18} className="text-amber-500" />
                            <h3 className="text-lg font-bold text-neutral-900">Chọn gói nâng cấp</h3>
                        </div>
                        <div className="space-y-2.5 max-h-[50vh] overflow-y-auto">
                            {pricingPlans.filter(p => p.rawPrice > 0).map(plan => (
                                <button
                                    key={plan.id}
                                    onClick={() => {
                                        setShowPlanModal(false);
                                        navigate('/payment', { state: { selectedPlan: plan } });
                                    }}
                                    className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                                        plan.highlight ? 'border-amber-400 bg-amber-50/50' : 'border-neutral-200 hover:border-neutral-400'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-neutral-900 text-sm">{plan.name}</span>
                                        <span className="font-bold text-amber-600 text-sm">{plan.price}</span>
                                    </div>
                                    <p className="text-[11px] text-neutral-500 mt-0.5">{plan.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in-up { animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
            `}</style>
        </div>
    );
}