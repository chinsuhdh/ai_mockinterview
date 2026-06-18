import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Lock, Eye, EyeOff, ArrowLeft, Crown, CheckCircle2,
    ShieldCheck, Loader2, AlertCircle, KeyRound
} from 'lucide-react';
import { changePassword } from '../services/userService';

// ── Strength meter ──────────────────────────────────────────────────────────
const getStrength = (pw) => {
    if (!pw) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pw.length >= 8)  score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    const map = [
        { label: '',         color: '' },
        { label: 'Yếu',      color: 'bg-red-500' },
        { label: 'Trung bình', color: 'bg-amber-500' },
        { label: 'Tốt',      color: 'bg-blue-500' },
        { label: 'Mạnh',     color: 'bg-green-500' },
    ];
    return { score, ...map[score] };
};

// ── Password input w/ show/hide toggle ─────────────────────────────────────
const PasswordInput = ({ id, label, value, onChange, placeholder, hint, showStrength }) => {
    const [show, setShow] = useState(false);
    const strength = showStrength ? getStrength(value) : null;

    return (
        <div className="space-y-1.5">
            <label htmlFor={id} className="text-sm font-black text-neutral-700 uppercase tracking-wider">
                {label}
            </label>
            <div className="relative group">
                <Lock
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-amber-500 transition-colors"
                />
                <input
                    id={id}
                    type={show ? 'text' : 'password'}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    autoComplete="off"
                    className="w-full pl-12 pr-12 py-4 bg-neutral-50 border-2 border-neutral-200 rounded-2xl outline-none focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all font-bold text-sm placeholder:font-normal placeholder:text-neutral-400"
                />
                <button
                    type="button"
                    onClick={() => setShow(s => !s)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition-colors"
                    tabIndex={-1}
                >
                    {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            </div>
            {hint && !value && (
                <p className="text-xs text-neutral-400 font-medium pl-1">{hint}</p>
            )}
            {showStrength && value && (
                <div className="pl-1">
                    <div className="flex gap-1 mb-1">
                        {[1, 2, 3, 4].map(i => (
                            <div
                                key={i}
                                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                                    strength.score >= i ? strength.color : 'bg-neutral-200'
                                }`}
                            />
                        ))}
                    </div>
                    {strength.label && (
                        <p className={`text-xs font-bold ${
                            strength.score === 1 ? 'text-red-500' :
                            strength.score === 2 ? 'text-amber-500' :
                            strength.score === 3 ? 'text-blue-500' : 'text-green-500'
                        }`}>
                            Độ mạnh: {strength.label}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

// ── Rule checklist ──────────────────────────────────────────────────────────
const RuleItem = ({ pass, text }) => (
    <div className={`flex items-center gap-2 text-xs font-semibold transition-colors ${pass ? 'text-green-600' : 'text-neutral-400'}`}>
        <CheckCircle2 size={14} className={pass ? 'text-green-500' : 'text-neutral-300'} />
        {text}
    </div>
);

// ── Main Component ──────────────────────────────────────────────────────────
export default function ChangePassword() {
    const navigate = useNavigate();
    
    // Đọc cờ ép buộc đổi mật khẩu từ localStorage
    const isForced = localStorage.getItem('forcePasswordChange') === 'true';

    const [form, setForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState('');
    const [success, setSuccess]   = useState(false);

    const set = (field) => (e) => {
        setForm(f => ({ ...f, [field]: e.target.value }));
        setError('');
    };

    // Validation rules for new password
    const rules = [
        { pass: form.newPassword.length >= 8,           text: 'Tối thiểu 8 ký tự' },
        { pass: /[A-Z]/.test(form.newPassword),         text: 'Ít nhất 1 chữ hoa (A–Z)' },
        { pass: /[0-9]/.test(form.newPassword),         text: 'Ít nhất 1 chữ số (0–9)' },
        { pass: /[^A-Za-z0-9]/.test(form.newPassword),  text: 'Ít nhất 1 ký tự đặc biệt (!@#…)' },
        { pass: form.newPassword === form.confirmPassword && form.confirmPassword !== '',
                                                         text: 'Mật khẩu xác nhận khớp' },
    ];
    const allRulesPassed = rules.every(r => r.pass);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.currentPassword) return setError('Vui lòng nhập mật khẩu hiện tại.');
        if (!allRulesPassed) return setError('Vui lòng đáp ứng đủ các yêu cầu mật khẩu mới.');

        setLoading(true);
        setError('');
        try {
            await changePassword({
                currentPassword: form.currentPassword,
                newPassword: form.newPassword,
            });
            setSuccess(true);
            
            // Xóa cờ ép buộc sau khi đổi mật khẩu thành công
            localStorage.removeItem('forcePasswordChange');

            // Chuyển về Home (nếu bị ép đổi lúc login) hoặc Profile (nếu chủ động đổi)
            setTimeout(() => navigate(isForced ? '/' : '/profile'), 2500);
        } catch (err) {
            console.error(err);
            setError(
                err.response?.data?.message ??
                err.response?.data?.Message ??
                err.response?.data ??
                'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F4F4F5] flex flex-col font-sans">

            {/* ── Navbar ── */}
            <nav className="w-full bg-white border-b border-neutral-100 py-4 px-6 flex items-center justify-between sticky top-0 z-50 shadow-sm">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => !isForced && navigate('/')}>
                    <div className="bg-neutral-900 p-1.5 rounded-lg text-amber-400">
                        <Crown size={20} strokeWidth={3} />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-neutral-900">AI Interviewer</span>
                </div>
                
                {/* Ẩn nút quay lại nếu người dùng đang bị ép buộc đổi mật khẩu */}
                {!isForced && (
                    <button
                        onClick={() => navigate('/profile')}
                        className="flex items-center gap-2 text-sm font-bold text-neutral-500 hover:text-neutral-900 transition-colors px-4 py-2 rounded-full hover:bg-neutral-100"
                    >
                        <ArrowLeft size={16} /> Quay lại hồ sơ
                    </button>
                )}
            </nav>

            {/* ── Main ── */}
            <div className="flex-1 flex items-start justify-center p-4 md:p-8 pt-8">
                <div className="w-full max-w-lg">

                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 text-center"
                    >
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-neutral-900 mb-4 shadow-lg">
                            <KeyRound size={30} className="text-amber-400" />
                        </div>
                        <h1 className="text-3xl font-black text-neutral-900 mb-1">Đổi mật khẩu</h1>
                        <p className="text-neutral-500 font-medium text-sm">
                            {isForced 
                                ? "Vì lý do bảo mật, vui lòng tạo mật khẩu mới an toàn hơn để tiếp tục." 
                                : "Bảo vệ tài khoản bằng mật khẩu mạnh và riêng tư."}
                        </p>
                    </motion.div>

                    <AnimatePresence mode="wait">
                        {/* ── SUCCESS STATE ── */}
                        {success ? (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white rounded-[2rem] shadow-sm border border-neutral-100 p-10 text-center"
                            >
                                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-50 mb-5">
                                    <ShieldCheck size={40} className="text-green-500" />
                                </div>
                                <h2 className="text-2xl font-black text-neutral-900 mb-2">Thành công!</h2>
                                <p className="text-neutral-500 font-medium mb-1">Mật khẩu của bạn đã được cập nhật an toàn.</p>
                                <p className="text-xs text-neutral-400 font-medium">Đang chuyển hướng…</p>
                            </motion.div>
                        ) : (
                            /* ── FORM STATE ── */
                            <motion.div
                                key="form"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="bg-white rounded-[2rem] shadow-sm border border-neutral-100 overflow-hidden"
                            >
                                <form onSubmit={handleSubmit} className="p-8 md:p-10 space-y-6">

                                    {/* Error banner */}
                                    <AnimatePresence>
                                        {error && (
                                            <motion.div
                                                initial={{ opacity: 0, x: 12 }}
                                                animate={{ opacity: 0, x: 0 }}
                                                exit={{ opacity: 0 }}
                                                className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm font-semibold"
                                            >
                                                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                                                <span>{error}</span>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Current password */}
                                    <PasswordInput
                                        id="current"
                                        label="Mật khẩu hiện tại"
                                        value={form.currentPassword}
                                        onChange={set('currentPassword')}
                                        placeholder="Nhập mật khẩu đang dùng"
                                        hint="Dùng để xác minh bạn là chủ tài khoản"
                                    />

                                    <div className="border-t border-dashed border-neutral-200" />

                                    {/* New password */}
                                    <PasswordInput
                                        id="new"
                                        label="Mật khẩu mới"
                                        value={form.newPassword}
                                        onChange={set('newPassword')}
                                        placeholder="Tạo mật khẩu mới an toàn"
                                        showStrength
                                    />

                                    {/* Confirm password */}
                                    <PasswordInput
                                        id="confirm"
                                        label="Xác nhận mật khẩu mới"
                                        value={form.confirmPassword}
                                        onChange={set('confirmPassword')}
                                        placeholder="Nhập lại mật khẩu mới"
                                    />

                                    {/* Rule checklist — chỉ hiện khi đang nhập */}
                                    {(form.newPassword || form.confirmPassword) && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="bg-neutral-50 rounded-2xl p-4 border border-neutral-100 grid grid-cols-1 sm:grid-cols-2 gap-2"
                                        >
                                            {rules.map((r, i) => (
                                                <RuleItem key={i} pass={r.pass} text={r.text} />
                                            ))}
                                        </motion.div>
                                    )}

                                    {/* Submit */}
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-4 bg-neutral-900 hover:bg-black text-white rounded-2xl font-black text-base flex items-center justify-center gap-2.5 transition-all shadow-lg hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
                                    >
                                        {loading ? (
                                            <Loader2 size={22} className="animate-spin" />
                                        ) : (
                                            <>
                                                <ShieldCheck size={20} />
                                                Xác nhận đổi mật khẩu
                                            </>
                                        )}
                                    </button>

                                    {/* Forgot password link - Có thể cân nhắc ẩn nếu đang bị isForced */}
                                    {!isForced && (
                                        <p className="text-center text-sm text-neutral-400 font-medium">
                                            Không nhớ mật khẩu cũ?{' '}
                                            <button
                                                type="button"
                                                onClick={() => navigate('/auth/forgot-password')}
                                                className="text-amber-600 hover:text-amber-700 font-bold underline underline-offset-4 transition-colors"
                                            >
                                                Dùng tính năng Quên mật khẩu
                                            </button>
                                        </p>
                                    )}
                                </form>

                                {/* Security footer */}
                                <div className="px-8 md:px-10 py-4 bg-neutral-50 border-t border-neutral-100 flex items-center gap-2 text-xs text-neutral-400 font-medium">
                                    <ShieldCheck size={14} className="text-green-500 shrink-0" />
                                    Mật khẩu được mã hóa BCrypt — không ai có thể xem được, kể cả hệ thống.
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}