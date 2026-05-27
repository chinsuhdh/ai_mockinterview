import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft, Clock, Star, MessageSquare, User, Bot,
    Loader2, AlertCircle, FileText, Crown, CheckCircle2,
    TrendingUp, ChevronDown, ChevronUp, Award, Target
} from 'lucide-react';
import { getInterviewDetail } from '../services/userService';

// ─── Bubble hội thoại ───────────────────────────────────────────────────────
function ChatBubble({ msg, index }) {
    const isUser = (msg.role ?? msg.sender ?? '').toLowerCase() === 'user';
    const text   = msg.content ?? msg.message ?? msg.text ?? '';

    return (
        <div
            className={`flex gap-3 items-end animate-fade-in-up`}
            style={{ animationDelay: `${index * 0.04}s`, animationFillMode: 'both' }}
        >
            {!isUser && (
                <div className="shrink-0 w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-md">
                    <Bot size={15} className="text-white" />
                </div>
            )}
            <div className={`max-w-[80%] ${isUser ? 'ml-auto' : ''}`}>
                <div
                    className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
                        isUser
                            ? 'bg-neutral-900 text-white rounded-br-none'
                            : 'bg-white border border-neutral-100 text-neutral-800 rounded-bl-none'
                    }`}
                >
                    {text}
                </div>
                <p className={`text-[10px] font-medium text-neutral-400 mt-1 ${isUser ? 'text-right' : ''}`}>
                    {isUser ? 'Bạn' : 'AI Interviewer'}
                </p>
            </div>
            {isUser && (
                <div className="shrink-0 w-8 h-8 bg-neutral-200 rounded-full flex items-center justify-center">
                    <User size={15} className="text-neutral-600" />
                </div>
            )}
        </div>
    );
}

// ─── Skill bar ───────────────────────────────────────────────────────────────
function SkillBar({ label, value, color = 'bg-amber-500' }) {
    return (
        <div>
            <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-neutral-600">{label}</span>
                <span className="text-neutral-900">{value ?? 0}%</span>
            </div>
            <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-1000 ${color}`}
                    style={{ width: `${value ?? 0}%` }}
                />
            </div>
        </div>
    );
}

