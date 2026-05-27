import React, { useState, useEffect, useMemo } from 'react';
import { Search, Ban, PlayCircle, Eye, Save, PlusCircle, Key, Star, ShieldAlert, ArrowDownToLine, Users, Edit, Trash2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast'; 
import {
    getUsers,
    toggleUserStatus,
    getInterviews,
    getTransactions
} from '../services/adminService';

export const UsersTab = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await getUsers();
            setUsers(response.data); 
        } catch (error) {
            console.error(error);
            toast.error("Không thể tải danh sách người dùng.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleAction = async (action, user) => {
        if (action === 'ban') {
            try {
                const response = await toggleUserStatus(user.id);
                if (response.data.success) {
                    toast.success(response.data.message);
                    fetchUsers(); 
                }
            } catch (error) {
                console.error(error);
                toast.error("Lỗi khi cập nhật trạng thái tài khoản.");
            }
        }
        if (action === 'credits') {
            const amount = prompt("Nhập số lượt phỏng vấn muốn cộng thêm:");
            if (amount) alert(`Tính năng cộng lượt đang được phát triển...`);
        }
        if (action === 'reset') {
            if (window.confirm(`Bạn có chắc chắn muốn reset mật khẩu của ${user.email}?`)) {
                alert(`Tính năng reset mật khẩu đang được phát triển...`);
            }
        }
    };

    const filteredUsers = users.filter(u => 
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-neutral-100 shadow-sm">
                <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Tìm tên, email..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-neutral-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20" 
                    />
                </div>
            </div>
            <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-[#FAFAFA] border-b border-neutral-100">
                            <th className="p-5 text-sm font-bold text-neutral-500 uppercase">Người dùng</th>
                            <th className="p-5 text-sm font-bold text-neutral-500 uppercase">Trạng thái</th>
                            <th className="p-5 text-sm font-bold text-neutral-500 uppercase text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-50">
                        {loading ? (
                            <tr><td colSpan="3" className="p-5 text-center font-medium text-neutral-500">Đang tải dữ liệu...</td></tr>
                        ) : filteredUsers.length === 0 ? (
                            <tr><td colSpan="3" className="p-5 text-center font-medium text-neutral-500">Không tìm thấy người dùng nào.</td></tr>
                        ) : (
                            filteredUsers.map(u => (
                                <tr key={u.id} className="hover:bg-amber-50/30 transition-colors">
                                    <td className="p-5">
                                        <p className="font-bold text-neutral-900">{u.fullName || 'Chưa cập nhật'}</p>
                                        <p className="text-sm text-neutral-500">{u.email}</p>
                                        {u.createdAt && (
                                            <p className="text-xs text-neutral-400 mt-1">Tham gia: {new Date(u.createdAt).toLocaleDateString('vi-VN')}</p>
                                        )}
                                    </td>
                                    <td className="p-5">
                                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {u.isActive ? 'Active' : 'Banned'}
                                        </span>
                                    </td>
                                    <td className="p-5 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleAction('credits', u)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100" title="Cộng lượt"><PlusCircle size={16} /></button>
                                            <button onClick={() => handleAction('reset', u)} className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100" title="Reset mật khẩu"><Key size={16} /></button>
                                            <button onClick={() => handleAction('ban', u)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100" title={u.isActive ? 'Khóa tài khoản' : 'Mở khóa'}>
                                                <Ban size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const InterviewsTab = () => {
    const [interviews, setInterviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchInterviews = async () => {
        try {
            setLoading(true);
            const response = await getInterviews();
            setInterviews(response.data);
        } catch (error) {
            console.error(error);
            toast.error("Không thể tải danh sách lịch sử phỏng vấn.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInterviews();
    }, []);

    const filteredInterviews = interviews.filter(i => 
        i.userFullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.userEmail?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-neutral-100 shadow-sm">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Tìm ứng viên, vị trí..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-neutral-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20" 
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[800px]">
                        <thead>
                            <tr className="bg-[#FAFAFA] border-b border-neutral-100">
                                <th className="p-5 text-sm font-bold text-neutral-500 uppercase">Ứng viên / Phiên</th>
                                <th className="p-5 text-sm font-bold text-neutral-500 uppercase">Vị trí mục tiêu</th>
                                <th className="p-5 text-sm font-bold text-neutral-500 uppercase">Kết quả AI</th>
                                <th className="p-5 text-sm font-bold text-neutral-500 uppercase text-right">Chi tiết</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-50">
                            {loading ? (
                                <tr><td colSpan="4" className="p-5 text-center font-medium text-neutral-500">Đang tải dữ liệu...</td></tr>
                            ) : filteredInterviews.length === 0 ? (
                                <tr><td colSpan="4" className="p-5 text-center font-medium text-neutral-500">Không có dữ liệu phỏng vấn.</td></tr>
                            ) : (
                                filteredInterviews.map(i => (
                                    <tr key={i.id} className="hover:bg-amber-50/30 transition-colors">
                                        <td className="p-5">
                                            <p className="font-bold text-neutral-900">{i.userFullName}</p>
                                            <p className="text-xs text-neutral-400 mt-0.5">{i.userEmail}</p>
                                            <p className="text-[11px] font-semibold text-neutral-400 mt-1">{new Date(i.createdAt).toLocaleString('vi-VN')}</p>
                                        </td>
                                        <td className="p-5 font-bold text-neutral-700 text-sm">{i.jobTitle}</td>
                                        <td className="p-5">
                                            {i.score !== null && i.score !== undefined ? (
                                                <span className="font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl text-sm">{i.score}/100</span>
                                            ) : (
                                                <span className="font-bold text-neutral-500 bg-neutral-50 px-3 py-1.5 rounded-xl text-xs border border-neutral-200">Chưa hoàn thành</span>
                                            )}
                                        </td>
                                        <td className="p-5 text-right">
                                            <button onClick={() => toast.success(`Đang tải log chi tiết của phiên ${i.id}...`)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-neutral-100 text-neutral-700 rounded-xl hover:bg-neutral-200 font-bold text-xs transition-colors">
                                                <PlayCircle size={14} /> Xem hội thoại
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export const TransactionsTab = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const response = await getTransactions();
            setTransactions(response.data);
        } catch (error) {
            console.error(error);
            toast.error("Không thể tải danh sách giao dịch.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    const formatVND = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

    const chartData = useMemo(() => {
        const monthlyGroups = transactions.reduce((acc, curr) => {
            if (curr.status === 'Success' && curr.createdAt) {
                const date = new Date(curr.createdAt);
                const label = `Tháng ${date.getMonth() + 1}`;
                acc[label] = (acc[label] || 0) + (curr.amount || 0);
            }
            return acc;
        }, {});

        return Object.keys(monthlyGroups).map(key => ({
            name: key,
            value: monthlyGroups[key]
        })).sort((a, b) => a.name.localeCompare(b.name));
    }, [transactions]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
             {chartData.length > 0 && (
                 <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm">
                     <div className="mb-6">
                         <h3 className="font-black text-xl text-neutral-900">Biểu đồ doanh thu</h3>
                         <p className="text-sm font-medium text-neutral-500">Tổng doanh thu kết toán thực tế từ hệ thống</p>
                     </div>
                     <div className="h-72 w-full min-h-[288px]">
                         <ResponsiveContainer width="100%" height="100%">
                             <BarChart data={chartData} margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
                                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6b7280', fontWeight: 600}} dy={10} />
                                 <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6b7280', fontWeight: 600}} tickFormatter={v => `${v/1000000}M`} />
                                 <RechartsTooltip cursor={{fill: '#f9fafb'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} formatter={(val) => [formatVND(val), 'Doanh thu']} />
                                 <Bar dataKey="value" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                             </BarChart>
                         </ResponsiveContainer>
                     </div>
                 </div>
             )}

             <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[800px]">
                        <thead>
                            <tr className="bg-[#FAFAFA] border-b border-neutral-100">
                                <th className="p-5 text-sm font-bold text-neutral-500 uppercase">Hóa đơn / Thời gian</th>
                                <th className="p-5 text-sm font-bold text-neutral-500 uppercase">Tài khoản mua</th>
                                <th className="p-5 text-sm font-bold text-neutral-500 uppercase">Giá trị giao dịch</th>
                                <th className="p-5 text-sm font-bold text-neutral-500 uppercase">Trạng thái</th>
                                <th className="p-5 text-sm font-bold text-neutral-500 uppercase text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-50">
                            {transactions.length === 0 ? (
                                <tr><td colSpan="5" className="p-5 text-center font-medium text-neutral-500">Không tìm thấy dữ liệu hóa đơn giao dịch.</td></tr>
                            ) : (
                                transactions.map(i => (
                                    <tr key={i.id} className="hover:bg-amber-50/30 transition-colors">
                                        <td className="p-5 font-bold text-neutral-900">
                                            {i.invoiceNo}
                                            <p className="text-xs text-neutral-400 font-medium mt-1">{new Date(i.createdAt).toLocaleString('vi-VN')}</p>
                                        </td>
                                        <td className="p-5">
                                            <p className="font-bold text-neutral-700 text-sm">{i.userEmail}</p>
                                            <p className="text-xs text-neutral-500 mt-0.5">{i.planName}</p>
                                        </td>
                                        <td className="p-5 font-black text-amber-600 text-base">{formatVND(i.amount)}</td>
                                        <td className="p-5">
                                            <span className={`px-3 py-1.5 text-xs font-bold rounded-xl ${i.status === 'Success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-neutral-50 text-neutral-500 border border-neutral-200'}`}>
                                                {i.status === 'Success' ? 'Thành công' : i.status}
                                            </span>
                                        </td>
                                        <td className="p-5 text-right">
                                            <button onClick={() => toast.success("Đang xuất file hóa đơn PDF...")} className="p-2.5 bg-neutral-100 text-neutral-600 rounded-xl hover:bg-neutral-200">
                                                <ArrowDownToLine size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export const AIConfigTab = () => {
    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl">
            <div className="bg-white p-8 rounded-2xl border border-neutral-100 shadow-sm space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-base font-bold text-neutral-900 mb-2">Mô hình AI (Model)</h3>
                        <select className="w-full px-5 py-3.5 bg-neutral-50 border border-neutral-200 rounded-2xl font-bold text-neutral-700 focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 outline-none">
                            <option>GPT-4 Omni (Khuyên dùng)</option>
                            <option>Claude 3.5 Sonnet</option>
                            <option>Gemini 1.5 Pro</option>
                        </select>
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-neutral-900 mb-2">API Key</h3>
                        <input type="password" defaultValue="sk-proj-xxxxxxxxxxxxxxxxxxx" className="w-full px-5 py-3.5 bg-neutral-50 border border-neutral-200 rounded-2xl font-medium focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 text-neutral-700" />
                    </div>
                </div>

                <hr className="border-neutral-100" />

                <div>
                    <h3 className="text-xl font-black text-neutral-900 mb-1">System Prompt: HR Manager</h3>
                    <p className="text-neutral-500 text-sm font-medium mb-4">Chỉ thị gốc cho AI đóng vai nhân sự vòng sơ loại.</p>
                    <textarea 
                        className="w-full px-5 py-4 h-64 bg-neutral-50 border border-neutral-200 rounded-2xl font-medium text-neutral-700 focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 outline-none resize-none custom-scrollbar leading-relaxed"
                        defaultValue="Bạn là một chuyên gia nhân sự (HR Manager) khó tính nhưng công bằng. Nhiệm vụ của bạn là phỏng vấn ứng viên để đánh giá thái độ, độ phù hợp văn hóa (culture fit) và các kỹ năng mềm. Hãy đặt câu hỏi ngắn gọn, thực tế và dựa trên ngữ cảnh câu trả lời trước đó của ứng viên. Không bao giờ thoát vai."
                    />
                </div>

                <div className="flex justify-end pt-4">
                    <button onClick={() => toast.success("Đã lưu cấu hình AI thành công!")} className="flex items-center gap-2 bg-neutral-900 text-white px-8 py-4 rounded-xl font-black hover:bg-neutral-800 transition-all hover:-translate-y-1 shadow-lg">
                        <Save size={18} /> Lưu cấu hình AI
                    </button>
                </div>
            </div>
        </div>
    );
};

export const SettingsTab = () => {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <div className="bg-white p-8 rounded-2xl border border-neutral-100 shadow-sm space-y-6">
                    <h3 className="text-xl font-black text-neutral-900 border-b border-neutral-100 pb-4">Thông tin Website</h3>
                    <div>
                        <label className="block text-base font-bold text-neutral-900 mb-2">Tên Website</label>
                        <input type="text" defaultValue="AIMockInterview" className="w-full px-5 py-3.5 bg-neutral-50 border border-neutral-200 rounded-2xl font-medium focus:outline-none focus:border-amber-500" />
                    </div>
                    <div>
                        <label className="block text-base font-bold text-neutral-900 mb-2">Email liên hệ hỗ trợ</label>
                        <input type="email" defaultValue="support@aimock.vn" className="w-full px-5 py-3.5 bg-neutral-50 border border-neutral-200 rounded-2xl font-medium focus:outline-none focus:border-amber-500" />
                    </div>
                    <div className="flex items-center justify-between p-5 bg-red-50 rounded-2xl border border-red-100 mt-8">
                        <div>
                            <h4 className="font-bold text-red-700 text-lg">Chế độ bảo trì (Maintenance)</h4>
                            <p className="text-sm font-medium text-red-600/80 mt-1">Chặn User truy cập vào site để cập nhật hệ thống.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" />
                            <div className="w-14 h-7 bg-red-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-red-600"></div>
                        </label>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button onClick={() => toast.success("Đã áp dụng cấu hình hệ thống!")} className="flex items-center gap-2 bg-amber-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/30">
                            <Save size={18} /> Lưu thay đổi
                        </button>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-2xl border border-neutral-100 shadow-sm">
                    <div className="flex justify-between items-center border-b border-neutral-100 pb-4 mb-6">
                        <h3 className="text-xl font-black text-neutral-900">Quản trị viên</h3>
                        <button onClick={() => toast.success("Tính năng phân quyền đang phát triển!")} className="text-amber-600 bg-amber-50 p-2 rounded-lg hover:bg-amber-100"><PlusCircle size={20} /></button>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-neutral-900 text-white rounded-full flex items-center justify-center font-bold">AD</div>
                                <div>
                                    <p className="font-bold text-neutral-900">Super Admin</p>
                                    <p className="text-xs text-neutral-500">admin@aimock.vn</p>
                                </div>
                            </div>
                            <span className="px-3 py-1 bg-neutral-200 text-neutral-700 text-xs font-bold rounded-full">Owner</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">NV</div>
                                <div>
                                    <p className="font-bold text-neutral-900">CSKH 01</p>
                                    <p className="text-xs text-neutral-500">cskh@aimock.vn</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">Editor</span>
                                <button className="text-neutral-400 hover:text-red-500"><Trash2 size={16} /></button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};