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
    const [userName, setUserName] = useState('Bạn');
    const [userRole, setUserRole] = useState('user');
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

                // 1. Lấy thông tin cá nhân và gói cước (Role)
                const profileData = profileRes.data?.data || profileRes.data;
                if (profileData) {
                    setUserName(profileData.fullName || profileData.FullName || 'Bạn');
                    setUserRole((profileData.role || profileData.Role || 'user').toLowerCase());
                }

                // 2. Lấy danh sách lịch sử phỏng vấn
                const historyData = Array.isArray(historyRes.data) 
                    ? historyRes.data 
                    : (historyRes.data?.data ?? []);
                setSessions(historyData);

                // 3. Xử lý Dữ liệu biểu đồ Line (Trải phẳng object cho Recharts dễ đọc)
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

                // 4. Lấy dữ liệu Radar Chart (Lỗ hổng kỹ năng)
                if (historyData.length > 0) {
                    // Ưu tiên lấy jobDescriptionId từ phiên phỏng vấn mới nhất
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
                        // Fallback: Nếu backend chưa trả về JdId trong lịch sử, tự dựng data từ tháng gần nhất
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

    // --- Tính toán thống kê từ dữ liệu thật ---
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
        <div className="min-h-screen bg-[#F4F4F5] p-4 sm:p-6 md:p-8 font-sans text-neutral-900 selection:bg-amber-100">
            {/* Top Navigation */}
            <div className="max-w-[1400px] mx-auto flex justify-between items-center mb-8 animate-fade-in-down">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                    <div className="bg-neutral-900 p-1.5 rounded-lg text-amber-400"><Crown size={20} strokeWidth={3} /></div>
                    <span className="text-xl font-bold tracking-tight text-neutral-900 hidden sm:block">AI Interviewer</span>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => navigate('/')} className="p-2.5 bg-white border border-neutral-200 rounded-full shadow-sm hover:shadow-md hover:text-amber-600 transition-all"><Home size={18} /></button>
                    <button onClick={() => navigate('/profile')} className="p-2.5 bg-white border border-neutral-200 rounded-full shadow-sm hover:shadow-md hover:text-amber-600 transition-all"><User size={18} /></button>
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto space-y-6">

                {/* Error Banner */}
                {error && (
                    <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 font-semibold">
                        <AlertCircle size={20} className="shrink-0" />
                        <span>{error}</span>
                        <button onClick={() => window.location.reload()} className="ml-auto text-xs underline underline-offset-2">Thử lại</button>
                    </div>
                )}

                {/* --- BANNER --- */}
                <div className="relative overflow-hidden bg-neutral-900 rounded-3xl p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-neutral-800 animate-fade-in-up">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-amber-500/20 to-transparent rounded-full blur-[80px] pointer-events-none translate-x-1/4 -translate-y-1/4" />
                    <div className="relative z-10 text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 font-bold text-xs uppercase mb-3 border border-white/10 backdrop-blur-md">
                            <Sparkles size={14} /> Ready for 2026
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-white mb-2">Chào mừng, {userName}!</h1>
                        <p className="text-neutral-400 text-base max-w-xl">
                            {sessions.length === 0
                                ? 'Bạn chưa có bài phỏng vấn nào. Hãy bắt đầu ngay!'
                                : `Bạn đã hoàn thành ${completedSessions.length} bài phỏng vấn. Giữ vững phong độ nhé!`}
                        </p>
                    </div>
                    <button onClick={() => navigate('/interview')}
                        className="relative z-10 w-full md:w-auto px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl font-black text-lg shadow-lg hover:scale-105 transition-transform flex items-center justify-center gap-2 group">
                        <Play size={20} fill="currentColor" className="group-hover:animate-pulse" />
                        {sessions.length === 0 ? 'Bắt đầu Phỏng vấn' : 'Tiếp tục luyện tập'}
                    </button>
                </div>

                {/* --- 4 STAT CARDS --- */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 animate-fade-in-up delay-100">
                    {[
                        { title: 'Đã phỏng vấn',    value: sessions.length,      icon: Target,     color: 'text-blue-500',   bg: 'bg-blue-50' },
                        { title: 'Điểm trung bình', value: avgScore || '—',      icon: TrendingUp, color: 'text-amber-500',  bg: 'bg-amber-50' },
                        { title: 'Chuỗi (Streak)',  value: `${streak} Ngày`,     icon: Flame,      color: 'text-orange-500', bg: 'bg-orange-50' },
                        { title: 'JD Đã phân tích', value: sessions.length,      icon: FileText,   color: 'text-green-500',  bg: 'bg-green-50' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white p-5 rounded-3xl shadow-sm border border-neutral-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                            <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}><stat.icon size={24} /></div>
                            <div>
                                <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">{stat.title}</p>
                                <p className="text-2xl font-black text-neutral-900">{stat.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid lg:grid-cols-12 gap-6">
                    {/* --- CỘT TRÁI --- */}
                    <div className="lg:col-span-8 space-y-6">

                        {/* BIỂU ĐỒ TIẾN ĐỘ & RADAR */}
                        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-neutral-100 animate-fade-in-up delay-200">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
                                <div>
                                    <h2 className="text-xl font-black text-neutral-900">
                                        {viewMode === 'line' ? 'Biểu đồ tiến độ' : 'Phân tích lỗ hổng kỹ năng'}
                                    </h2>
                                    <p className="text-sm text-neutral-500 font-medium">
                                        {viewMode === 'line' ? 'Trung bình điểm số theo các tháng gần nhất' : 'Dựa trên công việc bạn phỏng vấn gần nhất'}
                                    </p>
                                </div>
                                
                                {/* Nút Toggle giữa 2 biểu đồ */}
                                <div className="flex bg-neutral-100 p-1 rounded-xl w-fit">
                                    <button 
                                        onClick={() => setViewMode('line')}
                                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'line' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'}`}
                                    >
                                        Tiến độ
                                    </button>
                                    <button 
                                        onClick={() => setViewMode('radar')}
                                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'radar' ? 'bg-white shadow-sm text-amber-600' : 'text-neutral-500 hover:text-neutral-700'}`}
                                    >
                                        Kỹ năng
                                    </button>
                                </div>
                            </div>
                            
                            <div className="h-72 w-full">
                                {sessions.length === 0 ? (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200">
                                        <BarChart3 size={32} className="mb-2 opacity-50 text-neutral-400" />
                                        <p className="font-bold text-sm">Cần hoàn thành ít nhất 1 bài phỏng vấn để vẽ biểu đồ.</p>
                                    </div>
                                ) : viewMode === 'line' ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F5F5F5" />
                                            <XAxis 
                                                dataKey="month" 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{ fontSize: 12, fill: '#A3A3A3', fontWeight: 600 }} 
                                                dy={10} 
                                            />
                                            <YAxis 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{ fontSize: 12, fill: '#A3A3A3', fontWeight: 600 }} 
                                                domain={[0, 100]} 
                                            />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontWeight: 600 }}
                                                itemStyle={{ fontSize: '13px' }}
                                                labelStyle={{ color: '#A3A3A3', marginBottom: '4px', fontSize: '12px' }}
                                                cursor={{ stroke: '#F59E0B', strokeWidth: 1, strokeDasharray: '4 4' }}
                                            />
                                            <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600, paddingTop: '10px' }} />
                                            
                                            <Line 
                                                type="monotone" 
                                                dataKey="averageScore" 
                                                name="Điểm Trung Bình" 
                                                stroke="#F59E0B" 
                                                strokeWidth={3} 
                                                dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} 
                                                activeDot={{ r: 6, stroke: '#F59E0B', strokeWidth: 2 }} 
                                            />
                                            
                                            {Object.keys(chartData[0] || {}).filter(k => k !== 'month' && k !== 'averageScore').map((criteriaKey, idx) => {
                                                const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#EC4899'];
                                                return (
                                                    <Line 
                                                        key={criteriaKey}
                                                        type="monotone" 
                                                        dataKey={criteriaKey} 
                                                        name={criteriaKey} 
                                                        stroke={colors[idx % colors.length]} 
                                                        strokeWidth={2} 
                                                        dot={false} 
                                                    />
                                                );
                                            })}
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                                            <PolarGrid stroke="#E5E5E5" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#525252', fontSize: 13, fontWeight: 700 }} />
                                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                            <Radar 
                                                name="Điểm kỹ năng" 
                                                dataKey="score" 
                                                stroke="#F59E0B" 
                                                strokeWidth={2}
                                                fill="#F59E0B" 
                                                fillOpacity={0.4} 
                                            />
                                            <Tooltip 
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontWeight: 600 }}
                                            />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>

                        {/* FEEDBACK & GỢI Ý */}
                        <div className="grid md:grid-cols-2 gap-6 animate-fade-in-up delay-300">
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-3xl border border-blue-100">
                                <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2"><MessageSquare size={18} /> Nhận xét từ AI</h3>
                                {sessions.length > 0 ? (
                                    <div className="space-y-3">
                                        <div className="bg-white/60 p-3 rounded-xl">
                                            <p className="text-xs text-green-600 font-bold mb-1 flex items-center gap-1"><CheckCircle2 size={14} /> Ghi nhận</p>
                                            <p className="text-sm text-neutral-700 font-medium">Hệ thống ghi nhận bạn đã bắt đầu hành trình luyện tập. Cố lên!</p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-blue-600/70 font-medium bg-white/50 p-4 rounded-xl text-center border border-blue-100/50">
                                        Hãy hoàn thành 1 bài phỏng vấn để AI có thể đánh giá kỹ năng của bạn.
                                    </p>
                                )}
                            </div>

                            <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm relative overflow-hidden group">
                                <div className="absolute -right-4 -top-4 text-neutral-50 group-hover:text-amber-50 transition-colors"><BookOpen size={100} /></div>
                                <div className="relative z-10">
                                    <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-[10px] font-black uppercase rounded-md mb-3 inline-block">Gợi ý hôm nay</span>
                                    <h3 className="font-black text-neutral-900 text-lg mb-1">Mô hình STAR</h3>
                                    <p className="text-sm text-neutral-500 mb-4">Kỹ thuật trả lời phỏng vấn giúp bạn ăn điểm tuyệt đối với nhà tuyển dụng.</p>
                                    <button onClick={() => navigate('/interview')} className="text-sm font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1">Luyện ngay <ChevronRight size={16} /></button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- CỘT PHẢI (Lịch sử) --- */}
                    <div className="lg:col-span-4 space-y-6 animate-fade-in-up delay-400">
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-100 h-full flex flex-col">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-lg font-black text-neutral-900 flex items-center gap-2"><Clock className="text-amber-500" size={20} /> Lịch sử</h2>
                                <span className="text-xs font-bold text-neutral-500 bg-neutral-100 px-3 py-1 rounded-full">{sessions.length} buổi</span>
                            </div>

                            <div className="space-y-3 flex-1 max-h-[350px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-neutral-200">
                                {sessions.length > 0 ? sessions.map((session, idx) => {
                                    const score = session.score ?? session.Score ?? session.overallScore ?? session.OverallScore;
                                    const title = session.jdTitle ?? session.jobTitle ?? session.title ?? session.JdTitle ?? 'Phiên phỏng vấn';
                                    const id = session.id ?? session.sessionId;
                                    const rawDate = session.date ?? session.createdAt ?? session.startedAt;

                                    return (
                                        <div
                                            key={id ?? idx}
                                            onClick={() => navigate(`/dashboard/session/${id}`)}
                                            className="p-4 rounded-2xl border border-neutral-100 hover:border-amber-200 hover:shadow-md transition-all cursor-pointer bg-neutral-50 hover:bg-white group"
                                        >
                                            <h4 className="font-bold text-neutral-900 text-sm line-clamp-1 group-hover:text-amber-600">
                                                {title}
                                            </h4>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-xs font-medium text-neutral-500">
                                                    {rawDate ? new Date(rawDate).toLocaleDateString('vi-VN') : '—'}
                                                </span>
                                                {score != null ? (
                                                    <span className="text-sm font-black text-green-500">{score} điểm</span>
                                                ) : (
                                                    <span className="text-[10px] font-bold px-2 py-1 bg-amber-100 text-amber-700 rounded-md">Đang dở</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <div className="text-center py-10 opacity-50">
                                        <FileText size={40} className="mx-auto mb-3 text-neutral-300" />
                                        <p className="text-sm font-bold text-neutral-500">Trống</p>
                                    </div>
                                )}
                            </div>

                            {/* Khối quản lý Gói Cước dựa trên dữ liệu thật */}
                            <div className="mt-6 pt-6 border-t border-neutral-100">
                                {userRole === 'premium' || userRole === 'pro' || userRole === 'ultra' ? (
                                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 text-center">
                                        <div className="flex items-center justify-center gap-1.5 font-black text-amber-700 text-sm uppercase tracking-wide">
                                            <Crown size={16} className="fill-amber-500 text-amber-600" /> Tài khoản Premium Pro
                                        </div>
                                        <p className="text-xs font-semibold text-neutral-500 mt-1">Bạn đang có đặc quyền phỏng vấn không giới hạn.</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-neutral-600 font-bold">Lượt miễn phí trong tháng</span>
                                            <span className="font-black text-amber-600">{Math.min(sessions.length, 3)}/3</span>
                                        </div>
                                        <div className="w-full bg-neutral-100 rounded-full h-2 mb-3">
                                            <div className="bg-amber-500 h-full rounded-full transition-all duration-500"
                                                style={{ width: `${Math.min((sessions.length / 3) * 100, 100)}%` }} />
                                        </div>
                                        <button onClick={() => navigate('/#pricing')}
                                            className="w-full py-2.5 bg-neutral-900 text-white text-xs font-bold rounded-xl hover:bg-black transition-colors flex items-center justify-center gap-2">
                                            <Crown size={14} className="text-amber-400" /> Nâng cấp Pro (99k)
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes fadeInUp   { from { opacity:0; transform:translateY(20px);  } to { opacity:1; transform:translateY(0); } }
                @keyframes fadeInDown { from { opacity:0; transform:translateY(-20px); } to { opacity:1; transform:translateY(0); } }
                .animate-fade-in-up   { animation: fadeInUp   0.6s ease-out forwards; }
                .animate-fade-in-down { animation: fadeInDown 0.6s ease-out forwards; }
                .delay-100 { animation-delay: 0.1s; }
                .delay-200 { animation-delay: 0.2s; }
                .delay-300 { animation-delay: 0.3s; }
                .delay-400 { animation-delay: 0.4s; }
            `}</style>
        </div>
    );
}