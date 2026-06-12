import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    User, Mail, Crown, LogOut, ArrowLeft, CheckCircle2, ShieldCheck, 
    Camera, Settings, Bell, Lock, Trophy, Target, Globe, ChevronRight, 
    Loader2, AlertCircle, GraduationCap, BookOpen, BarChart3, ArrowRight 
} from 'lucide-react';
import { getProfile, updateProfile } from '../services/userService';
import { getSubscriptionPlans } from '../services/paymentService';

export default function Profile() {
    const navigate = useNavigate();
    
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [university, setUniversity] = useState(''); 
    const [major, setMajor] = useState(''); 
    
    const [userRole, setUserRole] = useState(localStorage.getItem('role') || 'free'); 
    
    const [stats, setStats] = useState({ totalInterviews: 0, avgScore: 0, rank: '-' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saved, setSaved] = useState(false);

    const [pricingPlans, setPricingPlans] = useState([]);
    const [loadingPlans, setLoadingPlans] = useState(true);
    const [showPlanModal, setShowPlanModal] = useState(false);

    const currentRoleLower = userRole.toLowerCase();
    const isPaidUser = ['basic', 'premium', 'pro', 'ultra'].includes(currentRoleLower);

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
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center font-sans">
                <div className="flex flex-col items-center gap-4 text-neutral-500">
                    <Loader2 size={40} className="animate-spin text-orange-500" />
                    <p className="font-bold text-lg">Đang tải không gian làm việc...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900 tracking-tight relative overflow-hidden selection:bg-orange-100 selection:text-orange-900 pb-20">
            {/* Background Decorative Blobs */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-orange-500/5 to-transparent pointer-events-none" />
            <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 relative z-10 animate-fade-in-up">
                
                {/* Navigation & Header */}
                <button 
                    onClick={() => navigate('/dashboard')} 
                    className="group flex items-center gap-2 text-sm font-semibold text-neutral-500 hover:text-neutral-900 mb-8 transition-all w-fit bg-white px-5 py-2.5 rounded-full shadow-sm border border-neutral-200/60 hover:shadow-md hover:border-orange-200"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform text-orange-500" /> Back to Dashboard
                </button>

                {error && (
                    <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 font-semibold flex items-center gap-3 shadow-sm">
                        <AlertCircle size={20} className="shrink-0 text-red-500" />
                        <span>{error}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
                    
                    {/* --- LEFT SECTION (70%) --- */}
                    <div className="lg:col-span-8 flex flex-col gap-8">
                        
                        {/* 1. HERO PROFILE CARD */}
                        <div className="bg-white rounded-[32px] shadow-[0_2px_20px_rgba(0,0,0,0.02)] border border-neutral-200/60 overflow-hidden group">
                            {/* Premium Banner (Đen - Cam) */}
                            <div className="h-[220px] relative overflow-hidden bg-neutral-950">
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                                <div className="absolute top-[-50%] right-[-10%] w-[150%] h-[150%] bg-orange-500/20 blur-[80px] rounded-full mix-blend-overlay rotate-12 transition-transform duration-1000 group-hover:rotate-45" />
                                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />
                            </div>
                            
                            <div className="px-8 pb-10 relative">
                                {/* Avatar & Badge Setup */}
                                <div className="flex justify-between items-end -mt-20 mb-8">
                                    <div className="relative z-10">
                                        <div className="w-36 h-36 bg-white rounded-[32px] p-2 shadow-2xl shadow-neutral-900/10 rotate-[-2deg] hover:rotate-0 transition-transform duration-300">
                                            <div className="w-full h-full bg-gradient-to-br from-orange-100 to-amber-100 rounded-[24px] flex items-center justify-center text-orange-600 font-black text-6xl shadow-inner">
                                                {fullName ? fullName.charAt(0).toUpperCase() : '?'}
                                            </div>
                                        </div>
                                        <div className="absolute bottom-1 right-1 bg-neutral-900 text-white p-2.5 rounded-xl border-4 border-white shadow-sm cursor-pointer hover:bg-orange-500 hover:scale-105 transition-all">
                                            <Camera size={16} />
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 shadow-sm backdrop-blur-sm mb-4">
                                        <ShieldCheck size={16} className="fill-emerald-600 text-white" /> 
                                        <span className="text-xs font-bold uppercase tracking-wider">Verified Profile</span>
                                    </div>
                                </div>

                                {/* Basic Info */}
                                <div>
                                    <h1 className="text-3xl md:text-4xl font-black text-neutral-900 tracking-tight mb-2">
                                        {fullName || 'Chưa cập nhật tên'}
                                    </h1>
                                    <p className="text-neutral-500 font-medium text-base flex items-center gap-2">
                                        <Mail size={16} className="text-neutral-400" /> {email}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* 2. PREMIUM STATS REDESIGN */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white rounded-[28px] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-neutral-200/60 hover:shadow-xl hover:shadow-orange-500/5 hover:-translate-y-1 transition-all duration-300">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center">
                                        <BarChart3 size={24} />
                                    </div>
                                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Lượt Phỏng Vấn</p>
                                </div>
                                <p className="text-4xl font-black text-neutral-900">{stats.totalInterviews}</p>
                            </div>

                            <div className="bg-white rounded-[28px] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-neutral-200/60 hover:shadow-xl hover:shadow-neutral-900/5 hover:-translate-y-1 transition-all duration-300">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-neutral-900 text-white flex items-center justify-center shadow-md">
                                        <Target size={24} />
                                    </div>
                                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Điểm Trung Bình</p>
                                </div>
                                <p className="text-4xl font-black text-neutral-900">{stats.avgScore}</p>
                            </div>

                            <div className="bg-white rounded-[28px] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-neutral-200/60 hover:shadow-xl hover:shadow-amber-500/5 hover:-translate-y-1 transition-all duration-300">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
                                        <Trophy size={24} />
                                    </div>
                                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Xếp Hạng</p>
                                </div>
                                <p className="text-4xl font-black text-neutral-900">{stats.rank}</p>
                            </div>
                        </div>

                        {/* 3. INFORMATION SECTION & PROGRESS */}
                        <div className="bg-white rounded-[32px] shadow-[0_2px_20px_rgba(0,0,0,0.02)] border border-neutral-200/60 p-8 md:p-10">
                            
                            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-8 border-b border-neutral-100 gap-6">
                                <div>
                                    <h2 className="text-2xl font-black text-neutral-900 mb-2">Thông tin tài khoản</h2>
                                    <p className="text-neutral-500 text-sm font-medium">Quản lý thông tin cá nhân và học vấn của bạn.</p>
                                </div>
                                
                                {/* Profile Completion Inside Header */}
                                <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100 min-w-[240px]">
                                    <div className="flex justify-between text-xs font-bold mb-2">
                                        <span className="text-neutral-600">Mức độ hoàn thiện</span>
                                        <span className="text-emerald-500">{(fullName && university && major) ? "100%" : (fullName ? "60%" : "30%")}</span>
                                    </div>
                                    <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden mb-2">
                                        <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: (fullName && university && major) ? '100%' : (fullName ? '60%' : '30%') }}></div>
                                    </div>
                                    <p className="text-[11px] text-neutral-500 font-medium">
                                        {(fullName && university && major) ? "Hồ sơ của bạn đã được điền đầy đủ." : "Vui lòng cập nhật đầy đủ thông tin cá nhân."}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="relative group">
                                        <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2.5 ml-1">Họ và tên</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-orange-500 transition-colors" size={18} />
                                            <input 
                                                type="text" 
                                                value={fullName} 
                                                onChange={(e) => setFullName(e.target.value)} 
                                                className="w-full bg-neutral-50/50 border border-neutral-200 rounded-2xl pl-12 pr-4 py-3.5 outline-none focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-semibold text-sm text-neutral-900" 
                                                placeholder="Họ và tên của bạn"
                                            />
                                        </div>
                                    </div>

                                    <div className="relative group">
                                        <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2.5 ml-1">Email</label>
                                        <div className="relative opacity-70">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                                            <input 
                                                type="email" 
                                                value={email} 
                                                disabled 
                                                className="w-full bg-neutral-100 border border-transparent rounded-2xl pl-12 pr-4 py-3.5 outline-none font-semibold text-sm text-neutral-500 cursor-not-allowed" 
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="relative group">
                                        <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2.5 ml-1">Trường Đại học</label>
                                        <div className="relative">
                                            <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-orange-500 transition-colors" size={18} />
                                            <input 
                                                type="text" 
                                                value={university} 
                                                onChange={(e) => setUniversity(e.target.value)} 
                                                className="w-full bg-neutral-50/50 border border-neutral-200 rounded-2xl pl-12 pr-4 py-3.5 outline-none focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-semibold text-sm text-neutral-900" 
                                                placeholder="Trường Đại học"
                                            />
                                        </div>
                                    </div>

                                    <div className="relative group">
                                        <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2.5 ml-1">Chuyên ngành</label>
                                        <div className="relative">
                                            <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-orange-500 transition-colors" size={18} />
                                            <input 
                                                type="text" 
                                                value={major} 
                                                onChange={(e) => setMajor(e.target.value)} 
                                                className="w-full bg-neutral-50/50 border border-neutral-200 rounded-2xl pl-12 pr-4 py-3.5 outline-none focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-semibold text-sm text-neutral-900" 
                                                placeholder="Chuyên ngành"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 pt-6 border-t border-neutral-100 mt-8">
                                    <button 
                                        onClick={handleSave} 
                                        className="px-8 py-3.5 bg-neutral-950 text-white rounded-2xl font-bold text-sm hover:bg-orange-500 hover:shadow-lg hover:shadow-orange-500/20 hover:-translate-y-0.5 transition-all active:scale-95"
                                    >
                                        Lưu thay đổi
                                    </button>
                                    {saved && (
                                        <span className="flex items-center gap-2 text-emerald-600 font-bold text-sm bg-emerald-50 px-4 py-3 rounded-2xl animate-fade-in-up border border-emerald-100">
                                            <CheckCircle2 size={18}/> Đã lưu hồ sơ
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- RIGHT SECTION (30%) --- */}
                    <div className="lg:col-span-4 flex flex-col gap-8">
                        
                        {/* 4. PREMIUM SUBSCRIPTION CENTERPIECE (SaaS Black Card) */}
                        <div className="bg-neutral-950 rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden group border border-neutral-800">
                            <div className="absolute -top-32 -right-32 w-80 h-80 bg-orange-500/30 rounded-full blur-[80px] pointer-events-none group-hover:bg-orange-500/40 transition-all duration-700" />
                            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-amber-500/20 rounded-full blur-[80px] pointer-events-none" />
                            
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="p-3.5 bg-white/10 backdrop-blur-md rounded-2xl shadow-inner border border-white/10">
                                        <Crown size={24} className="text-amber-400 fill-amber-400" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 backdrop-blur-md">
                                        {isPaidUser ? `Gói ${userRole.toUpperCase()}` : 'Gói Free'}
                                    </span>
                                </div>
                                
                                <h3 className="text-2xl font-black mb-3 tracking-tight">
                                    {isPaidUser ? 'Premium Active' : 'Mở khóa tiềm năng'}
                                </h3>
                                
                                <p className="text-neutral-400 text-sm mb-10 leading-relaxed font-medium">
                                    {isPaidUser
                                        ? 'Cảm ơn bạn đã đồng hành. Hệ thống đã mở khóa các tính năng phân tích chuyên sâu cho bạn.'
                                        : 'Nâng cấp để mở khóa thêm lượt phỏng vấn và nhận phân tích AI chuyên sâu không giới hạn.'}
                                </p>

                                {currentRoleLower === 'ultra' ? (
                                    <button disabled className="w-full py-4 bg-emerald-500/10 text-emerald-400 rounded-2xl font-bold text-sm cursor-not-allowed flex items-center justify-center gap-2 border border-emerald-500/20 backdrop-blur-sm">
                                        <CheckCircle2 size={18} /> Đã kích hoạt gói cao nhất
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setShowPlanModal(true)}
                                        className="w-full py-4 rounded-2xl font-black text-sm shadow-xl shadow-orange-500/20 transition-all duration-300 bg-orange-500 text-white hover:bg-orange-600 hover:scale-[1.02] active:scale-[0.98] flex justify-center items-center gap-2"
                                    >
                                        Nâng cấp gói cao hơn <ArrowRight size={16} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* 5. AI PERFORMANCE ANALYTICS */}
                        <div className="bg-white p-8 rounded-[32px] shadow-[0_2px_20px_rgba(0,0,0,0.02)] border border-neutral-200/60">
                            <h3 className="font-black text-neutral-900 mb-6 flex items-center gap-3 text-lg">
                                <div className="p-2.5 bg-orange-50 text-orange-500 rounded-xl"><Target size={20}/></div>
                                AI Performance Analytics
                            </h3>
                            {stats.totalInterviews > 0 ? (
                                <div className="space-y-6">
                                    {[
                                        { name: "Kỹ năng trả lời", percent: stats.avgScore, color: "from-orange-400 to-amber-500", bg: "bg-orange-50" },
                                        { name: "Sự tự tin & Phản xạ", percent: stats.avgScore > 0 ? Math.min(stats.avgScore + 4, 100) : 0, color: "from-neutral-800 to-black", bg: "bg-neutral-100" }
                                    ].map((skill, idx) => (
                                        <div key={idx} className="group">
                                            <div className="flex justify-between text-sm font-bold mb-3">
                                                <span className="text-neutral-600">{skill.name}</span>
                                                <span className="text-neutral-900">{skill.percent}%</span>
                                            </div>
                                            <div className={`w-full ${skill.bg} rounded-full h-3 overflow-hidden`}>
                                                <div className={`h-full rounded-full transition-all duration-1000 bg-gradient-to-r ${skill.color} opacity-90 group-hover:opacity-100`} style={{ width: `${skill.percent}%` }}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 bg-neutral-50 rounded-2xl border border-neutral-200 border-dashed">
                                    <p className="text-sm text-neutral-500 font-medium">Chưa có dữ liệu phân tích hệ thống.</p>
                                </div>
                            )}
                        </div>

                        {/* 6. ACHIEVEMENTS */}
                        <div className="bg-white p-8 rounded-[32px] shadow-[0_2px_20px_rgba(0,0,0,0.02)] border border-neutral-200/60">
                            <h3 className="font-black text-neutral-900 mb-6 flex items-center gap-3 text-lg">
                                <div className="p-2.5 bg-amber-50 text-amber-500 rounded-xl"><Trophy size={20}/></div>
                                Thành tựu
                            </h3>
                            {stats.totalInterviews > 0 ? (
                                <div className="space-y-4">
                                    {stats.avgScore >= 80 && (
                                        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200/60 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="bg-white text-amber-500 p-3 rounded-xl shadow-sm border border-amber-100"><Crown size={20}/></div>
                                            <div>
                                                <p className="text-sm font-black text-neutral-900 mb-0.5">Ứng viên Xuất sắc</p>
                                                <p className="text-xs text-neutral-500 font-medium">Điểm trung bình đạt trên 80</p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-neutral-50 to-stone-50 rounded-2xl border border-neutral-200/60 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="bg-white text-neutral-700 p-3 rounded-xl shadow-sm border border-neutral-200"><CheckCircle2 size={20}/></div>
                                        <div>
                                            <p className="text-sm font-black text-neutral-900 mb-0.5">Chiến binh Luyện tập</p>
                                            <p className="text-xs text-neutral-500 font-medium">Đã hoàn thành lượt phỏng vấn</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-10 bg-neutral-50 rounded-2xl border border-neutral-200 border-dashed">
                                    <p className="text-sm text-neutral-500 font-medium">Hoàn thành bài PV đầu tiên để nhận huy hiệu.</p>
                                </div>
                            )}
                        </div>

                        {/* 7. SETTINGS MENU */}
                        <div className="bg-white p-6 rounded-[32px] shadow-[0_2px_20px_rgba(0,0,0,0.02)] border border-neutral-200/60">
                            <h3 className="font-black text-neutral-900 mb-4 px-2 flex items-center gap-3 text-lg">
                                <div className="p-2.5 bg-neutral-100 text-neutral-600 rounded-xl"><Settings size={20}/></div>
                                Cài đặt hệ thống
                            </h3>
                            <div className="space-y-1 mb-6">
                                <button className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 rounded-2xl transition-colors text-left group">
                                    <span className="flex items-center gap-4 text-sm font-bold text-neutral-700 group-hover:text-orange-500 transition-colors">
                                        <Bell size={18} className="text-neutral-400 group-hover:text-orange-500"/> Thông báo hệ thống
                                    </span>
                                    <ChevronRight size={16} className="text-neutral-300 group-hover:text-orange-500 transition-transform group-hover:translate-x-1"/>
                                </button>
                                <button onClick={() => navigate('/change-password')} className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 rounded-2xl transition-colors text-left group">
                                    <span className="flex items-center gap-4 text-sm font-bold text-neutral-700 group-hover:text-orange-500 transition-colors">
                                        <Lock size={18} className="text-neutral-400 group-hover:text-orange-500"/> Đổi mật khẩu bảo mật
                                    </span>
                                    <ChevronRight size={16} className="text-neutral-300 group-hover:text-orange-500 transition-transform group-hover:translate-x-1"/>
                                </button>
                                <button className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 rounded-2xl transition-colors text-left group">
                                    <span className="flex items-center gap-4 text-sm font-bold text-neutral-700 group-hover:text-orange-500 transition-colors">
                                        <Globe size={18} className="text-neutral-400 group-hover:text-orange-500"/> Ngôn ngữ mặc định (VI)
                                    </span>
                                    <ChevronRight size={16} className="text-neutral-300 group-hover:text-orange-500 transition-transform group-hover:translate-x-1"/>
                                </button>
                            </div>
                            
                            <button 
                                onClick={handleLogout} 
                                className="w-full flex items-center justify-center gap-2 text-red-600 font-bold bg-red-50/50 border border-red-100 hover:bg-red-500 hover:text-white px-4 py-4 rounded-2xl transition-all text-sm group"
                            >
                                <LogOut size={18} className="group-hover:scale-110 transition-transform" /> Đăng xuất phiên làm việc
                            </button>
                        </div>

                    </div>
                </div>
            </div>
            
            {/* Modal Chọn Gói Nâng Cấp */}
            <AnimatePresence>
                {showPlanModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm" 
                            onClick={() => setShowPlanModal(false)} 
                        />
                        
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                            animate={{ opacity: 1, scale: 1, y: 0 }} 
                            exit={{ opacity: 0, scale: 0.95, y: 20 }} 
                            className="bg-white rounded-[32px] shadow-2xl w-full max-w-md p-8 relative z-10 border border-neutral-100" 
                            onClick={e => e.stopPropagation()}
                        >
                            <button onClick={() => setShowPlanModal(false)} className="absolute top-6 right-6 text-neutral-400 hover:text-neutral-900 bg-neutral-50 hover:bg-neutral-100 p-2 rounded-full transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                            
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-3 bg-amber-50 rounded-2xl text-amber-500"><Crown size={24} /></div>
                                <div>
                                    <h3 className="text-xl font-black text-neutral-900">Nâng cấp tài khoản</h3>
                                    <p className="text-sm font-medium text-neutral-500">Chọn gói phù hợp với mục tiêu của bạn.</p>
                                </div>
                            </div>
                            
                            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                                {loadingPlans ? (
                                    <div className="flex justify-center py-6">
                                        <Loader2 size={32} className="animate-spin text-orange-500" />
                                    </div>
                                ) : (
                                    pricingPlans.filter(p => p.rawPrice > 0).map(plan => (
                                        <button
                                            key={plan.id}
                                            onClick={() => {
                                                setShowPlanModal(false);
                                                navigate('/payment', { state: { selectedPlan: plan } });
                                            }}
                                            className={`w-full text-left p-5 rounded-[24px] border-2 transition-all duration-300 group ${
                                                plan.highlight 
                                                    ? 'border-orange-500 bg-orange-50/30 hover:shadow-md hover:shadow-orange-500/10 hover:-translate-y-1' 
                                                    : 'border-neutral-100 bg-white hover:border-neutral-300 hover:shadow-md hover:-translate-y-1'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className={`font-black text-base ${plan.highlight ? 'text-orange-600' : 'text-neutral-900'}`}>{plan.name}</span>
                                                <span className="font-black text-neutral-900 text-lg">{plan.price}</span>
                                            </div>
                                            <p className="text-xs font-medium text-neutral-500 leading-relaxed">{plan.desc}</p>
                                        </button>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in-up { animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
            `}</style>
        </div>
    );
}