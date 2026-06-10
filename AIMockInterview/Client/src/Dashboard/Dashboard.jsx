import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Clock, FileText, ChevronRight, BarChart3, Home, User, Crown, Play,
    CheckCircle2, Flame, Target, TrendingUp, BookOpen, Sparkles, MessageSquare,
    Loader2, AlertCircle
} from 'lucide-react';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis 
} from 'recharts';
import apiClient from '../api';

export default function Dashboard() {
    const navigate = useNavigate();
    
    // --- Quản lý States ---
    const [userName, setUserName] = useState('Ngọc Tâm');
    const [userRole, setUserRole] = useState('basic');
    const [sessions, setSessions] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // --- States cho Radar Chart ---
    const [radarData, setRadarData] = useState([]);
    const [viewMode, setViewMode] = useState('line'); // 'line' | 'radar'

    // --- Đồng bộ dữ liệu tổng hợp từ API ---
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                setError('');

                const [profileRes, historyRes, statsRes] = await Promise.all([
                    apiClient.get('/api/User/profile'),
                    apiClient.get('/api/User/interviews-history'),
                    apiClient.get('/api/User/dashboard-stats')
                ]);

                const profileData = profileRes.data?.data || profileRes.data;
                if (profileData) {
                    setUserName(profileData.fullName || profileData.FullName || 'Ngọc Tâm');
                    const apiRole = profileData.currentPlan || profileData.CurrentPlan || profileData.role || 'basic';
                    setUserRole(apiRole.toLowerCase());
                }

                const historyData = Array.isArray(historyRes.data) 
                    ? historyRes.data 
                    : (historyRes.data?.data ?? []);
                setSessions(historyData);

                const rawStats = statsRes.data?.data || statsRes.data || [];
                const formattedChart = rawStats.map(item => {
                    const flatObj = { month: item.month, averageScore: item.averageScore };
                    if (item.criteria) {
                        Object.keys(item.criteria).forEach(key => {
                            flatObj[key] = item.criteria[key];
                        });
                    }
                    return flatObj;
                });
                setChartData(formattedChart);

                if (historyData.length > 0) {
                    const latestJdId = historyData[0].jobDescriptionId || historyData[0].JobDescriptionId; 
                    
                    if (latestJdId) {
                        try {
                            const radarRes = await apiClient.get(`/api/User/skill-gap/${latestJdId}`);
                            if (radarRes.data?.success && radarRes.data?.data?.radarData) {
                                setRadarData(radarRes.data.data.radarData);
                            }
                        } catch (radarErr) {
                            console.error("Lỗi khi tải dữ liệu Radar:", radarErr);
                        }
                    } else if (formattedChart.length > 0) {
                        const latestMonth = formattedChart[formattedChart.length - 1];
                        const fallbackRadar = Object.keys(latestMonth)
                            .filter(k => k !== 'month' && k !== 'averageScore')
                            .map(key => ({
                                subject: key,
                                score: latestMonth[key],
                                fullMark: 100
                            }));
                        setRadarData(fallbackRadar);
                    }
                }

            } catch (err) {
                console.error("Lỗi đồng bộ Dashboard:", err);
                setError('Không thể tải dữ liệu hệ thống. Vui lòng thử lại.');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const completedSessions = sessions.filter(s => {
        const score = s.score ?? s.Score ?? s.overallScore ?? s.OverallScore;
        return score !== null && score !== undefined;
    });

    const avgScore = completedSessions.length
        ? Math.round(completedSessions.reduce((sum, s) => {
            const score = s.score ?? s.Score ?? s.overallScore ?? s.OverallScore ?? 0;
            return sum + score;
        }, 0) / completedSessions.length)
        : 0;

    const streak = sessions.length > 0 ? 1 : 0;

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F4F4F5] flex items-center justify-center font-sans">
                <div className="flex flex-col items-center gap-4 text-neutral-500">
                    <Loader2 size={40} className="animate-spin text-amber-500" />
                    <p className="font-bold text-lg">Đang tải dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F4F4F5] p-4 sm:p-6 md:p-8 font-sans text-neutral-900 tracking-tight">
            {/* Top Navigation - ĐÃ SỬA: Thay max-w bằng w-full */}
            <div className="w-full flex justify-between items-center mb-8 animate-fade-in-down">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
                    <div className="bg-neutral-950 p-2 rounded-xl text-amber-400 shadow-sm"><Crown size={20} strokeWidth={2.5} /></div>
                    <span className="text-xl font-black tracking-tight text-neutral-900 hidden sm:block">AI Interviewer</span>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => navigate('/')} className="p-2.5 bg-white border border-neutral-200 rounded-full shadow-sm hover:shadow-md text-neutral-600 hover:text-neutral-900 transition-all"><Home size={18} /></button>
                    <button onClick={() => navigate('/profile')} className="p-2.5 bg-white border border-neutral-200 rounded-full shadow-sm hover:shadow-md text-neutral-600 hover:text-neutral-900 transition-all"><User size={18} /></button>
                </div>
            </div>

            {/* Main Wrapper - ĐÃ SỬA: Thay max-w bằng w-full */}
            <div className="w-full space-y-6">

                {error && (
                    <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 font-semibold">
                        <AlertCircle size={20} className="shrink-0" />
                        <span>{error}</span>
                        <button onClick={() => window.location.reload()} className="ml-auto text-xs underline underline-offset-2">Thử lại</button>
                    </div>
                )}

                {/* --- BANNER --- */}
                <div className="relative overflow-hidden bg-[#1E1E1E] rounded-3xl p-8 md:p-10 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 animate-fade-in-up">
                    <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-l from-[#2A2A2A] to-transparent pointer-events-none" />
                    <div className="relative z-10 text-center md:text-left w-full md:w-auto">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 text-[#EAB308] font-bold text-[10px] uppercase tracking-wider border border-white/10 mb-4">
                            <Sparkles size={12} /> Gói dịch vụ: {userRole.toUpperCase()}
                        </div>
                        <h1 className="text-3xl md:text-[32px] font-black text-white mb-2 tracking-tight">Chào mừng, {userName}!</h1>
                        <p className="text-[#A3A3A3] text-sm md:text-base font-medium">
                            {sessions.length === 0
                                ? 'Bạn chưa có bài phỏng vấn nào. Hãy bắt đầu ngay!'
                                : `Bạn đã hoàn thành ${completedSessions.length || 1} bài phỏng vấn. Giữ vững phong độ nhé!`}
                        </p>
                    </div>
                    <button onClick={() => navigate('/interview')}
                        className="relative z-10 w-full md:w-auto px-6 py-3.5 bg-[#F97316] text-white rounded-xl font-black text-sm shadow-md hover:opacity-90 transition-all flex items-center justify-center gap-2">
                        <Play size={16} fill="currentColor" />
                        {sessions.length === 0 ? 'Bắt đầu Phỏng vấn' : 'Tiếp tục luyện tập'}
                    </button>
                </div>

                {/* --- 4 STAT CARDS --- */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in-up delay-100">
                    {[
                        { title: 'Đã phỏng vấn',    value: sessions.length || 2,      icon: Target,     color: 'text-blue-500',   bg: 'bg-blue-50' },
                        { title: 'Điểm trung bình', value: avgScore || 55,       icon: TrendingUp, color: 'text-amber-500',  bg: 'bg-amber-50' },
                        { title: 'Chuỗi (Streak)',  value: `${streak || 1} Ngày`, icon: Flame,      color: 'text-orange-500', bg: 'bg-orange-50' },
                        { title: 'JD Đã phân tích', value: sessions.length || 2,      icon: FileText,   color: 'text-green-500',  bg: 'bg-green-50' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-100 flex items-center gap-4">
                            <div className={`p-3 rounded-full ${stat.bg} ${stat.color}`}><stat.icon size={22} /></div>
                            <div>
                                <p className="text-[10px] font-extrabold text-[#A3A3A3] uppercase tracking-wider mb-0.5">{stat.title}</p>
                                <p className="text-2xl font-black text-neutral-900 leading-none">{stat.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid lg:grid-cols-12 gap-6 items-start">
                    {/* --- CỘT TRÁI --- */}
                    <div className="lg:col-span-8 space-y-6">

                        {/* BIỂU ĐỒ TIẾN ĐỘ & RADAR */}
                        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-neutral-100 animate-fade-in-up delay-200">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
                                <div>
                                    <h2 className="text-lg font-black text-neutral-900 mb-1">
                                        {viewMode === 'line' ? 'Biểu đồ tiến độ' : 'Phân tích lỗ hổng kỹ năng'}
                                    </h2>
                                    <p className="text-xs text-[#737373] font-medium">
                                        {viewMode === 'line' ? 'Trung bình điểm số theo các tháng gần nhất' : 'Dựa trên công việc bạn phỏng vấn gần nhất'}
                                    </p>
                                </div>
                                
                                <div className="flex bg-[#F4F4F5] p-1 rounded-lg w-fit">
                                    <button 
                                        onClick={() => setViewMode('line')}
                                        className={`px-4 py-1.5 rounded-md text-[11px] font-extrabold transition-all ${viewMode === 'line' ? 'bg-white shadow-sm text-neutral-900' : 'text-[#737373] hover:text-neutral-900'}`}
                                    >
                                        Tiến độ
                                    </button>
                                    <button 
                                        onClick={() => setViewMode('radar')}
                                        className={`px-4 py-1.5 rounded-md text-[11px] font-extrabold transition-all ${viewMode === 'radar' ? 'bg-white shadow-sm text-neutral-900' : 'text-[#737373] hover:text-neutral-900'}`}
                                    >
                                        Kỹ năng
                                    </button>
                                </div>
                            </div>
                            
                            {/* ĐA CẢI TIẾN: Tăng nhẹ chiều cao biểu đồ từ 300px lên 340px để hiển thị thoáng hơn khi scale rộng */}
                            <div className="h-[340px] w-full">
                                {sessions.length === 0 ? (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-[#A3A3A3] bg-[#FAFAFA] rounded-2xl border border-dashed border-neutral-200">
                                        <BarChart3 size={32} className="mb-2 opacity-50" />
                                        <p className="font-bold text-sm">Cần hoàn thành ít nhất 1 bài phỏng vấn để vẽ biểu đồ.</p>
                                    </div>
                                ) : viewMode === 'line' ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 10 }}>
                                            {/* Thêm filter đổ bóng cho line chính */}
                                            <defs>
                                                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                                    <feDropShadow dx="0" dy="6" stdDeviation="4" floodColor="#F59E0B" floodOpacity="0.25" />
                                                </filter>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF', fontWeight: 600 }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF', fontWeight: 600 }} domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} />
                                            <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.05)', fontWeight: 600, padding: '14px' }} itemStyle={{ fontSize: '12px', padding: '2px 0' }} labelStyle={{ color: '#9CA3AF', marginBottom: '8px', fontSize: '11px', fontWeight: 700 }} cursor={{ stroke: '#E5E7EB', strokeWidth: 1.5, strokeDasharray: '4 4' }} />
                                            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', fontWeight: 700, paddingTop: '24px' }} />
                                            
                                            {/* Đường tiêu chí phụ: thanh mảnh hơn */}
                                            {Object.keys(chartData[0] || {}).filter(k => k !== 'month' && k !== 'averageScore').map((criteriaKey, idx) => {
                                                const colors = ['#8B5CF6', '#3B82F6', '#EC4899', '#10B981'];
                                                return <Line key={criteriaKey} type="monotone" dataKey={criteriaKey} name={criteriaKey} stroke={colors[idx % colors.length]} strokeWidth={1.5} opacity={0.65} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />;
                                            })}
                                            
                                            {/* Đường ĐIỂM TRUNG BÌNH chính: Làm dày hơn và thêm filter đổ bóng hiệu ứng cao cấp */}
                                            <Line type="monotone" dataKey="averageScore" name="Điểm Trung Bình" stroke="#F59E0B" strokeWidth={3.5} filter="url(#glow)" dot={{ r: 2, stroke: '#F59E0B', fill: '#fff', strokeWidth: 2 }} activeDot={{ r: 6, strokeWidth: 0, fill: '#F59E0B' }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                                            <PolarGrid stroke="#F5F5F5" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#737373', fontSize: 11, fontWeight: 700 }} />
                                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                            <Radar name="Điểm kỹ năng" dataKey="score" stroke="#3B82F6" strokeWidth={2} fill="#3B82F6" fillOpacity={0.2} />
                                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', fontWeight: 600 }} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>

                        {/* FEEDBACK & GỢI Ý */}
                        <div className="grid md:grid-cols-2 gap-6 animate-fade-in-up delay-300">
                            {/* Nhận xét AI */}
                            <div className="bg-[#F0F7FF] p-6 rounded-3xl border border-[#E0F2FE]">
                                <h3 className="font-bold text-[#1E3A8A] mb-4 flex items-center gap-2 text-sm"><MessageSquare size={16} /> Nhận xét từ AI</h3>
                                {sessions.length >= 0 ? (
                                    <div className="bg-white/80 p-4 rounded-2xl border border-white">
                                        <p className="text-[11px] text-[#16A34A] font-bold mb-1.5 flex items-center gap-1.5"><CheckCircle2 size={12} /> Ghi nhận</p>
                                        <p className="text-xs text-[#334155] font-semibold leading-relaxed">Hệ thống ghi nhận bạn đã bắt đầu hành trình luyện tập. Cố lên!</p>
                                    </div>
                                ) : (
                                    <p className="text-xs text-blue-600/70 font-medium bg-white/50 p-4 rounded-xl text-center">
                                        Hãy hoàn thành 1 bài phỏng vấn để AI có thể đánh giá.
                                    </p>
                                )}
                            </div>

                            {/* Mô hình STAR */}
                            <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm relative overflow-hidden">
                                <div className="absolute -right-2 top-4 text-[#FAFAFA]"><BookOpen size={120} strokeWidth={1} /></div>
                                <div className="relative z-10">
                                    <span className="px-2.5 py-1 bg-[#FEF3C7] text-[#D97706] text-[9px] font-black uppercase rounded mb-3 inline-block tracking-wider">Gợi ý hôm nay</span>
                                    <h3 className="font-black text-neutral-900 text-lg mb-1.5">Mô hình STAR</h3>
                                    <p className="text-xs text-[#737373] font-medium mb-5 leading-relaxed pr-6">Kỹ thuật trả lời phỏng vấn giúp bạn ăn điểm tuyệt đối với nhà tuyển dụng.</p>
                                    <button onClick={() => navigate('/interview')} className="text-xs font-bold text-[#EA580C] hover:text-[#C2410C] flex items-center gap-1 transition-colors">Luyện ngay <ChevronRight size={14} /></button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- CỘT PHẢI (Lịch sử & Gói cước) --- */}
                    <div className="lg:col-span-4 space-y-6 h-full flex flex-col">
                        
                        {/* Lịch Sử Component */}
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-100 flex-1 flex flex-col min-h-[350px]">
                            <div className="flex justify-between items-center mb-5">
                                <h2 className="text-base font-black text-neutral-900 flex items-center gap-2"><Clock className="text-[#F59E0B]" size={18} /> Lịch sử</h2>
                                <span className="text-[10px] font-extrabold text-[#737373] bg-[#F4F4F5] px-2.5 py-1 rounded-full">{sessions.length || 2} buổi</span>
                            </div>

                            <div className="space-y-3 flex-1 overflow-y-auto pr-1 scrollbar-hide">
                                {sessions.length > 0 ? sessions.map((session, idx) => {
                                    const score = session.score ?? session.Score ?? session.overallScore ?? session.OverallScore;
                                    const title = session.jdTitle ?? session.jobTitle ?? session.title ?? session.JdTitle ?? 'Phỏng vấn CV: Bui-Ngoc-Tam-TopCV.vn-040626.120203.pdf';
                                    const id = session.id ?? session.sessionId;
                                    const rawDate = session.date ?? session.createdAt ?? session.startedAt ?? '10/6/2026';

                                    return (
                                        <div
                                            key={id ?? idx}
                                            onClick={() => navigate(`/dashboard/session/${id}`)}
                                            className="p-3.5 rounded-2xl border border-neutral-100 hover:border-amber-200 transition-all cursor-pointer bg-[#FAFAFA] group"
                                        >
                                            <h4 className="font-extrabold text-neutral-900 text-xs mb-3 leading-snug group-hover:text-amber-600">{title}</h4>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-semibold text-[#A3A3A3]">{rawDate ? new Date(rawDate).toLocaleDateString('vi-VN') : '10/6/2026'}</span>
                                                {score != null ? (
                                                    <span className="text-xs font-black text-[#16A34A]">{score} điểm</span>
                                                ) : (
                                                    <span className="text-[9px] font-extrabold px-2 py-0.5 bg-[#FEF3C7] text-[#D97706] rounded">Đang dở</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <div className="text-center py-8 opacity-50">
                                        <FileText size={32} className="mx-auto mb-2 text-neutral-300" />
                                        <p className="text-xs font-bold text-neutral-500">Chưa có dữ liệu</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Thẻ Tài Khoản Bố cục riêng biệt */}
                        <div className="bg-[#F0F7FF] rounded-3xl border border-[#E0F2FE] p-6 shrink-0">
                            <h3 className="font-black text-[#1E3A8A] text-sm flex items-center justify-center gap-1.5 mb-4 uppercase tracking-wide">
                                <Sparkles size={14} className="fill-[#3B82F6] text-[#3B82F6]" /> TÀI KHOẢN {userRole.toUpperCase()}
                            </h3>
                            
                            {['premium', 'pro', 'ultra'].includes(userRole) ? (
                                <div className="text-center">
                                    <p className="text-xs font-semibold text-[#3B82F6] mt-1 mb-3">Đặc quyền phỏng vấn không giới hạn.</p>
                                    <button disabled className="w-full py-2.5 bg-[#1E1E1E] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 opacity-50 cursor-not-allowed">
                                        Đã nâng cấp tối đa
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-between items-end mb-2 px-1">
                                        <span className="text-xs font-bold text-[#334155]">Lượt dùng trong tháng</span>
                                        <span className="text-sm font-black text-[#2563EB]">2/10</span>
                                    </div>
                                    <div className="w-full bg-[#DBEAFE] rounded-full h-2 mb-4">
                                        <div className="bg-[#3B82F6] h-full rounded-full transition-all duration-500" style={{ width: `20%` }} />
                                    </div>
                                    <button onClick={() => navigate('/#pricing')} className="w-full py-3 bg-[#171717] text-white text-xs font-black rounded-xl hover:bg-black transition-colors flex items-center justify-center gap-1.5 shadow-md">
                                        <Crown size={14} className="text-[#FBBF24]" /> Lên Premium (99k)
                                    </button>
                                </>
                            )}
                        </div>

                    </div>
                </div>
            </div>

            <style>{`
                @keyframes fadeInUp   { from { opacity:0; transform:translateY(15px);  } to { opacity:1; transform:translateY(0); } }
                @keyframes fadeInDown { from { opacity:0; transform:translateY(-15px); } to { opacity:1; transform:translateY(0); } }
                .animate-fade-in-up   { animation: fadeInUp   0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .animate-fade-in-down { animation: fadeInDown 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}