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
    
    // Đã FIX: Chuyển role thành state để tự động cập nhật khi API trả về
    const [userRole, setUserRole] = useState(localStorage.getItem('role') || 'free'); 
    
    const [stats, setStats] = useState({ totalInterviews: 0, avgScore: 0, rank: '-' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saved, setSaved] = useState(false);

    // --- States cho gói dịch vụ ---
    const [pricingPlans, setPricingPlans] = useState([]);
    const [loadingPlans, setLoadingPlans] = useState(true);
    const [showPlanModal, setShowPlanModal] = useState(false);

    // --- Biến kiểm tra trả phí dựa trên State ---
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
                    
                    // FIX: Lấy Role/Plan mới nhất từ DB
                    const apiRole = profileData.currentPlan || profileData.CurrentPlan || profileData.role || 'free';;
                    setUserRole(apiRole);
                    // Cập nhật luôn lại localStorage để đồng bộ với các trang khác
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

    // --- Gọi API gửi cập nhật thông tin lên Backend ---
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
        <div className="min-h-screen bg-[#F4F4F5] p-4 sm:p-6 md:p-8 font-sans text-neutral-900">
            <div className="max-w-[1200px] mx-auto animate-fade-in-up">
                
                <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-neutral-500 hover:text-amber-600 mb-6 font-bold transition-colors bg-white px-4 py-2 rounded-full shadow-sm border border-neutral-200 w-fit text-sm">
                    <ArrowLeft size={16} /> Quay lại Dashboard
                </button>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 font-semibold flex items-center gap-3">
                        <AlertCircle size={20} className="shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <div className="grid lg:grid-cols-12 gap-6">
                    
                    {/* --- CỘT TRÁI (Avatar, Stats, Form chỉnh sửa) --- */}
                    <div className="lg:col-span-8 space-y-6">
                        
                        <div className="bg-white rounded-[2rem] shadow-sm border border-neutral-100 overflow-hidden">
                            <div className="h-32 bg-gradient-to-r from-neutral-800 to-black relative">
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                            </div>
                            <div className="px-8 pb-8 relative">
                                <div className="flex justify-between items-end -mt-12 mb-6">
                                    <div className="relative group">
                                        <div className="w-24 h-24 bg-white rounded-2xl p-1.5 shadow-lg">
                                            <div className="w-full h-full bg-gradient-to-br from-amber-200 to-orange-400 rounded-xl flex items-center justify-center text-white font-black text-4xl shadow-inner">
                                                {fullName ? fullName.charAt(0).toUpperCase() : '?'}
                                            </div>
                                        </div>
                                        <div className="absolute -bottom-2 -right-2 bg-neutral-900 text-white p-2 rounded-xl border-2 border-white shadow-md cursor-pointer hover:bg-amber-500 transition-colors"><Camera size={14} /></div>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-600 rounded-full border border-green-100">
                                        <ShieldCheck size={14} /> 
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Đã xác thực</span>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <h1 className="text-2xl font-black text-neutral-900">{fullName || 'Chưa cập nhật tên'}</h1>
                                    <p className="text-neutral-500 font-medium text-sm flex items-center gap-1.5 mt-1"><Mail size={14}/> {email}</p>
                                </div>

                                <div className="flex gap-4 mb-8">
                                    <div className="flex-1 bg-neutral-50 rounded-2xl p-4 text-center border border-neutral-100">
                                        <p className="text-2xl font-black text-neutral-900">{stats.totalInterviews}</p>
                                        <p className="text-xs font-bold text-neutral-400 uppercase mt-1">Lượt PV</p>
                                    </div>
                                    <div className="flex-1 bg-neutral-50 rounded-2xl p-4 text-center border border-neutral-100">
                                        <p className="text-2xl font-black text-amber-500">{stats.avgScore}</p>
                                        <p className="text-xs font-bold text-neutral-400 uppercase mt-1">Điểm TB</p>
                                    </div>
                                    <div className="flex-1 bg-neutral-50 rounded-2xl p-4 text-center border border-neutral-100">
                                        <p className="text-2xl font-black text-blue-500">{stats.rank}</p>
                                        <p className="text-xs font-bold text-neutral-400 uppercase mt-1">Xếp hạng</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div className="relative group">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-amber-500 transition-colors" size={18} />
                                            <input 
                                                type="text" 
                                                value={fullName} 
                                                onChange={(e) => setFullName(e.target.value)} 
                                                className="w-full bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-xl pl-12 pr-4 py-3 outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all font-bold text-sm" 
                                                placeholder="Họ và tên của bạn"
                                            />
                                        </div>
                                        <div className="relative group opacity-60">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                                            <input 
                                                type="email" 
                                                value={email} 
                                                disabled 
                                                className="w-full bg-neutral-200 border border-neutral-200 rounded-xl pl-12 pr-4 py-3 outline-none font-bold text-sm cursor-not-allowed" 
                                                title="Không thể thay đổi email hệ thống"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div className="relative group">
                                            <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-amber-500 transition-colors" size={18} />
                                            <input 
                                                type="text" 
                                                value={university} 
                                                onChange={(e) => setUniversity(e.target.value)} 
                                                className="w-full bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-xl pl-12 pr-4 py-3 outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all font-bold text-sm" 
                                                placeholder="Trường Đại học (Ví dụ: FPT University)"
                                            />
                                        </div>
                                        <div className="relative group">
                                            <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-amber-500 transition-colors" size={18} />
                                            <input 
                                                type="text" 
                                                value={major} 
                                                onChange={(e) => setMajor(e.target.value)} 
                                                className="w-full bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-xl pl-12 pr-4 py-3 outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all font-bold text-sm" 
                                                placeholder="Chuyên ngành (Ví dụ: Kỹ thuật phần mềm)"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 pt-2">
                                        <button onClick={handleSave} className="px-6 py-3 bg-neutral-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-all">Cập nhật hồ sơ</button>
                                        {saved && <span className="flex items-center gap-1.5 text-green-600 font-bold text-sm"><CheckCircle2 size={16}/> Đã lưu thành công</span>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-100 delay-100 animate-fade-in-up">
                            <div className="flex justify-between text-sm font-bold mb-3">
                                <span className="text-neutral-700">Mức độ hoàn thiện hồ sơ</span>
                                <span className="text-green-500">{(fullName && university && major) ? "100%" : (fullName ? "60%" : "30%")}</span>
                            </div>
                            <div className="w-full bg-neutral-100 rounded-full h-2.5 overflow-hidden mb-3">
                                <div className="bg-green-500 h-full rounded-full transition-all duration-500" style={{ width: (fullName && university && major) ? '100%' : (fullName ? '60%' : '30%') }}></div>
                            </div>
                            <p className="text-xs text-neutral-500 font-medium">
                                {(fullName && university && major) ? "Hồ sơ của bạn đã được điền đầy đủ." : "Vui lòng cập nhật đầy đủ họ tên, trường và chuyên ngành của bạn."}
                            </p>
                        </div>
                    </div>

                    {/* --- CỘT PHẢI (Skills, Premium, Settings) --- */}
                    <div className="lg:col-span-4 space-y-6 delay-200 animate-fade-in-up">
                        
                        {/* Premium Upgrade Card - Đã xử lý lại logic hiển thị */}
                        <div className="bg-gradient-to-br from-neutral-900 to-black rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 -left-[100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 group-hover:animate-[shimmer_1.5s_infinite]" />
                            <div className="relative z-10 flex items-center justify-between mb-4">
                                <div className="p-3 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl shadow-lg"><Crown size={20} className="text-white" /></div>
                                <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${
                                    isPaidUser
                                        ? 'text-green-400 bg-green-400/10'
                                        : 'text-amber-400 bg-amber-400/10'
                                }`}>
                                    {isPaidUser ? `Gói ${userRole.charAt(0).toUpperCase() + userRole.slice(1)}` : 'Gói Free'}
                                </span>
                            </div>
                            <h3 className="text-lg font-black mb-1">
                                {isPaidUser ? 'Bạn đang dùng gói trả phí' : 'Mở khóa tiềm năng'}
                            </h3>
                            <p className="text-neutral-400 text-xs mb-5 line-clamp-2">
                                {isPaidUser
                                    ? 'Cảm ơn bạn đã đồng hành. Hệ thống đã mở khóa các tính năng cho bạn.'
                                    : 'Nâng cấp để mở khóa thêm lượt phỏng vấn và phân tích AI chuyên sâu.'}
                            </p>

                            {/* Kiểm tra nếu là gói Ultra thì vô hiệu hóa nút nâng cấp */}
                            {currentRoleLower === 'ultra' ? (
                                <button disabled className="w-full py-3 bg-green-500/20 text-green-400 rounded-xl font-black text-sm cursor-not-allowed flex items-center justify-center gap-2 border border-green-500/30">
                                    <CheckCircle2 size={16} /> Đã kích hoạt gói cao nhất
                                </button>
                            ) : (
                                <button
                                    onClick={() => setShowPlanModal(true)}
                                    className={`w-full py-3 rounded-xl font-black text-sm shadow-md hover:opacity-90 transition-all ${
                                        isPaidUser 
                                        ? 'bg-white text-neutral-900' // Đã mua basic/pro thì cho phép mua lên gói cao hơn
                                        : 'bg-gradient-to-r from-amber-400 to-orange-500 text-white'
                                    }`}
                                >
                                    {isPaidUser ? 'Nâng cấp gói cao hơn' : 'Nâng cấp ngay ✨'}
                                </button>
                            )}
                        </div>

                        {/* Modal chọn gói */}
                        {showPlanModal && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowPlanModal(false)}>
                                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 relative" onClick={e => e.stopPropagation()}>
                                    <button onClick={() => setShowPlanModal(false)} className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                    </button>
                                    <div className="flex items-center gap-3 mb-1">
                                        <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl"><Crown size={18} className="text-white" /></div>
                                        <h3 className="text-xl font-black text-neutral-900">Chọn gói nâng cấp</h3>
                                    </div>
                                    <p className="text-sm text-neutral-500 mb-6 ml-11">
                                        Bạn đang dùng <span className="font-bold text-neutral-700">Gói {userRole.charAt(0).toUpperCase() + userRole.slice(1)}</span>. Chọn gói phù hợp để trải nghiệm tốt hơn.
                                    </p>

                                    {loadingPlans ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 size={28} className="animate-spin text-amber-500" />
                                        </div>
                                    ) : (
                                        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                                            {pricingPlans.filter(p => p.rawPrice > 0).map(plan => (
                                                <button
                                                    key={plan.id}
                                                    onClick={() => {
                                                        setShowPlanModal(false);
                                                        navigate('/payment', { state: { selectedPlan: plan } });
                                                    }}
                                                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all hover:-translate-y-0.5 ${
                                                        plan.highlight
                                                            ? 'border-amber-400 bg-amber-50 hover:bg-amber-100'
                                                            : 'border-neutral-200 bg-neutral-50 hover:border-amber-300 hover:bg-neutral-100'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="font-black text-neutral-900 flex items-center gap-2">
                                                            {plan.name}
                                                            {plan.highlight && <Crown size={14} className="text-amber-500 fill-amber-500" />}
                                                        </span>
                                                        <span className="font-black text-amber-600">{plan.price}<span className="text-xs font-medium text-neutral-400 ml-0.5">{plan.period}</span></span>
                                                    </div>
                                                    <p className="text-xs text-neutral-500">{plan.desc}</p>
                                                    {plan.features.length > 0 && (
                                                        <ul className="mt-2 space-y-1">
                                                            {plan.features.slice(0, 3).map((f, i) => (
                                                                <li key={i} className="text-xs text-neutral-600 flex items-center gap-1.5">
                                                                    <CheckCircle2 size={11} className="text-green-500 shrink-0" /> {f}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Kỹ năng phân tích */}
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-100">
                            <h3 className="font-black text-neutral-900 mb-5 flex items-center gap-2 text-lg"><Target size={18}/> Kỹ năng phân tích</h3>
                            {stats.totalInterviews > 0 ? (
                                <div className="space-y-4">
                                    {[
                                        { name: "Kỹ năng trả lời", percent: stats.avgScore, color: "bg-blue-500" },
                                        { name: "Sự tự tin phản xạ", percent: stats.avgScore > 0 ? Math.min(stats.avgScore + 4, 100) : 0, color: "bg-green-500" }
                                    ].map((skill, idx) => (
                                        <div key={idx}>
                                            <div className="flex justify-between text-xs font-bold mb-1.5">
                                                <span className="text-neutral-600">{skill.name}</span>
                                                <span className="text-neutral-900">{skill.percent}%</span>
                                            </div>
                                            <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
                                                <div className={`h-full rounded-full transition-all duration-1000 ${skill.color}`} style={{ width: `${skill.percent}%` }}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-neutral-500 italic text-center py-4 bg-neutral-50 rounded-xl border border-neutral-100">Chưa có dữ liệu phân tích. Hãy hoàn thành bài phỏng vấn đầu tiên!</p>
                            )}
                        </div>

                        {/* Thành tựu */}
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-100">
                            <h3 className="font-black text-neutral-900 mb-4 flex items-center gap-2 text-lg"><Trophy size={18} className="text-amber-500"/> Thành tựu</h3>
                            {stats.totalInterviews > 0 ? (
                                <div className="space-y-3">
                                    {stats.avgScore >= 80 && (
                                        <div className="flex items-center gap-3 p-2.5 bg-amber-50 rounded-xl border border-amber-100">
                                            <div className="bg-amber-200 text-amber-700 p-2 rounded-lg"><Crown size={16}/></div>
                                            <div><p className="text-sm font-bold text-neutral-900">Ứng viên Xuất sắc</p><p className="text-[10px] text-neutral-500 font-medium">Điểm trung bình đạt trên 80</p></div>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3 p-2.5 bg-blue-50 rounded-xl border border-blue-100">
                                        <div className="bg-blue-200 text-blue-700 p-2 rounded-lg"><CheckCircle2 size={16}/></div>
                                        <div><p className="text-sm font-bold text-neutral-900">Chiến binh Luyện tập</p><p className="text-[10px] text-neutral-500 font-medium">Đã hoàn thành lượt phỏng vấn đầu tiên</p></div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-neutral-500 italic text-center py-4 bg-neutral-50 rounded-xl border border-neutral-100">Hoàn thành bài PV đầu tiên để nhận huy hiệu thành tựu.</p>
                            )}
                        </div>

                        {/* Cài đặt & Logout */}
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-100">
                            <h3 className="font-black text-neutral-900 mb-4 flex items-center gap-2 text-lg"><Settings size={18}/> Cài đặt</h3>
                            <div className="space-y-1 mb-6">
                                <button className="w-full flex items-center justify-between p-3 hover:bg-neutral-50 rounded-xl transition-colors text-left group">
                                    <span className="flex items-center gap-3 text-sm font-bold text-neutral-700 group-hover:text-amber-600"><Bell size={16}/> Thông báo hệ thống</span><ChevronRight size={14} className="text-neutral-400"/>
                                </button>
                                <button onClick={() => navigate('/change-password')} className="w-full flex items-center justify-between p-3 hover:bg-neutral-50 rounded-xl transition-colors text-left group">
                                    <span className="flex items-center gap-3 text-sm font-bold text-neutral-700 group-hover:text-amber-600"><Lock size={16}/> Đổi mật khẩu bảo mật</span><ChevronRight size={14} className="text-neutral-400"/>
                                </button>
                                <button className="w-full flex items-center justify-between p-3 hover:bg-neutral-50 rounded-xl transition-colors text-left group">
                                    <span className="flex items-center gap-3 text-sm font-bold text-neutral-700 group-hover:text-amber-600"><Globe size={16}/> Ngôn ngữ mặc định (VI)</span><ChevronRight size={14} className="text-neutral-400"/>
                                </button>
                            </div>
                            
                            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 text-red-600 font-bold bg-red-50 hover:bg-red-500 hover:text-white px-4 py-3 rounded-xl transition-all text-sm">
                                <LogOut size={16} /> Đăng xuất tài khoản
                            </button>
                        </div>

                    </div>
                </div>
            </div>
            
            <style>{`
                @keyframes shimmer { 100% { transform: translateX(300%); } }
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in-up { animation: fadeInUp 0.5s ease-out forwards; }
                .delay-100 { animation-delay: 0.1s; }
                .delay-200 { animation-delay: 0.2s; }
            `}</style>
        </div>
    );
}