// ─── Accordion feedback block ─────────────────────────────────────────────────
function FeedbackBlock({ title, icon: Icon, color, children }) {
    const [open, setOpen] = useState(true);
    return (
        <div className="border border-neutral-100 rounded-2xl overflow-hidden">
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors text-left"
            >
                <span className={`flex items-center gap-2 font-bold text-sm ${color}`}>
                    <Icon size={16} /> {title}
                </span>
                {open ? <ChevronUp size={16} className="text-neutral-400" /> : <ChevronDown size={16} className="text-neutral-400" />}
            </button>
            {open && <div className="px-4 pb-4 text-sm text-neutral-600 leading-relaxed">{children}</div>}
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SessionDetail() {
    const { sessionId } = useParams();
    const navigate      = useNavigate();
    const bottomRef     = useRef(null);

    const [session,  setSession]  = useState(null);
    const [loading,  setLoading]  = useState(true);
    const [error,    setError]    = useState('');
    const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'feedback'

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                setError('');
                const res = await getInterviewDetail(sessionId);
                const data = res.data?.data ?? res.data;
                setSession(data);
            } catch (err) {
                console.error('Lỗi tải chi tiết phiên:', err);
                setError('Không thể tải dữ liệu phiên phỏng vấn. Vui lòng thử lại.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [sessionId]);

    // Auto-scroll to bottom of chat when tab switches
    useEffect(() => {
        if (activeTab === 'chat') {
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
    }, [activeTab, session]);

    // ── Loading ──────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen bg-[#F4F4F5] flex items-center justify-center font-sans">
                <div className="flex flex-col items-center gap-4 text-neutral-500">
                    <Loader2 size={40} className="animate-spin text-amber-500" />
                    <p className="font-bold text-lg">Đang tải phiên phỏng vấn...</p>
                </div>
            </div>
        );
    }

    // ── Error ────────────────────────────────────────────────────────────────
    if (error) {
        return (
            <div className="min-h-screen bg-[#F4F4F5] flex items-center justify-center font-sans p-6">
                <div className="bg-white rounded-3xl p-10 shadow-sm border border-neutral-100 max-w-md w-full text-center space-y-4">
                    <AlertCircle size={40} className="text-red-400 mx-auto" />
                    <p className="font-bold text-neutral-800">{error}</p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-6 py-3 bg-neutral-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-colors"
                    >
                        Quay lại Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (!session) return null;

    // ── Parse data fields (handle both camelCase & PascalCase from .NET) ────
    const title       = session.jdTitle    ?? session.jobTitle    ?? session.title    ?? session.JdTitle    ?? 'Phiên phỏng vấn';
    const score       = session.score      ?? session.Score       ?? session.overallScore ?? session.OverallScore;
    const rawDate     = session.date       ?? session.createdAt   ?? session.startedAt ?? session.CreatedAt;
    const duration    = session.duration   ?? session.Duration;
    const messages    = session.messages   ?? session.Messages    ?? session.history   ?? session.History   ?? [];
    const feedback    = session.feedback   ?? session.Feedback;
    const jd          = session.jobDescription ?? session.JobDescription ?? session.jd ?? session.Jd ?? '';

    // Skill scores (optional)
    const skills = session.skillScores ?? session.SkillScores ?? null;

    const scoreColor = score >= 80 ? 'text-green-500' : score >= 60 ? 'text-amber-500' : 'text-red-400';
    const scoreBg    = score >= 80 ? 'bg-green-50 border-green-200' : score >= 60 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200';

    return (
        <div className="min-h-screen bg-[#F4F4F5] font-sans text-neutral-900">

            {/* ── Top Nav ── */}
            <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-neutral-100 px-4 sm:px-6 py-4 flex items-center justify-between shadow-sm">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 text-neutral-500 hover:text-amber-600 font-bold transition-colors text-sm bg-neutral-100 hover:bg-amber-50 px-4 py-2 rounded-full"
                >
                    <ArrowLeft size={16} /> Quay lại Dashboard
                </button>
                <div className="flex items-center gap-2">
                    <div className="bg-neutral-900 p-1.5 rounded-lg text-amber-400">
                        <Crown size={18} strokeWidth={3} />
                    </div>
                    <span className="text-base font-bold text-neutral-900 hidden sm:block">AI Interviewer</span>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">

                {/* ── Header Card ── */}
                <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden animate-fade-in-up">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none translate-x-1/3 -translate-y-1/3" />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-amber-300 font-bold text-xs uppercase mb-3 border border-white/10">
                                <FileText size={12} /> Xem lại phiên phỏng vấn
                            </span>
                            <h1 className="text-xl md:text-2xl font-black leading-tight mb-2">{title}</h1>
                            <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-400">
                                {rawDate && (
                                    <span className="flex items-center gap-1">
                                        <Clock size={12} />
                                        {new Date(rawDate).toLocaleString('vi-VN', {
                                            day: '2-digit', month: '2-digit', year: 'numeric',
                                            hour: '2-digit', minute: '2-digit'
                                        })}
                                    </span>
                                )}
                                {duration && (
                                    <span className="flex items-center gap-1">
                                        <Clock size={12} /> {duration} phút
                                    </span>
                                )}
                                <span className="flex items-center gap-1">
                                    <MessageSquare size={12} /> {messages.length} tin nhắn
                                </span>
                            </div>
                        </div>

                        {score != null && (
                            <div className={`shrink-0 flex flex-col items-center justify-center w-24 h-24 rounded-2xl border-2 ${scoreBg} bg-white`}>
                                <Award size={18} className={scoreColor} />
                                <span className={`text-3xl font-black ${scoreColor}`}>{score}</span>
                                <span className="text-[10px] font-bold text-neutral-400 uppercase">Điểm</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Tab Switcher ── */}
                <div className="flex gap-2 bg-white rounded-2xl p-1.5 shadow-sm border border-neutral-100 w-fit animate-fade-in-up">
                    {[
                        { key: 'chat',     label: 'Đoạn hội thoại', icon: MessageSquare },
                        { key: 'feedback', label: 'Nhận xét & Điểm', icon: Star },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                                activeTab === tab.key
                                    ? 'bg-neutral-900 text-white shadow-md'
                                    : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50'
                            }`}
                        >
                            <tab.icon size={15} /> {tab.label}
                        </button>
                    ))}
                </div>

                {/* ── TAB: Chat ── */}
                {activeTab === 'chat' && (
                    <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 overflow-hidden animate-fade-in-up">
                        {/* Chat header */}
                        <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 px-6 py-4 flex items-center gap-3">
                            <div className="w-2.5 h-2.5 bg-green-400 rounded-full" />
                            <div>
                                <p className="text-white font-bold text-sm">AI Interviewer</p>
                                <p className="text-neutral-400 text-[10px]">Phiên đã kết thúc · Chỉ đọc</p>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="p-4 sm:p-6 space-y-5 max-h-[600px] overflow-y-auto bg-neutral-50 scrollbar-thin scrollbar-thumb-neutral-200">
                            {messages.length > 0 ? (
                                messages.map((msg, i) => (
                                    <ChatBubble key={i} msg={msg} index={i} />
                                ))
                            ) : (
                                <div className="text-center py-16 text-neutral-400">
                                    <MessageSquare size={40} className="mx-auto mb-3 opacity-40" />
                                    <p className="font-bold text-sm">Không có dữ liệu hội thoại cho phiên này.</p>
                                </div>
                            )}
                            <div ref={bottomRef} />
                        </div>
                    </div>
                )}

                {/* ── TAB: Feedback ── */}
                {activeTab === 'feedback' && (
                    <div className="space-y-5 animate-fade-in-up">

                        {/* Score summary */}
                        {score != null && (
                            <div className={`flex items-center gap-5 p-6 rounded-3xl border ${scoreBg} bg-white shadow-sm`}>
                                <div className={`w-20 h-20 rounded-2xl border-2 ${scoreBg} flex flex-col items-center justify-center shrink-0`}>
                                    <Award size={20} className={scoreColor} />
                                    <span className={`text-3xl font-black ${scoreColor}`}>{score}</span>
                                </div>
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">Điểm tổng kết</p>
                                    <p className={`text-2xl font-black ${scoreColor}`}>
                                        {score >= 80 ? 'Xuất sắc 🎉' : score >= 60 ? 'Khá tốt 👍' : 'Cần cải thiện 💪'}
                                    </p>
                                    <p className="text-sm text-neutral-500 mt-1 font-medium">
                                        {score >= 80
                                            ? 'Bạn đã trả lời rất tốt. Tiếp tục phát huy!'
                                            : score >= 60
                                            ? 'Nền tảng tốt, hãy luyện thêm để hoàn thiện hơn.'
                                            : 'Đừng nản, luyện tập nhiều hơn để cải thiện nhé!'}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Skill bars */}
                        {skills ? (
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-100">
                                <h3 className="font-black text-neutral-900 mb-5 flex items-center gap-2 text-base">
                                    <Target size={18} className="text-amber-500" /> Phân tích kỹ năng
                                </h3>
                                <div className="space-y-4">
                                    {Object.entries(skills).map(([key, val], i) => (
                                        <SkillBar
                                            key={i}
                                            label={key}
                                            value={val}
                                            color={i % 3 === 0 ? 'bg-amber-500' : i % 3 === 1 ? 'bg-blue-500' : 'bg-green-500'}
                                        />
                                    ))}
                                </div>
                            </div>
                        ) : score != null ? (
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-100">
                                <h3 className="font-black text-neutral-900 mb-5 flex items-center gap-2 text-base">
                                    <TrendingUp size={18} className="text-amber-500" /> Điểm số ước tính
                                </h3>
                                <div className="space-y-4">
                                    <SkillBar label="Kỹ năng trả lời"     value={score}                                    color="bg-blue-500" />
                                    <SkillBar label="Sự tự tin & Phản xạ" value={Math.min(score + 4, 100)}                color="bg-green-500" />
                                    <SkillBar label="Độ rõ ràng & Mạch lạc" value={Math.max(score - 5, 0)}               color="bg-amber-500" />
                                </div>
                            </div>
                        ) : null}

                        {/* Feedback sections */}
                        {feedback ? (
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-100 space-y-3">
                                <h3 className="font-black text-neutral-900 mb-4 flex items-center gap-2 text-base">
                                    <MessageSquare size={18} className="text-blue-500" /> Nhận xét từ AI
                                </h3>
                                {typeof feedback === 'string' ? (
                                    <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">
                                        {feedback}
                                    </div>
                                ) : (
                                    <>
                                        {feedback.strengths && (
                                            <FeedbackBlock title="Điểm mạnh" icon={CheckCircle2} color="text-green-600">
                                                {Array.isArray(feedback.strengths)
                                                    ? <ul className="space-y-1 list-disc list-inside">{feedback.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
                                                    : feedback.strengths}
                                            </FeedbackBlock>
                                        )}
                                        {feedback.improvements && (
                                            <FeedbackBlock title="Cần cải thiện" icon={TrendingUp} color="text-amber-600">
                                                {Array.isArray(feedback.improvements)
                                                    ? <ul className="space-y-1 list-disc list-inside">{feedback.improvements.map((s, i) => <li key={i}>{s}</li>)}</ul>
                                                    : feedback.improvements}
                                            </FeedbackBlock>
                                        )}
                                        {feedback.summary && (
                                            <FeedbackBlock title="Tổng quan" icon={Star} color="text-blue-600">
                                                {feedback.summary}
                                            </FeedbackBlock>
                                        )}
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="bg-white p-8 rounded-3xl shadow-sm border border-neutral-100 text-center text-neutral-400">
                                <Star size={32} className="mx-auto mb-3 opacity-40" />
                                <p className="font-bold text-sm">Chưa có nhận xét chi tiết cho phiên này.</p>
                            </div>
                        )}

                        {/* JD snippet */}
                        {jd && (
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-100">
                                <h3 className="font-black text-neutral-900 mb-3 flex items-center gap-2 text-base">
                                    <FileText size={18} className="text-neutral-400" /> Mô tả công việc (JD)
                                </h3>
                                <p className="text-sm text-neutral-600 leading-relaxed line-clamp-6 whitespace-pre-wrap bg-neutral-50 p-4 rounded-2xl border border-neutral-100">
                                    {jd}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* ── CTA ── */}
                <div className="flex gap-3 pb-6 animate-fade-in-up">
                    <button
                        onClick={() => navigate('/interview')}
                        className="flex-1 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl font-black text-sm shadow-md hover:opacity-90 transition-all"
                    >
                        Luyện tập tiếp →
                    </button>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-6 py-3.5 bg-white border border-neutral-200 rounded-2xl font-bold text-sm text-neutral-700 hover:bg-neutral-50 transition-colors shadow-sm"
                    >
                        Dashboard
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up { animation: fadeInUp 0.45s ease-out forwards; }
            `}</style>
        </div>
    );
}
