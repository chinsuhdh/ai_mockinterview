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
        <div className="min-h-screen bg-[#F4F4F5] flex items-center justify-center p-4 font-sans">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, type: 'spring' }}
                className="bg-white max-w-md w-full p-8 rounded-[2rem] shadow-xl border border-neutral-100 text-center relative overflow-hidden"
            >
                {/* Hiệu ứng nền */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-green-500" />
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-green-500/10 rounded-full blur-2xl" />

                <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                    <CheckCircle2 size={50} />
                </motion.div>

                <h2 className="text-2xl font-black text-neutral-900 mb-2">Thanh toán thành công!</h2>
                <p className="text-neutral-500 mb-8 font-medium">
                    Gói cước của bạn đã được nâng cấp. Cảm ơn bạn đã tin tưởng AI Interviewer.
                </p>

                <div className="flex items-center justify-center gap-2 text-sm text-neutral-400 mb-8">
                    <Loader2 size={16} className="animate-spin" />
                    <span>Đang tự động chuyển về Dashboard...</span>
                </div>

                <div className="flex flex-col gap-3">
                    <button 
                        onClick={() => navigate('/dashboard?status=PAID')}
                        className="w-full py-3.5 bg-neutral-900 text-white font-bold rounded-xl hover:bg-black transition-colors flex items-center justify-center gap-2"
                    >
                        <LayoutDashboard size={18} /> Đến Dashboard ngay
                    </button>
                    <button 
                        onClick={() => navigate('/')}
                        className="w-full py-3.5 bg-neutral-50 text-neutral-600 font-bold rounded-xl hover:bg-neutral-100 transition-colors flex items-center justify-center gap-2"
                    >
                        <Home size={18} /> Về trang chủ
                    </button>
                </div>
            </motion.div>
        </div>
    );
}