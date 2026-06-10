import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Crown, CheckCircle2, ArrowRight, Loader2, ShieldCheck, ArrowLeft, CreditCard } from 'lucide-react';
import apiClient from '../api';

export default function Payment() {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Lấy thông tin gói cước được truyền từ trang Home (bảng giá)
    const planDetails = location.state?.selectedPlan;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Nếu người dùng truy cập trực tiếp /payment mà không chọn gói, đẩy về trang chủ
    useEffect(() => {
        if (!planDetails) {
            navigate('/#pricing');
        }
    }, [planDetails, navigate]);

    if (!planDetails) return null;

    const handleConfirmPayment = async () => {
        try {
            setLoading(true);
            setError('');
            
            // Lấy động domain hiện tại (localhost lúc code, vercel/render lúc deploy)
            const currentDomain = window.location.origin; 
            
            const requestBody = {
                planId: planDetails.id, 
                returnUrl: `${currentDomain}/payment-success`, // URL khi thanh toán thành công
                cancelUrl: `${currentDomain}/payment-cancel`   // URL khi hủy thanh toán
            };

            // Gọi API backend của bạn
            const response = await apiClient.post('/api/Payment/create-link', requestBody);
            
            if (response.data.success && response.data.checkoutUrl) {
                // Chuyển hướng người dùng sang cổng thanh toán PayOS
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

    return (
        <div className="min-h-screen bg-[#F4F4F5] flex items-center justify-center p-4 font-sans selection:bg-amber-100">
            <div className="max-w-4xl w-full grid md:grid-cols-2 gap-6 items-center">
                
                {/* --- CỘT TRÁI: THÔNG TIN GÓI CƯỚC --- */}
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`bg-white rounded-[2rem] p-8 md:p-10 shadow-xl border ${planDetails.highlight ? 'border-amber-200 shadow-amber-500/10' : 'border-neutral-100'}`}
                >
                    <button 
                        onClick={() => navigate(-1)} 
                        className="flex items-center gap-2 text-sm font-bold text-neutral-500 hover:text-neutral-900 mb-8 transition-colors"
                    >
                        <ArrowLeft size={16} /> Quay lại
                    </button>

                    <div className="mb-8">
                        <h2 className="text-sm font-bold tracking-widest text-neutral-400 uppercase mb-2">Đang thanh toán cho</h2>
                        <div className="flex items-center gap-3">
                            <h3 className="text-3xl font-black text-neutral-900">{planDetails.name}</h3>
                            {planDetails.highlight && <Crown size={24} className="text-amber-500 fill-amber-500" />}
                        </div>
                        <p className="text-neutral-500 mt-2 font-medium">{planDetails.desc}</p>
                    </div>

                    <div className="flex items-baseline gap-1 mb-8 pb-8 border-b border-neutral-100">
                        <span className="text-5xl font-black text-neutral-900">{planDetails.price}</span>
                        <span className="text-lg font-medium text-neutral-500">{planDetails.period}</span>
                    </div>

                    <ul className="space-y-4">
                        {planDetails.features?.map((feat, idx) => (
                            <li key={idx} className="flex items-start gap-3 text-sm font-medium text-neutral-600">
                                <div className="mt-0.5 w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center shrink-0">
                                    <CheckCircle2 size={12} strokeWidth={4} />
                                </div>
                                <span>{feat}</span>
                            </li>
                        ))}
                    </ul>
                </motion.div>

                {/* --- CỘT PHẢI: FORM XÁC NHẬN --- */}
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-col gap-6"
                >
                    <div className="bg-neutral-900 rounded-[2rem] p-8 md:p-10 shadow-2xl text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-amber-500/20 to-transparent rounded-full blur-[60px] pointer-events-none" />
                        
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md border border-white/10">
                                <CreditCard size={24} className="text-amber-400" />
                            </div>
                            
                            <h3 className="text-2xl font-black mb-2">Thanh toán qua PayOS</h3>
                            <p className="text-neutral-400 text-sm mb-8">
                                Hỗ trợ quét mã QR tất cả các ngân hàng và ví điện tử tại Việt Nam. Giao dịch an toàn và nhanh chóng.
                            </p>

                            {error && (
                                <div className="p-4 mb-6 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium">
                                    {error}
                                </div>
                            )}

                            <button 
                                onClick={handleConfirmPayment}
                                disabled={loading}
                                className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-amber-500/30 transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" /> Đang tạo mã thanh toán...
                                    </>
                                ) : (
                                    <>
                                        Thanh toán {planDetails.price} <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-xs font-medium text-neutral-500">
                        <ShieldCheck size={16} className="text-green-500" />
                        Thanh toán được bảo mật và mã hóa 256-bit
                    </div>
                </motion.div>

            </div>
        </div>
    );
}