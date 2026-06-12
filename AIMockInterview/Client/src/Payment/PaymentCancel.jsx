import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { XCircle, RefreshCcw, Home } from 'lucide-react';

export default function PaymentCancel() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans selection:bg-rose-100 selection:text-rose-900">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="bg-white max-w-md w-full p-8 md:p-10 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-200 text-center relative overflow-hidden"
            >
                {/* Decoration */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-rose-500" />
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

                <motion.div 
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 20 }}
                    className="w-20 h-20 bg-rose-50 border border-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm"
                >
                    <XCircle size={40} strokeWidth={2.5} />
                </motion.div>

                <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-3 tracking-tight">Đã hủy thanh toán</h2>
                <p className="text-slate-500 mb-8 font-medium leading-relaxed">
                    Giao dịch của bạn chưa được thực hiện. Tài khoản của bạn <span className="text-slate-700 font-semibold">không bị trừ tiền</span>.
                </p>

                <div className="flex flex-col gap-3">
                    <button 
                        onClick={() => navigate('/#pricing')}
                        className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-xl shadow-sm hover:shadow-md hover:bg-slate-800 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                        <RefreshCcw size={18} /> Thử thanh toán lại
                    </button>
                    <button 
                        onClick={() => navigate('/dashboard')}
                        className="w-full py-3.5 bg-white text-slate-700 border border-slate-200 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                        <Home size={18} /> Về Dashboard
                    </button>
                </div>
            </motion.div>
        </div>
    );
}