import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
    Users, TrendingUp, Crown, Activity, 
    Server, Calendar, Hash, Globe, MapPin, Clock, History, Trash2, AlignLeft
} from 'lucide-react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, Legend 
} from 'recharts';
import toast from 'react-hot-toast';
import { 
    getDashboard, getUsers, getTransactions, getInterviews, 
    getVisitorStats, clearVisitorStats 
} from '../services/adminService'; 

const PIE_COLORS = ['#9ca3af', '#f59e0b', '#8b5cf6', '#3b82f6', '#ec4899'];

const StatCard = ({ icon: IconComponent, title, value, colorClass, iconClass, trend }) => (
    <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col gap-2 relative overflow-hidden transition-all hover:shadow-md">
        <div className="flex justify-between items-start mb-2">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconClass}`}>
                <IconComponent size={24} />
            </div>
            {trend && (
                <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                    <TrendingUp size={12} /> {trend}
                </span>
            )}
        </div>
        <p className="text-neutral-500 font-bold text-sm uppercase tracking-wider">{title}</p>
        <h3 className="text-3xl font-black text-neutral-900 truncate">{value}</h3>
        <div className={`absolute -right-4 -bottom-4 opacity-[0.03] ${colorClass}`}>
            <IconComponent size={120} />
        </div>
    </div>
);

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-neutral-900 text-white p-4 rounded-xl shadow-2xl border border-neutral-700">
                <p className="font-bold mb-2 text-amber-400">{label}</p>
                {payload.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm font-medium">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                        <span className="text-neutral-300">{entry.name}:</span>
                        <span className="font-bold">
                            {entry.name.includes("Doanh thu") 
                                ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(entry.value)
                                : `${entry.value.toLocaleString()} lượt`
                            }
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

// ─── COMPONENT THỐNG KÊ TRUY CẬP (DỮ LIỆU THẬT TỪ BE) ─────────────────────────
const VisitorStats = () => {
    const [stats, setStats] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    const fetchStats = useCallback(async () => {
        try {
            const res = await getVisitorStats();
            setStats(res.data.data);
        } catch (error) {
            console.error("Lỗi lấy thống kê:", error);
        }
    }, []);

    useEffect(() => {
        // Bỏ qua cảnh báo set state của React Hooks
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchStats();
        
        // Cập nhật dữ liệu mỗi 5 giây
        const interval = setInterval(() => {
            fetchStats();
            setCurrentTime(new Date());
        }, 5000);
        return () => clearInterval(interval);
    }, [fetchStats]);

    const handleClearHistory = async () => {
        if(window.confirm("Bạn có chắc muốn xóa toàn bộ dữ liệu thống kê lượt truy cập?")) {
            try {
                await clearVisitorStats();
                toast.success("Đã xóa lịch sử truy cập!");
                fetchStats();
            } catch (err) {
                console.error("Lỗi khi xóa lịch sử truy cập:", err);
                toast.error("Lỗi khi xóa lịch sử!");
            }
        }
    };

    const formatUptime = (totalSeconds) => {
        if (!totalSeconds) return "0 giây";
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        return `${h} giờ ${m} phút ${s} giây`;
    };

    if (!stats) return <div className="p-8 text-center font-bold text-neutral-500">Đang tải thống kê truy cập...</div>;

    return (
        <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm p-6 md:p-8 mt-6">
            <h2 className="text-xl font-black text-neutral-900 mb-6 flex items-center justify-center gap-2">
                <AlignLeft size={24} className="text-neutral-800" /> Thống kê lượt truy cập Server
            </h2>

            <div className="space-y-4 mb-8 max-w-3xl mx-auto text-sm">
                <div className="flex justify-between items-center py-3 border-b border-neutral-100">
                    <span className="flex items-center gap-3 text-neutral-700 font-bold"><Users size={18} className="text-neutral-500" /> Địa chỉ IP của bạn:</span>
                    <span className="font-black text-blue-600">{stats.currentIp === "::1" || stats.currentIp === "127.0.0.1" ? "127.0.0.1 (Localhost)" : stats.currentIp}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-neutral-100">
                    <span className="flex items-center gap-3 text-neutral-700 font-bold"><Calendar size={18} className="text-neutral-500" /> Số lượt truy cập hôm nay:</span>
                    <span className="font-black text-green-600">{stats.todayVisits}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-neutral-100">
                    <span className="flex items-center gap-3 text-neutral-700 font-bold"><Hash size={18} className="text-neutral-500" /> Tổng số lượt truy cập:</span>
                    <span className="font-black text-neutral-900">{stats.totalVisits}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-neutral-100">
                    <span className="flex items-center gap-3 text-neutral-700 font-bold"><Globe size={18} className="text-neutral-500" /> IP hoạt động nhiều nhất:</span>
                    <span className="font-black text-neutral-900">{stats.topIp === "::1" ? "Localhost" : stats.topIp}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-neutral-100">
                    <span className="flex items-center gap-3 text-neutral-700 font-bold"><MapPin size={18} className="text-neutral-500" /> Khu vực truy cập nhiều nhất:</span>
                    <span className="font-black text-neutral-900">{stats.topLocation}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-neutral-100">
                    <span className="flex items-center gap-3 text-neutral-700 font-bold"><Clock size={18} className="text-neutral-500" /> Giờ server:</span>
                    <span className="font-black text-blue-600">{currentTime.toLocaleString('vi-VN')}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-neutral-100">
                    <span className="flex items-center gap-3 text-neutral-700 font-bold"><Server size={18} className="text-neutral-500" /> Uptime:</span>
                    <span className="font-black text-green-600">{formatUptime(stats.uptimeSeconds)}</span>
                </div>
            </div>

            <div className="bg-[#0f172a] rounded-2xl p-5 font-mono text-sm shadow-inner max-w-4xl mx-auto overflow-x-auto">
                <div className="text-cyan-400 font-bold mb-3">[Recent Visitors Log]</div>
                <div className="space-y-2">
                    {stats.recentLogs && stats.recentLogs.length > 0 ? stats.recentLogs.map((log, i) => (
                        <div key={i} className="text-green-400"><span className="text-emerald-500">{">"}</span> {log}</div>
                    )) : (
                        <div className="text-neutral-500 italic">Chưa có log truy cập nào...</div>
                    )}
                </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
                <button onClick={fetchStats} className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-blue-500 text-blue-600 font-bold hover:bg-blue-50 transition-colors">
                    <History size={18} /> Làm mới dữ liệu
                </button>
                <button onClick={handleClearHistory} className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-red-500 text-red-500 font-bold hover:bg-red-50 transition-colors">
                    <Trash2 size={18} /> Xoá lịch sử truy cập
                </button>
            </div>
        </div>
    );
};
// ─────────────────────────────────────────────────────────────────────────────

export const OverviewTab = () => {
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [interviews, setInterviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAllOverviewData = async () => {
            try {
                setLoading(true);
                const [statsRes, usersRes, transRes, interviewsRes] = await Promise.all([
                    getDashboard(),
                    getUsers(),
                    getTransactions(),
                    getInterviews()
                ]);

                setStats(statsRes.data);
                setUsers(usersRes.data || []);
                setTransactions(transRes.data || []);
                setInterviews(interviewsRes.data || []);
            } catch (error) {
                console.error("Lỗi khi tải dữ liệu tổng quan Dashboard:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAllOverviewData();
    }, []);

    const performanceData = useMemo(() => {
        const last6Months = Array.from({ length: 6 }, (_, i) => {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            return {
                month: d.getMonth(),
                year: d.getFullYear(),
                name: `Tháng ${d.getMonth() + 1}`,
                "Hệ thống": 0,
                "Doanh thu": 0
            };
        }).reverse();

        interviews.forEach(interview => {
            if (!interview.createdAt) return;
            const date = new Date(interview.createdAt);
            const match = last6Months.find(m => m.month === date.getMonth() && m.year === date.getFullYear());
            if (match) {
                match["Hệ thống"] += 1;
            }
        });

        transactions.forEach(tx => {
            if (tx.status !== 'Success' || !tx.createdAt) return;
            const date = new Date(tx.createdAt);
            const match = last6Months.find(m => m.month === date.getMonth() && m.year === date.getFullYear());
            if (match) {
                match["Doanh thu"] += (tx.amount || 0);
            }
        });

        return last6Months;
    }, [interviews, transactions]);

    const packageDistribution = useMemo(() => {
        const groups = transactions.reduce((acc, curr) => {
            if (curr.status === 'Success' && curr.planName) {
                acc[curr.planName] = (acc[curr.planName] || 0) + 1;
            }
            return acc;
        }, {});

        const totalPaidUsers = Object.values(groups).reduce((a, b) => a + b, 0);
        const totalRegisteredUsers = users.length;
        const freeUsersCount = Math.max(0, totalRegisteredUsers - totalPaidUsers);

        const distribution = Object.keys(groups).map(key => ({
            name: key,
            value: groups[key]
        }));

        distribution.unshift({
            name: 'Basic Free',
            value: freeUsersCount || totalRegisteredUsers
        });

        return distribution;
    }, [transactions, users]);

    if (loading) {
        return <div className="p-10 text-center font-bold text-neutral-500">Đang tải dữ liệu tổng quan...</div>;
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    icon={Users} title="Tổng User" 
                    value={stats?.totalUsers?.toLocaleString() || users.length.toLocaleString() || "0"} 
                    iconClass="bg-blue-50 text-blue-600" colorClass="text-blue-600" 
                />
                <StatCard 
                    icon={TrendingUp} title="Doanh thu tháng này" 
                    value={stats?.totalRevenueThisMonth ? `${stats.totalRevenueThisMonth.toLocaleString()}đ` : "0đ"} 
                    iconClass="bg-green-50 text-green-600" colorClass="text-green-600" 
                />
                <StatCard 
                    icon={Crown} title="Tài khoản Premium" 
                    value={stats?.activePremiumUsers?.toLocaleString() || "0"} 
                    iconClass="bg-amber-50 text-amber-600" colorClass="text-amber-600" 
                />
                <StatCard 
                    icon={Activity} title="Tổng lượt phỏng vấn" 
                    value={stats?.totalInterviews?.toLocaleString() || interviews.length.toLocaleString() || "0"} 
                    iconClass="bg-purple-50 text-purple-600" colorClass="text-purple-600" 
                />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] lg:col-span-2 flex flex-col">
                    <div className="mb-6">
                        <h3 className="font-black text-xl text-neutral-900">Mức độ tương tác & Tăng trưởng</h3>
                        <p className="text-sm font-medium text-neutral-500">Biểu đồ tổng hợp tần suất phỏng vấn và dòng tiền doanh thu phát sinh trong 6 tháng qua</p>
                    </div>
                    
                    <div className="w-full h-[400px] xl:h-[500px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={performanceData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorInterviews" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4}/>
                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6b7280', fontWeight: 600}} dy={10} />
                                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6b7280', fontWeight: 600}} />
                                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6b7280', fontWeight: 600}} tickFormatter={v => `${v/1000000}M`} />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: '#f3f4f6', strokeWidth: 2 }} />
                                
                                <Area yAxisId="left" type="monotone" dataKey="Hệ thống" name="Lượt phỏng vấn" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorInterviews)" />
                                <Area yAxisId="right" type="monotone" dataKey="Doanh thu" name="Doanh thu phát sinh" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col">
                    <div className="mb-6">
                        <h3 className="font-black text-xl text-neutral-900">Phân bổ Gói (Active)</h3>
                        <p className="text-sm font-medium text-neutral-500">Tỷ lệ cơ cấu tài khoản người dùng thực tế trên hệ thống</p>
                    </div>
                    
                    <div className="w-full flex-1 min-h-[300px] flex items-center justify-center relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={packageDistribution}
                                    innerRadius={80}
                                    outerRadius={120}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {packageDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    formatter={(value) => [`${value.toLocaleString()} Users`, 'Số lượng']}
                                />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '14px', fontWeight: 600, color: '#4b5563' }} />
                            </PieChart>
                        </ResponsiveContainer>
                        
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                            <span className="text-3xl font-black text-neutral-900">
                                {packageDistribution.reduce((a, b) => a + b.value, 0).toLocaleString()}
                            </span>
                            <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Users</span>
                        </div>
                    </div>
                </div>
            </div>

            <VisitorStats />

        </div>
    );
};