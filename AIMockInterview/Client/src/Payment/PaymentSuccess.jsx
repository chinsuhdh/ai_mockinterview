import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, Home, LayoutDashboard } from 'lucide-react';

export default function PaymentSuccess() {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Tự động chuyển về Dashboard sau 3.5 giây
        // Kèm theo query param để Dashboard trigger cái Banner báo thành công của bạn
        const timer = setTimeout(() => {
            navigate('/dashboard?status=PAID');
        }, 3500);

        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans selection:bg-emerald-100 selection:text-emerald-900">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, type: 'spring', bounce: 0.3 }}
                className="bg-white max-w-md w-full p-8 md:p-10 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-200 text-center relative overflow-hidden"
            >
                {/* Hiệu ứng nền */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-500" />
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

                <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
                    className="w-20 h-20 bg-emerald-50 border border-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm relative"
                >
                    <motion.div 
                        animate={{ scale: [1, 1.2, 1] }} 
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute inset-0 bg-emerald-400/20 rounded-full blur-md"
                    />
                    <CheckCircle2 size={40} strokeWidth={2.5} className="relative z-10" />
                </motion.div>

                <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-3 tracking-tight">Thanh toán thành công!</h2>
                <p className="text-slate-500 mb-8 font-medium leading-relaxed">
                    Gói cước của bạn đã được nâng cấp. Cảm ơn bạn đã tin tưởng <span className="text-slate-800 font-bold">AI Interviewer</span>.
                </p>

                <div className="flex items-center justify-center gap-2 text-sm font-medium text-slate-500 mb-8 bg-slate-50 py-2.5 px-5 rounded-full w-fit mx-auto border border-slate-200">
                    <Loader2 size={16} className="animate-spin text-emerald-500" />
                    <span>Đang tự động chuyển về Dashboard...</span>
                </div>

                <div className="flex flex-col gap-3">
                    <button 
                        onClick={() => navigate('/dashboard?status=PAID')}
                        className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-xl shadow-sm hover:shadow-md hover:bg-slate-800 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                        <LayoutDashboard size={18} /> Đến Dashboard ngay
                    </button>
                    <button 
                        onClick={() => navigate('/')}
                        className="w-full py-3.5 bg-white text-slate-700 border border-slate-200 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                        <Home size={18} /> Về trang chủ
                    </button>
                </div>
            </motion.div>
        </div>
    );
}