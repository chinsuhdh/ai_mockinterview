import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Crown, CheckCircle2, ArrowRight, Loader2, ShieldCheck, 
    ArrowLeft, CreditCard, QrCode, Lock, Building2, Zap, Star 
} from 'lucide-react';
import apiClient from '../api';
import { createPaymentLink } from '../services/paymentService';

const STEPS = ['Chọn gói', 'Xác nhận', 'Thanh toán', 'Hoàn tất'];
const CURRENT_STEP = 1; // 0-indexed, so 1 is 'Xác nhận'

export default function Payment() {
    const navigate = useNavigate();
    const location = useLocation();
    
    const planDetails = location.state?.selectedPlan;
    const [loading, setLoading] = useState(false);
    const [checkingPlan, setCheckingPlan] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!planDetails) {
            navigate('/#pricing');
            return;
        }

        const checkCurrentSubscription = async () => {
            try {
                // [!] TODO: Đổi endpoint này cho khớp với controller C# của bạn
                const res = await apiClient.get('/api/User/profile'); 
                const userCurrentPlanId = res.data?.currentPlanId; 

                if (userCurrentPlanId === planDetails.id) {
                    navigate('/interview');
                }
            } catch (err) {
                console.error("Lỗi khi kiểm tra thông tin gói cước:", err);
            } finally {
                setCheckingPlan(false);
            }
        };

        checkCurrentSubscription();
    }, [planDetails, navigate]);

    const handleConfirmPayment = async () => {
        try {
            setLoading(true);
            setError('');
            
            const currentDomain = window.location.origin; 
            
            const response = await createPaymentLink({
                planId: planDetails.id,
                returnUrl: `${currentDomain}/payment-success`, 
            });
            
            if (response.data.success && response.data.checkoutUrl) {
                window.location.href = response.data.checkoutUrl; 
            } else {
                setError('Không thể tạo link thanh toán. Vui lòng thử lại sau.');
            }
        } catch (err) {
            console.error("Lỗi tạo thanh toán:", err);
            setError(err.response?.data?.message || 'Có lỗi xảy ra khi kết nối đến máy chủ thanh toán.');
        } finally {
            setLoading(false);
        }
    };

    if (!planDetails || checkingPlan) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 size={40} className="animate-spin text-amber-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 relative overflow-hidden font-sans selection:bg-amber-100 selection:text-amber-900 pb-20">
            {/* Premium Background Blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-amber-400/10 blur-[120px] pointer-events-none" />
            <div className="absolute top-[20%] right-[-10%] w-[30vw] h-[30vw] rounded-full bg-blue-500/5 blur-[100px] pointer-events-none" />
            
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 lg:pt-12 relative z-10">
                
                {/* --- HEADER & PROGRESS BAR --- */}
                <div className="mb-12">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 hover:-translate-x-1 mb-8 transition-all w-fit bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200"
                    >
                        <ArrowLeft size={16} /> Quay lại cấu hình
                    </button>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-2">Xác nhận thanh toán</h1>
                            <p className="text-slate-500 font-medium">Bảo mật 100% qua cổng thanh toán PayOS.</p>
                        </div>
                        
                        {/* Progress Indicator */}
                        <div className="hidden md:flex items-center gap-2 text-sm font-bold">
                            {STEPS.map((step, idx) => (
                                <div key={step} className="flex items-center gap-2">
                                    <div className={`flex items-center gap-2 ${idx === CURRENT_STEP ? 'text-amber-600' : idx < CURRENT_STEP ? 'text-slate-400' : 'text-slate-300'}`}>
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border-2 ${idx === CURRENT_STEP ? 'border-amber-500 bg-amber-50' : idx < CURRENT_STEP ? 'border-slate-300 bg-slate-100' : 'border-slate-200'}`}>
                                            {idx < CURRENT_STEP ? <CheckCircle2 size={14} /> : idx + 1}
                                        </div>
                                        <span className={idx === CURRENT_STEP ? 'text-slate-900' : ''}>{step}</span>
                                    </div>
                                    {idx < STEPS.length - 1 && <div className={`w-8 h-px ${idx < CURRENT_STEP ? 'bg-slate-300' : 'bg-slate-200'}`} />}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* --- MAIN CONTENT GRID --- */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                    
                    {/* CỘT TRÁI: CHI TIẾT GÓI & TÍNH NĂNG (7/12) */}
                    <div className="lg:col-span-7 flex flex-col gap-8">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                            className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-8 md:p-10 shadow-xl shadow-slate-200/40 border border-slate-200"
                        >
                            <div className="flex items-start justify-between mb-8">
                                <div>
                                    <h2 className="text-sm font-bold tracking-[0.2em] text-amber-500 uppercase mb-2">Gói đang chọn</h2>
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-3xl md:text-4xl font-black text-slate-900">{planDetails.name}</h3>
                                        {planDetails.highlight && <Crown size={32} className="text-amber-500 fill-amber-500 drop-shadow-sm" />}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl md:text-4xl font-black text-slate-900">{planDetails.price}</div>
                                    <div className="text-slate-500 font-medium">{planDetails.period}</div>
                                </div>
                            </div>

                            <p className="text-slate-600 text-lg leading-relaxed mb-10 pb-8 border-b border-slate-100">
                                {planDetails.desc}
                            </p>

                            <h4 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <Zap size={20} className="text-amber-500" /> Đặc quyền bao gồm:
                            </h4>
                            
                            {/* Feature Grid thay vì list */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {planDetails.features?.map((feat, idx) => (
                                    <div key={idx} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex gap-3 items-start hover:border-amber-200 hover:bg-amber-50/50 transition-colors">
                                        <div className={`mt-1 w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-white shadow-sm text-green-500`}>
                                            <CheckCircle2 size={14} strokeWidth={3} />
                                        </div>
                                        <span className="text-sm font-medium text-slate-700 leading-relaxed">{feat}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Trust & Stats Section */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.1 }}
                            className="bg-slate-900 rounded-[2rem] p-8 flex flex-col sm:flex-row items-center justify-between gap-6 border border-slate-800"
                        >
                            <div className="flex items-center gap-4">
                                <div className="flex -space-x-3">
                                    {[1,2,3,4].map(i => (
                                        <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-700 flex items-center justify-center overflow-hidden">
                                            <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" className="w-full h-full object-cover opacity-80" />
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <div className="flex gap-1 text-amber-400 mb-1">
                                        <Star size={14} fill="currentColor"/>
                                        <Star size={14} fill="currentColor"/>
                                        <Star size={14} fill="currentColor"/>
                                        <Star size={14} fill="currentColor"/>
                                        <Star size={14} fill="currentColor"/>
                                    </div>
                                    <p className="text-sm font-medium text-slate-300"><strong className="text-white">15,000+</strong> sinh viên tin dùng</p>
                                </div>
                            </div>
                            <div className="h-10 w-px bg-slate-700 hidden sm:block"></div>
                            <div className="text-sm text-slate-400 max-w-[200px] text-center sm:text-left">
                                Cam kết nâng cao <strong className="text-white">300%</strong> tỷ lệ pass phỏng vấn.
                            </div>
                        </motion.div>
                    </div>

                    {/* CỘT PHẢI: FORM THANH TOÁN (5/12) - STICKY */}
                    <div className="lg:col-span-5 relative">
                        <div className="sticky top-8 flex flex-col gap-6">
                            
                            {/* Order Summary Box */}
                            <motion.div 
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.4 }}
                                className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/30 border border-slate-200"
                            >
                                <h3 className="text-xl font-black text-slate-900 mb-6">Tóm tắt đơn hàng</h3>
                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between items-center text-slate-600 font-medium">
                                        <span>Gói {planDetails.name}</span>
                                        <span>{planDetails.price}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-slate-500 text-sm">
                                        <span>Thuế & Phí</span>
                                        <span>Đã bao gồm</span>
                                    </div>
                                </div>
                                <div className="pt-6 border-t border-slate-200 flex justify-between items-center">
                                    <span className="text-lg font-bold text-slate-900">Tổng thanh toán</span>
                                    <span className="text-2xl font-black text-slate-900">{planDetails.price}</span>
                                </div>
                            </motion.div>

                            {/* Payment Action Box */}
                            <motion.div 
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.4, delay: 0.1 }}
                                className="bg-slate-900 rounded-[2rem] p-8 shadow-2xl shadow-slate-900/20 text-white relative overflow-hidden border border-slate-800"
                            >
                                {/* Decorative elements inside dark card */}
                                <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/20 rounded-full blur-[60px] pointer-events-none" />
                                
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/10">
                                            <CreditCard size={20} className="text-amber-400" />
                                        </div>
                                        <h3 className="text-xl font-black tracking-tight">Thanh toán qua PayOS</h3>
                                    </div>

                                    {/* Fake QR Preview Area */}
                                    <div className="bg-slate-800/50 border border-slate-700 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center mb-8 h-[160px] relative overflow-hidden group">
                                        <QrCode size={48} className="text-slate-600 mb-3 group-hover:scale-110 transition-transform duration-500" />
                                        <p className="text-sm font-medium text-slate-400">Mã QR động sẽ hiển thị ở bước tiếp theo</p>
                                        <div className="absolute top-0 left-0 w-full h-1 bg-amber-500/30 -translate-y-full group-hover:animate-[scan_2s_ease-in-out_infinite]" />
                                    </div>

                                    {/* Supported Banks Text/Logos */}
                                    <div className="flex items-center justify-center gap-4 text-slate-500 mb-8">
                                        <Building2 size={20} />
                                        <span className="text-xs font-medium uppercase tracking-wider">Hỗ trợ tất cả ngân hàng VN & Momo</span>
                                    </div>

                                    <AnimatePresence>
                                        {error && (
                                            <motion.div 
                                                initial={{ opacity: 0, height: 0 }} 
                                                animate={{ opacity: 1, height: 'auto' }} 
                                                exit={{ opacity: 0, height: 0 }}
                                                className="mb-6 overflow-hidden"
                                            >
                                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium">
                                                    {error}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <button 
                                        onClick={handleConfirmPayment}
                                        disabled={loading}
                                        className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-black text-lg shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 size={20} className="animate-spin" /> Đang tạo mã QR...
                                            </>
                                        ) : (
                                            <>
                                                Xác nhận thanh toán <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </motion.div>

                            <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400 bg-white/60 backdrop-blur-md py-4 rounded-full border border-slate-200 shadow-sm">
                                <Lock size={14} className="text-emerald-500" />
                                <ShieldCheck size={14} className="text-emerald-500" />
                                Giao dịch được mã hóa an toàn 256-bit
                            </div>
                        </div>
                    </div>
                </div>

                <style>{`
                    @keyframes scan {
                        0% { transform: translateY(0); }
                        50% { transform: translateY(160px); }
                        100% { transform: translateY(0); }
                    }
                `}</style>
            </div>
        </div>
    );
}