import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, CheckCircle2, Crown, Loader2, CreditCard,
    ShieldCheck, Lock, Zap, ArrowRight
} from 'lucide-react';
import { createPaymentLink } from '../services/paymentService';

export default function Payment() {
    const location = useLocation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Lấy thông tin gói từ Home truyền qua react-router state
    const plan = location.state?.selectedPlan;

    useEffect(() => {
        // Nếu truy cập thẳng /payment mà không có gói → về trang chủ
        if (!plan) navigate('/', { replace: true });
    }, [plan, navigate]);

    if (!plan) return null;

    const handleCheckout = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await createPaymentLink({
                planId: plan.id,
                returnUrl: `${window.location.origin}/dashboard`,
            });

            const paymentUrl =
                res.data?.checkoutUrl ??
                res.data?.url ??
                res.data?.paymentUrl ??
                (typeof res.data === 'string' ? res.data : null);

            if (paymentUrl) {
                window.location.href = paymentUrl;
            } else {
                setError('Không nhận được link thanh toán từ server. Vui lòng thử lại.');
                setLoading(false);
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message ?? err.response?.data ?? 'Có lỗi xảy ra khi tạo giao dịch. Vui lòng thử lại.');
            setLoading(false);
        }
    };

    const periodLabel = plan.period
        ? plan.period.replace('/', '').trim()
        : '1 tháng';

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -20 },
        show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans selection:bg-amber-200 selection:text-amber-900 relative">
            
            {/* ── Background Pattern (Giúp lấp đầy khoảng trống 2 bên) ── */}
            <div className="absolute inset-0 z-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none" />
            
            {/* Background Glow trang trí thêm */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-amber-400/5 rounded-full blur-[120px] pointer-events-none z-0" />

            {/* ── Navbar ── */}
            <nav className="w-full bg-white/80 backdrop-blur-md border-b border-slate-200/60 py-4 px-6 md:px-10 flex items-center justify-between sticky top-0 z-50 transition-all">
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 cursor-pointer group" 
                    onClick={() => navigate('/')}
                >
                    <div className="bg-slate-900 p-2.5 rounded-xl text-amber-400 shadow-sm group-hover:scale-105 group-hover:shadow-amber-500/20 transition-all duration-300">
                        <Crown size={22} strokeWidth={2.5} />
                    </div>
                    <span className="text-2xl font-bold tracking-tight text-slate-900">AI Interviewer</span>
                </motion.div>
                
                <motion.button
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors px-5 py-2.5 rounded-full hover:bg-slate-100"
                >
                    <ArrowLeft size={18} /> Quay lại
                </motion.button>
            </nav>

            {/* ── Main Content ── */}
            <div className="flex-1 flex items-center justify-center p-4 md:p-8 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    /* TĂNG CHIỀU RỘNG TỪ max-w-5xl LÊN max-w-[1200px], TĂNG GRID PROPORTION */
                    className="max-w-[1200px] w-full grid lg:grid-cols-[1.2fr_1fr] min-h-[640px] rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.08)] overflow-hidden border border-slate-200/80 bg-white"
                >
                    {/* ── Cột trái: Chi tiết gói ── */}
                    {/* TĂNG PADDING lg:p-16 ĐỂ NỘI DUNG THOÁNG HƠN */}
                    <div className="p-8 md:p-12 lg:p-16 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white flex flex-col justify-between relative overflow-hidden">
                        
                        <div className="absolute -top-32 -right-32 w-96 h-96 bg-amber-500/20 rounded-full blur-[90px] pointer-events-none" />
                        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-500/10 rounded-full blur-[90px] pointer-events-none" />

                        <div className="relative z-10">
                            <motion.span 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold uppercase tracking-widest mb-8 border border-amber-500/20 backdrop-blur-sm"
                            >
                                <Crown size={16} />
                                Tóm tắt đơn hàng
                            </motion.span>
                            
                            <motion.h2 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="text-5xl font-black mb-4 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300"
                            >
                                Gói {plan.name}
                            </motion.h2>
                            
                            <motion.p 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="text-slate-400 text-lg mb-12 leading-relaxed max-w-md"
                            >
                                {plan.desc}
                            </motion.p>

                            <motion.ul 
                                variants={containerVariants}
                                initial="hidden"
                                animate="show"
                                className="space-y-6"
                            >
                                {(plan.features ?? []).map((feat, idx) => (
                                    <motion.li 
                                        variants={itemVariants}
                                        key={idx} 
                                        className="flex items-start gap-4 text-base font-medium text-slate-300 group"
                                    >
                                        <div className="bg-slate-800/50 p-1 rounded-full mt-0.5 group-hover:scale-110 transition-transform">
                                            <CheckCircle2 size={20} className="text-amber-400 shrink-0" />
                                        </div>
                                        <span className="group-hover:text-white transition-colors pt-0.5 leading-relaxed">{feat}</span>
                                    </motion.li>
                                ))}
                            </motion.ul>
                        </div>

                        <div className="relative z-10 mt-16 pt-8 border-t border-white/10 flex items-center gap-4 text-sm text-slate-400 font-medium">
                            <div className="p-2 bg-green-500/10 rounded-lg">
                                <ShieldCheck size={20} className="text-green-400" />
                            </div>
                            <span>Thanh toán được mã hóa và bảo mật bởi SSL 256-bit</span>
                        </div>
                    </div>

                    {/* ── Cột phải: Thanh toán ── */}
                    {/* TĂNG PADDING TƯƠNG ỨNG CỘT TRÁI */}
                    <div className="p-8 md:p-12 lg:p-16 flex flex-col justify-center bg-white relative">
                        
                        <div className="mb-10 p-8 bg-slate-50/50 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-400" />
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center justify-between">
                                Tổng thanh toán
                            </p>
                            <div className="flex items-baseline gap-3 mt-1">
                                <span className="text-6xl font-black text-slate-900 tracking-tight">{plan.price}</span>
                                {plan.period && (
                                    <span className="text-xl font-semibold text-slate-400">{plan.period}</span>
                                )}
                            </div>
                            {plan.period && (
                                <p className="text-base font-medium text-slate-500 mt-4 flex items-center gap-2">
                                    <CheckCircle2 size={16} className="text-slate-400" />
                                    Đã bao gồm VAT · Gia hạn mỗi {periodLabel}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col gap-5 mb-10 px-2">
                            {[
                                { icon: Zap, text: 'Kích hoạt ngay lập tức sau khi thanh toán' },
                                { icon: Lock, text: 'Chủ động hủy gia hạn bất cứ lúc nào' },
                                { icon: ShieldCheck, text: 'Cam kết bảo mật thông tin tuyệt đối 100%' },
                            ].map(({ icon: Icon, text }) => (
                                <div key={text} className="flex items-center gap-4 text-base text-slate-600 font-medium">
                                    <div className="bg-amber-50 p-2 rounded-xl">
                                        <Icon size={18} className="text-amber-600 shrink-0" />
                                    </div>
                                    {text}
                                </div>
                            ))}
                        </div>

                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                                    animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="p-5 bg-red-50 text-red-600 text-sm md:text-base font-semibold rounded-2xl border border-red-100 flex items-start gap-3">
                                        <div className="bg-red-100 p-1.5 rounded-full mt-0.5">
                                            <span className="flex h-3 w-3 relative">
                                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                            </span>
                                        </div>
                                        {error}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button
                            onClick={handleCheckout}
                            disabled={loading}
                            className="group relative overflow-hidden w-full py-5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-xl flex items-center justify-center gap-3 transition-all duration-300 shadow-xl shadow-slate-900/10 hover:shadow-slate-900/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
                            
                            {loading ? (
                                <>
                                    <Loader2 size={24} className="animate-spin text-amber-400" />
                                    <span>Đang khởi tạo giao dịch...</span>
                                </>
                            ) : (
                                <>
                                    <CreditCard size={24} />
                                    <span>Thanh toán bảo mật</span>
                                    <ArrowRight size={20} className="absolute right-8 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                                </>
                            )}
                        </button>

                        <p className="text-center text-sm text-slate-400 font-medium mt-8">
                            Bằng cách tiếp tục, bạn đồng ý với{' '}
                            <span className="text-slate-600 underline decoration-slate-300 underline-offset-4 cursor-pointer hover:text-slate-900 transition-colors">Điều khoản</span>
                            {' '}và{' '}
                            <span className="text-slate-600 underline decoration-slate-300 underline-offset-4 cursor-pointer hover:text-slate-900 transition-colors">Chính sách bảo mật</span>.
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}