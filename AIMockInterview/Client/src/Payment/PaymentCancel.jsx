import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { XCircle, RefreshCcw, Home } from 'lucide-react';

export default function PaymentCancel() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#F4F4F5] flex items-center justify-center p-4 font-sans">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white max-w-md w-full p-8 rounded-[2rem] shadow-xl border border-neutral-100 text-center relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 right-0 h-2 bg-red-500" />
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-500/10 rounded-full blur-2xl" />

                <motion.div 
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.1, type: 'spring' }}
                    className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                    <XCircle size={50} />
                </motion.div>

                <h2 className="text-2xl font-black text-neutral-900 mb-2">Đã hủy thanh toán</h2>
                <p className="text-neutral-500 mb-8 font-medium">
                    Giao dịch của bạn chưa được thực hiện. Tài khoản của bạn không bị trừ tiền.
                </p>

                <div className="flex flex-col gap-3">
                    <button 
                        onClick={() => navigate('/#pricing')}
                        className="w-full py-3.5 bg-neutral-900 text-white font-bold rounded-xl hover:bg-black transition-colors flex items-center justify-center gap-2"
                    >
                        <RefreshCcw size={18} /> Thử thanh toán lại
                    </button>
                    <button 
                        onClick={() => navigate('/dashboard')}
                        className="w-full py-3.5 bg-neutral-50 text-neutral-600 font-bold rounded-xl hover:bg-neutral-100 transition-colors flex items-center justify-center gap-2"
                    >
                        <Home size={18} /> Về Dashboard
                    </button>
                </div>
            </motion.div>
        </div>
    );
}