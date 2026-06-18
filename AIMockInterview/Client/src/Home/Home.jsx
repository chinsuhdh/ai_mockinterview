import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useSpring, AnimatePresence } from 'framer-motion';
import { 
    Bot, Zap, FileText, ArrowRight, Crown, Trophy, Target, 
    Play, Briefcase, Check, Star, Code2, Users, Globe, ChevronDown, 
    ChevronUp, Facebook, Linkedin, Github, X, Mic, Send, Info, LogOut, Menu, Loader2, CheckCircle2, ChevronRight, ShieldCheck
} from 'lucide-react';
import { getSubscriptionPlans } from '../services/paymentService';
import { sendChatbotMessage } from '../services/chatbotService';

// ── DATA & CONSTANTS ──
const successCards = [
    { icon: <Trophy size={20} className="text-amber-600" />, text: "Offer Google $3k", sub: "Software Engineer" },
    { icon: <Star size={20} className="text-yellow-500" />, text: "Score: 98/100", sub: "Kỹ năng trả lời" },
    { icon: <Briefcase size={20} className="text-blue-600" />, text: "Đậu VinAI", sub: "Senior Researcher" },
    { icon: <Check size={20} className="text-green-600" />, text: "Tự tin 100%", sub: "Sẵn sàng nhận việc" },
    { icon: <Crown size={20} className="text-amber-500" />, text: "Top 1% Talent", sub: "Đánh giá bởi AI" },
    { icon: <Zap size={20} className="text-purple-600" />, text: "Phản xạ < 2s", sub: "Tư duy nhanh nhạy" },
    { icon: <FileText size={20} className="text-rose-500" />, text: "CV Chuẩn ATS", sub: "Qua vòng lọc máy" },
    { icon: <Code2 size={20} className="text-indigo-600" />, text: "Live Coding", sub: "Giải thuật tối ưu" },
    { icon: <Users size={20} className="text-teal-600" />, text: "Culture Fit", sub: "Phù hợp văn hóa" },
    { icon: <Globe size={20} className="text-cyan-600" />, text: "Remote Job", sub: "Công ty Mỹ" },
];

const problems = [
    { 
        icon: <Users size={32} />, 
        title: "Thiếu người hướng dẫn", 
        desc: "Mentor xịn thì phí cao ($50/h), bạn bè thì không đủ chuyên môn để đánh giá khách quan.",
        stat: "85% sinh viên tự bơi"
    },
    { 
        icon: <Zap size={32} />, 
        title: "Tâm lý lo lắng", 
        desc: "Run, quên bài, phản xạ chậm khi gặp câu hỏi khó hoặc tiếng Anh chuyên ngành.",
        stat: "70% trượt vì tâm lý"
    },
    { 
        icon: <FileText size={32} />, 
        title: "CV & Skill lệch pha", 
        desc: "Trả lời lan man, không đúng trọng tâm những gì nhà tuyển dụng cần trong JD.",
        stat: "Rớt vòng phỏng vấn"
    }
];

const faqs = [
    { q: "AI Mock Interviewer hỗ trợ những ngôn ngữ nào?", a: "Hiện tại chúng tôi hỗ trợ tốt nhất Tiếng Việt và Tiếng Anh. Sắp tới sẽ có Tiếng Nhật và Hàn." },
    { q: "Feedback của AI có chính xác không?", a: "AI được huấn luyện dựa trên hàng nghìn bộ câu hỏi thật từ các công ty Big Tech, độ chính xác đạt 95%." },
    { q: "Tôi có thể hủy gói Pro bất cứ lúc nào không?", a: "Chắc chắn rồi. Bạn có thể hủy gia hạn bất kỳ lúc nào trong phần cài đặt tài khoản." },
    { q: "Hệ thống có lưu lại lịch sử phỏng vấn không?", a: "Có. Bạn có thể xem lại toàn bộ lịch sử chat và các bài đánh giá năng lực trong Dashboard." },
];

const SECTION_MESSAGES = {
    hero: "Xin chào! Mình là AI Recruiter — giúp bạn luyện phỏng vấn nè ⚡",
    problem: "Đây là những lý do khiến 70% ứng viên trượt phỏng vấn đấy! 😱",
    process: "3 bước đơn giản để chinh phục nhà tuyển dụng nhé 🚀",
    features: "Tất cả đều chạy bằng công nghệ GPT-4o mới nhất 💡",
    pricing: "Có bản Free cho sinh viên luôn đó nha 😎",
    faq: "Cần mình giải thích thêm chỗ nào không? 🤔",
    cta: "Sẵn sàng đăng ký chưa nè? Mình giúp luôn 😁"
};

// ── SUB-COMPONENTS ──
const FadeIn = ({ children, delay = 0, className = "" }) => (
    <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6, delay, ease: "easeOut" }}
        className={className}
    >
        {children}
    </motion.div>
);

const MarqueeColumn = ({ items, duration, reverse = false, className = "" }) => (
    <div className={`overflow-hidden ${className}`}>
        <div className={`flex flex-col gap-5 ${reverse ? 'animate-marquee-reverse' : 'animate-marquee'}`} 
             style={{ 
                 animationDuration: duration,
                 willChange: "transform"
             }}>
            {[...items, ...items].map((item, idx) => ( 
                <div key={idx} className="flex items-center gap-4 p-4 bg-white/90 border border-slate-200 shadow-sm rounded-2xl will-change-transform transform-gpu transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"> 
                    <div className="p-2 bg-slate-50 rounded-xl">{item.icon}</div>
                    <div>
                        <p className="font-bold text-slate-900 text-sm">{item.text}</p>
                        <p className="text-xs text-slate-500 font-medium">{item.sub}</p>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const HeroBackgroundBlobs = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#fffaf0_0%,#fef7ec_40%,#faf6f3_80%,#f9f9f9_100%)]" />
        <motion.div
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] bg-amber-200/50 rounded-full blur-[80px]"
            style={{ willChange: 'opacity', transform: 'translateZ(0)' }}
        />
        <motion.div
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear", delay: 1 }}
            className="absolute top-[20%] -right-[10%] w-[45vw] h-[45vw] bg-orange-100/50 rounded-full blur-[80px]"
            style={{ willChange: 'opacity', transform: 'translateZ(0)' }}
        />
        <div className="absolute inset-0 bg-white/30 backdrop-blur-[2px]" />
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-b from-transparent to-slate-950 z-10" />
    </div>
);

const TypingText = ({ text, className }) => {
    const letters = Array.from(text);
    const container = { hidden: { opacity: 0 }, visible: (i = 1) => ({ opacity: 1, transition: { staggerChildren: 0.08, delayChildren: i * 0.1 } }) };
    const child = { visible: { opacity: 1, y: 0 }, hidden: { opacity: 0, y: 10 } };
    return (
        <motion.span className={className} variants={container} initial="hidden" animate="visible">
            {letters.map((letter, index) => (
                <motion.span variants={child} key={index}>{letter === " " ? "\u00A0" : letter}</motion.span>
            ))}
        </motion.span>
    );
};

const AIRobotAssistant = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [showBubble, setShowBubble] = useState(true);
    const [bubbleMessage, setBubbleMessage] = useState(SECTION_MESSAGES.hero);
    const [inputValue, setInputValue] = useState("");
    const [messages, setMessages] = useState([
        { id: 1, text: "Chào bạn! Mình là AI Recruiter 🤖 Bạn đang chuẩn bị cho buổi phỏng vấn nào vậy? Mình sẵn sàng giúp!", sender: 'bot', isGreeting: true }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const bubbleTimeoutRef = useRef(null);

    useEffect(() => {
        const handleIntersect = (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const sectionId = entry.target.id;
                    if (SECTION_MESSAGES[sectionId]) {
                        setBubbleMessage(SECTION_MESSAGES[sectionId]);
                        setShowBubble(true);
                        const botAvatar = document.getElementById('bot-avatar-container');
                        if(botAvatar) botAvatar.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.15)' }, { transform: 'scale(1)' }], { duration: 400, easing: 'ease-out' });
                        if (bubbleTimeoutRef.current) clearTimeout(bubbleTimeoutRef.current);
                        bubbleTimeoutRef.current = setTimeout(() => setShowBubble(false), 5000);
                    }
                }
            });
        };
        const observer = new IntersectionObserver(handleIntersect, { root: null, rootMargin: '-50% 0px -50% 0px', threshold: 0 });
        Object.keys(SECTION_MESSAGES).forEach(id => {
            const element = document.getElementById(id);
            if (element) observer.observe(element);
        });
        return () => observer.disconnect();
    }, []);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isTyping]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputValue.trim() || isTyping) return;

        const userText = inputValue.trim();
        const userMsg = { id: Date.now(), text: userText, sender: 'user' };
        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsTyping(true);

        try {
            const reply = await sendChatbotMessage(userText);
            setMessages(prev => [...prev, { id: Date.now() + 1, text: reply, sender: 'bot' }]);
        } catch (err) {
            console.error('Chatbot error:', err?.response?.data ?? err.message);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                text: 'Oops! Mình đang gặp sự cố kết nối 😅 Bạn thử lại sau nhé!',
                sender: 'bot',
                isError: true,
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[999] flex flex-col items-end gap-4 font-sans">
            <AnimatePresence>
                {isOpen && (
                    <motion.div initial={{ opacity: 0, scale: 0.8, y: 20, transformOrigin: "bottom right" }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8, y: 20 }} className="bg-white w-[350px] h-[450px] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden mr-2 mb-2">
                        <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
                            <div className="flex items-center gap-3"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div><div><h4 className="font-bold text-sm">AI Recruiter</h4><p className="text-[10px] text-slate-400">Luôn sẵn sàng 24/7</p></div></div>
                            <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1.5 rounded-full transition-colors"><X size={18} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 scrollbar-thin scrollbar-thumb-amber-200">
                            {messages.map((msg) => (
                                <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.sender === 'user' ? 'bg-amber-500 text-white rounded-br-none' : 'bg-white text-slate-700 border border-slate-200 rounded-bl-none'}`}>{msg.text}</div>
                                </motion.div>
                            ))}
                            {isTyping && (<div className="flex justify-start"><div className="bg-white border border-slate-200 p-3.5 rounded-2xl rounded-bl-none shadow-sm flex gap-1 items-center"><div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div><div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100"></div><div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200"></div></div></div>)}
                            <div ref={messagesEndRef} />
                        </div>
                        <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex gap-2">
                            <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Nhập tin nhắn..." className="flex-1 bg-slate-100 text-sm px-4 py-2.5 rounded-full outline-none focus:ring-2 focus:ring-amber-400 transition-all text-slate-800" />
                            <button type="submit" disabled={!inputValue.trim()} className="bg-amber-500 text-white p-2.5 rounded-full hover:bg-amber-600 hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md flex items-center justify-center"><Send size={16} /></button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {(!isOpen && showBubble) && (
                    <motion.div initial={{ opacity: 0, scale: 0.8, x: 20 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.8, x: 20 }} className="bg-white px-5 py-3 rounded-2xl rounded-br-none shadow-xl border border-slate-200 max-w-[250px] relative mr-4 cursor-pointer hover:-translate-y-0.5 transition-all duration-200" onClick={() => setIsOpen(true)}>
                        <p className="text-sm font-bold text-slate-700 leading-snug">{bubbleMessage}</p>
                        <div className="absolute -bottom-2 right-0 w-4 h-4 bg-white border-b border-r border-slate-200 transform rotate-45"></div>
                        <button onClick={(e) => { e.stopPropagation(); setShowBubble(false); }} className="absolute -top-2 -left-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full p-1 transition-colors"><X size={10} /></button>
                    </motion.div>
                )}
            </AnimatePresence>
            <motion.div id="bot-avatar-container" whileHover={{ scale: 1.1, rotate: 5 }} whileTap={{ scale: 0.9 }} onClick={() => { setIsOpen(!isOpen); setShowBubble(false); }} className="group relative w-16 h-16 md:w-20 md:h-20 cursor-pointer pointer-events-auto shadow-lg rounded-full">
                {!isOpen && (
                    <motion.div animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="absolute inset-0 bg-amber-400 rounded-full blur-md opacity-40" style={{ willChange: "opacity" }} />
                )}
                <div className="relative w-full h-full bg-white border-4 border-amber-400 rounded-full overflow-hidden shadow-sm p-1">
                    <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Robot.png" alt="AI Assistant" className="w-full h-full object-contain" />
                </div>
                <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></span>
                <div className="absolute right-full top-1/2 -translate-y-1/2 mr-4 bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-md">{isOpen ? "Đóng chat" : "Tương tác với mình nè 👋"}</div>
            </motion.div>
        </div>
    );
};

const TermsModal = ({ isOpen, onClose }) => {
    // Khóa cuộn trang (scroll) khi mở Modal để tăng trải nghiệm UX
    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
                    {/* Lớp nền đen mờ (Overlay) */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    />
                    
                    {/* Bảng Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] md:max-h-[85vh]"
                    >
                        {/* Header */}
                        <div className="p-5 md:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="bg-amber-100 p-2 rounded-xl text-amber-600">
                                    <ShieldCheck size={24} />
                                </div>
                                <h3 className="text-lg md:text-xl font-black text-slate-900">Điều khoản & Bảo mật</h3>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-slate-200 text-slate-500 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        {/* Body - Tự động có thanh cuộn nếu nội dung quá dài */}
                        <div className="p-5 md:p-8 overflow-y-auto custom-scrollbar text-sm text-slate-600 space-y-6 flex-1">
                            <section>
                                <h4 className="text-base font-bold text-slate-900 mb-2">1. Thu thập và Xử lý dữ liệu</h4>
                                <p className="leading-relaxed">AI Interviewer thu thập các thông tin cơ bản bao gồm Email, Họ Tên và dữ liệu âm thanh/văn bản trong quá trình phỏng vấn. Dữ liệu này chỉ được sử dụng duy nhất cho mục đích phân tích năng lực và trả về kết quả cho chính bạn.</p>
                            </section>
                            <section>
                                <h4 className="text-base font-bold text-slate-900 mb-2">2. Trí tuệ Nhân tạo (AI) & OpenAI</h4>
                                <p className="leading-relaxed">Hệ thống sử dụng API của OpenAI để xử lý ngôn ngữ tự nhiên. Chúng tôi cam kết <strong>không</strong> sử dụng dữ liệu cá nhân hay CV của bạn để huấn luyện (train) cho các mô hình AI công cộng.</p>
                            </section>
                            <section>
                                <h4 className="text-base font-bold text-slate-900 mb-2">3. Quyền lưu trữ & Xóa dữ liệu</h4>
                                <p className="leading-relaxed">Tất cả lịch sử phỏng vấn được mã hóa bảo mật. Bạn có toàn quyền xem lại, hoặc yêu cầu xóa vĩnh viễn toàn bộ dữ liệu tài khoản của mình khỏi hệ thống cơ sở dữ liệu (PostgreSQL) bất kỳ lúc nào.</p>
                            </section>
                            <section>
                                <h4 className="text-base font-bold text-slate-900 mb-2">4. Giới hạn trách nhiệm</h4>
                                <p className="leading-relaxed">Kết quả đánh giá từ AI mang tính chất tham khảo và hỗ trợ luyện tập. Chúng tôi không đảm bảo kết quả này sẽ phản ánh chính xác 100% quyết định của các nhà tuyển dụng thực tế.</p>
                            </section>
                        </div>
                        
                        {/* Footer */}
                        <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
                            <button onClick={onClose} className="px-6 md:px-8 py-2.5 md:py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors w-full sm:w-auto">
                                Tôi đã hiểu
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

// ── MAIN COMPONENT ──
export default function Home() {
    const navigate = useNavigate();
    const [openFaq, setOpenFaq] = useState(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isTermsOpen, setIsTermsOpen] = useState(false); 
    
    // States for Footer Newsletter
    const [emailSub, setEmailSub] = useState("");
    const [isSubscribed, setIsSubscribed] = useState(false);
    
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
    const toggleFaq = (index) => setOpenFaq(openFaq === index ? null : index);
    const VISUALIZER_HEIGHTS = [40, 75, 55, 90, 60];

    const [user, setUser] = useState(null);
    const [pricingPlans, setPricingPlans] = useState([]);
    const [loadingPlans, setLoadingPlans] = useState(true);

    useEffect(() => {
        const recordVisit = async () => {
            try {
                await fetch('https://ai-mockinterview.onrender.com/api/tracking/record', {
                    method: 'POST'
                });
            } catch (error) {
                console.error("Lỗi khi ghi nhận truy cập từ Frontend:", error);
            }
        };

        recordVisit();
    }, []);

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const res = await getSubscriptionPlans();
                const formattedPlans = res.data.map(plan => ({
                    id: plan.id,
                    name: plan.name,
                    price: plan.price === 0 ? "0đ" : `${plan.price / 1000}k`,
                    period: plan.price === 0 ? "Bắt đầu hành trình" : "/ tháng",
                    desc: `${plan.maxInterviewsPerMonth === -1 ? 'Không giới hạn' : plan.maxInterviewsPerMonth} lượt/tháng`,
                    features: plan.features,
                    highlight: plan.isHighlight,
                    cta: plan.price === 0 ? "Dùng thử miễn phí" : "Nâng cấp ngay"
                }));
                setPricingPlans(formattedPlans);
            } catch (error) {
                console.error(error);
            } finally {
                setLoadingPlans(false);
            }
        };

        fetchPlans();
    }, []);

    useEffect(() => {
        const syncUser = () => setUser(localStorage.getItem('fullName'));
        syncUser();

        window.addEventListener('authChange', syncUser);
        window.addEventListener('storage', syncUser);
        return () => {
            window.removeEventListener('authChange', syncUser);
            window.removeEventListener('storage', syncUser);
        };
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        setUser(null);
        navigate('/auth');
    };

    const handleSelectPlan = (plan) => {
        const isLoggedIn = user || localStorage.getItem('token') || localStorage.getItem('fullName');
        const isFree = plan.price === '0đ' || plan.price === 0 || plan.name.toLowerCase().includes('free');
        
        if (isFree) {
            navigate(isLoggedIn ? '/interview' : '/auth');
            return;
        }
        
        if (!isLoggedIn) {
            navigate('/auth');
            return;
        }
        
        navigate('/payment', { state: { selectedPlan: plan } });
    };
    
    const handleSubscribe = (e) => {
        e.preventDefault();
        if (emailSub.trim()) {
            setIsSubscribed(true);
            setTimeout(() => {
                setIsSubscribed(false);
                setEmailSub("");
            }, 3000);
        }
    };

    const isAuthenticated = user || localStorage.getItem('token') || localStorage.getItem('fullName');

    return (
        <div className="font-sans text-slate-900 bg-white selection:bg-amber-100 selection:text-amber-900 overflow-x-hidden">
            <motion.div className="fixed top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 to-amber-600 z-[100] origin-left" style={{ scaleX }} />

            <style>{`
                @keyframes marquee { 0% { transform: translateY(0); } 100% { transform: translateY(-50%); } }
                @keyframes marquee-reverse { 0% { transform: translateY(-50%); } 100% { transform: translateY(0); } }
                .animate-marquee { animation: marquee linear infinite; }
                .animate-marquee-reverse { animation: marquee-reverse linear infinite; }
                .perspective-1000 { perspective: 1000px; }
                @keyframes shimmer { 100% { transform: translateX(100%); } }
            `}</style>

            <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
            <AIRobotAssistant />

            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[101] lg:hidden"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 bottom-0 w-[280px] bg-white z-[102] shadow-2xl flex flex-col lg:hidden"
                        >
                            <div className="p-5 flex justify-between items-center border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                    <div className="bg-slate-900 p-1.5 rounded-lg text-amber-400"><Crown size={18} strokeWidth={3} /></div>
                                    <span className="font-bold text-lg text-slate-900">Menu</span>
                                </div>
                                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto py-6 px-5 flex flex-col gap-6">
                                {['Quy trình', 'Tính năng', 'Bảng giá', 'FAQ'].map((item) => (
                                    <a
                                        key={item}
                                        href={`#${item === 'Quy trình' ? 'process' : item === 'Tính năng' ? 'features' : item === 'Bảng giá' ? 'pricing' : 'faq'}`}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="text-lg font-bold text-slate-700 hover:text-amber-600 transition-colors"
                                    >
                                        {item}
                                    </a>
                                ))}
                                <div className="h-px bg-slate-100 my-2" />
                                {isAuthenticated ? (
                                    <div className="flex flex-col gap-4">
                                        <button onClick={() => { setIsMobileMenuOpen(false); navigate('/profile'); }} className="flex items-center gap-3 text-slate-700 font-bold hover:text-amber-600 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                                            <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-sm">{user ? user.charAt(0).toUpperCase() : 'U'}</div>
                                            Hồ sơ của bạn
                                        </button>
                                        <button onClick={() => { setIsMobileMenuOpen(false); navigate('/dashboard'); }} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors">Dashboard</button>
                                        <button onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }} className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"><LogOut size={18}/> Đăng xuất</button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-4">
                                        <button onClick={() => { setIsMobileMenuOpen(false); navigate('/auth'); }} className="w-full py-3 text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold transition-colors">Đăng nhập</button>
                                        <button onClick={() => { setIsMobileMenuOpen(false); navigate('/auth'); }} className="w-full py-3 bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors">Bắt đầu ngay <ArrowRight size={16}/></button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200/60 transition-all duration-300 transform-gpu">
                <div className="max-w-[95%] mx-auto px-4 h-20 flex justify-between items-center">
                    <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <div className="bg-slate-900 p-2 rounded-xl text-amber-400 shadow-md group-hover:-translate-y-0.5 transition-all duration-200"><Crown size={24} strokeWidth={3} /></div>
                        <span className="text-xl font-bold tracking-tight text-slate-900">AI Interviewer<span className="text-amber-500">.</span></span>
                    </div>
                    
                    <div className="hidden lg:flex items-center gap-10 text-base font-medium text-slate-500">
                        {['Quy trình', 'Tính năng', 'Bảng giá', 'FAQ'].map((item) => (
                            <a key={item} href={`#${item === 'Quy trình' ? 'process' : item === 'Tính năng' ? 'features' : item === 'Bảng giá' ? 'pricing' : 'faq'}`} className="hover:text-amber-600 hover:-translate-y-0.5 transition-all duration-200">{item}</a>
                        ))}
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {isAuthenticated ? (
                            <div className="hidden lg:flex items-center gap-3 sm:gap-4">
                                <button 
                                    onClick={() => navigate('/profile')}
                                    className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:-translate-y-0.5 hover:shadow-sm rounded-full transition-all duration-200"
                                >
                                    <div className="w-6 h-6 bg-amber-100 text-amber-700 font-bold rounded-full flex items-center justify-center text-xs">
                                        {user ? user.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                    <span className="text-sm font-bold text-slate-700">{user || 'User'}</span>
                                </button>
                                <button 
                                    onClick={() => navigate('/dashboard')} 
                                    className="px-5 py-2.5 bg-slate-900 text-white rounded-full font-bold text-sm shadow-sm hover:shadow-md hover:bg-slate-800 hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
                                >
                                    Dashboard
                                </button>
                                <button 
                                    onClick={handleLogout}
                                    className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                    title="Đăng xuất"
                                >
                                    <LogOut size={20} /> 
                                </button>
                            </div>
                        ) : (
                            <div className="hidden lg:flex items-center gap-4">
                                <button onClick={() => navigate('/auth')} className="text-slate-600 font-bold hover:text-slate-900 hover:-translate-y-0.5 transition-all duration-200 text-base px-2">Đăng nhập</button>
                                <button onClick={() => navigate('/auth')} className="px-6 py-3 bg-slate-900 text-white rounded-full font-bold text-sm shadow-sm hover:shadow-md hover:bg-slate-800 hover:-translate-y-0.5 flex items-center gap-2 transition-all duration-200">Bắt đầu ngay <ArrowRight size={16}/></button>
                            </div>
                        )}

                        <button 
                            className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors ml-2"
                            onClick={() => setIsMobileMenuOpen(true)}
                        >
                            <Menu size={26} />
                        </button>
                    </div>
                </div>
            </nav>

            <section id="hero" className="relative min-h-screen flex items-center overflow-hidden pt-20">
                <HeroBackgroundBlobs />
                <div className="absolute inset-0 flex justify-end opacity-40 pointer-events-none -z-10 transform skew-y-3 scale-110 origin-top-right">
                    <div className="flex gap-8 mr-[-5%]">
                        <MarqueeColumn items={successCards.slice(0, 5)} duration="50s" />
                        <MarqueeColumn items={successCards.slice(5, 10)} duration="60s" reverse={true} />
                        <MarqueeColumn items={successCards.slice(0, 5)} duration="70s" className="hidden 2xl:flex"/>
                        <MarqueeColumn items={successCards.slice(5, 10)} duration="80s" reverse={true} className="hidden 3xl:flex"/>
                    </div>
                </div>

                <div className="w-full max-w-[92%] mx-auto px-4 grid lg:grid-cols-2 gap-8 items-center relative z-10">
                    <div className="text-center lg:text-left flex flex-col justify-center h-full pt-10 lg:pt-0">
                        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-5xl md:text-6xl lg:text-7xl 2xl:text-8xl font-black text-slate-900 mb-8 leading-[1.05] tracking-tight">
                            {user ? `Chào mừng trở lại, ${user}!` : "Tự tin phỏng vấn"} <br/>
                            <span className="text-slate-400">Dễ như chat với </span>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600 inline-block">
                                <TypingText text="AI Recruiter." />
                            </span>
                        </motion.h1>
                        <FadeIn delay={0.3}>
                            <p className="text-lg md:text-xl 2xl:text-2xl text-slate-600 mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-medium">Nền tảng luyện phỏng vấn 1:1 với AI số 1 Việt Nam. Nhận chiến thuật trả lời chuẩn xác ngay hôm nay.</p>
                        </FadeIn>
                        <FadeIn delay={0.5}>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center">
                                <button onClick={() => navigate(isAuthenticated ? '/interview' : '/auth')} className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl font-bold text-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-3">
                                    <Mic size={24} /> {isAuthenticated ? 'Tiếp tục luyện tập' : 'Thử phỏng vấn ngay'}
                                </button>
                                <button className="w-full sm:w-auto px-10 py-4 bg-white text-slate-800 border border-slate-200 rounded-2xl font-bold text-lg hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 backdrop-blur-sm">
                                    <Play size={20} fill="currentColor" className="text-slate-700" /> Xem Demo
                                </button>
                            </div>
                        </FadeIn>
                    </div>

                    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="relative hidden lg:flex justify-center items-center h-full w-full">
                        <motion.div 
                            style={{ willChange: "transform" }}
                            animate={{ y: [0, -20, 0] }} 
                            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} 
                            className="relative z-10 w-full max-w-[650px] 2xl:max-w-[800px] drop-shadow-2xl"
                        >
                            <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Robot.png" alt="AI Robot 3D" className="w-full h-auto object-contain" />
                            
                            <motion.div className="absolute top-[20%] -left-[5%] bg-white/95 backdrop-blur-md p-5 rounded-2xl shadow-xl border border-slate-100 flex gap-4 items-center">
                                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 font-bold"><Check size={24}/></div>
                                <div><p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Điểm đánh giá</p><p className="text-2xl font-black text-slate-900">98/100</p></div>
                            </motion.div>
                            <motion.div className="absolute bottom-[20%] right-[5%] bg-white/95 backdrop-blur-md px-6 py-4 rounded-2xl shadow-xl border border-slate-100 flex gap-4 items-center">
                                <div className="w-4 h-4 bg-red-500 rounded-full animate-ping"></div>
                                <div><p className="text-sm font-bold text-slate-800">Đang ghi âm...</p>
                                    <div className="flex gap-1 h-4 items-end mt-1">
                                        {VISUALIZER_HEIGHTS.map((h, i) => (
                                            <div key={i} className="w-1 bg-slate-800 rounded-full animate-pulse" style={{ height: `${h}%`, animationDelay: `${i * 0.1}s` }}></div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                </div>
                
                <motion.div 
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="hidden md:flex absolute bottom-10 left-1/2 -translate-x-1/2 text-slate-400 flex-col items-center gap-2 cursor-pointer hover:text-amber-500 transition-colors z-20"
                    onClick={() => document.getElementById('problem').scrollIntoView({ behavior: 'smooth' })}
                >
                    <span className="text-xs font-bold uppercase tracking-[0.2em]">Khám phá tính năng</span>
                    <ChevronDown size={24} />
                </motion.div>
            </section>

            <section id="problem" className="py-24 bg-slate-950 text-white">
                <div className="max-w-7xl mx-auto px-6">
                    <FadeIn className="text-center mb-16">
                        <h2 className="text-amber-500 font-bold tracking-widest uppercase text-sm mb-3">Vấn đề của bạn</h2>
                        <h3 className="text-3xl md:text-5xl font-black">Tại sao bạn vẫn trượt?</h3>
                    </FadeIn>
                    <div className="grid md:grid-cols-3 gap-8">
                        {problems.map((prob, i) => (
                            <FadeIn key={i} delay={i * 0.1}>
                                <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 hover:border-amber-500/50 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group h-full cursor-default">
                                    <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-6 text-amber-500 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-amber-900/10">
                                        {prob.icon}
                                    </div>
                                    <h4 className="text-xl font-bold mb-3">{prob.title}</h4>
                                    <p className="text-slate-400 text-sm leading-relaxed mb-6">{prob.desc}</p>
                                    <div className="inline-block px-3 py-1 bg-red-500/10 text-red-400 text-xs font-bold rounded-lg border border-red-500/20">
                                        {prob.stat}
                                    </div>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            <section id="process" className="py-32 bg-white relative overflow-hidden border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <FadeIn className="text-center mb-20">
                        <h2 className="text-amber-600 font-bold tracking-widest uppercase text-sm mb-3">Quy trình 3 bước</h2>
                        <h3 className="text-3xl md:text-5xl font-black text-slate-900">Từ Upload đến Offer</h3>
                    </FadeIn>

                    <div className="flex flex-col md:flex-row justify-center items-start gap-12 mb-24 relative">
                        {[
                            { step: "01", title: "Tải lên JD", desc: "Paste mô tả công việc (JD) bạn muốn ứng tuyển." },
                            { step: "02", title: "Phỏng vấn AI", desc: "Trả lời câu hỏi chuyên sâu từ AI Recruiter." },
                            { step: "03", title: "Nhận Feedback", desc: "Xem điểm số và gợi ý sửa lỗi chi tiết." }
                        ].map((s, i) => (
                            <FadeIn key={i} delay={i * 0.2} className="flex-1 text-center group relative z-10 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                                <div className="w-20 h-20 mx-auto bg-slate-50 rounded-2xl flex items-center justify-center font-black text-2xl text-slate-300 mb-6 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300 shadow-sm">
                                    {s.step}
                                </div>
                                <h4 className="text-xl font-bold mb-2 text-slate-900">{s.title}</h4>
                                <p className="text-sm text-slate-500 px-4 leading-relaxed">{s.desc}</p>
                            </FadeIn>
                        ))}
                    </div>

                    <FadeIn delay={0.4} className="relative max-w-5xl mx-auto">
                        <div className="bg-slate-900 rounded-2xl p-2 shadow-2xl border border-slate-800 ring-1 ring-slate-200 shadow-slate-200/50">
                            <div className="bg-slate-800 h-10 rounded-t-xl flex items-center px-4 gap-2 mb-1">
                                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                <div className="ml-4 bg-slate-900/80 h-6 rounded-md w-96 text-[11px] flex items-center px-3 text-slate-400 font-mono border border-slate-700/50">localhost:5173/interview</div>
                            </div>
                            <div className="bg-white rounded-b-xl h-[450px] md:h-[550px] flex items-center justify-center relative overflow-hidden group cursor-pointer bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] border-t border-slate-800">
                                <div className="text-center z-10">
                                    <div className="w-24 h-24 bg-blue-50 border border-blue-100 shadow-md rounded-2xl mx-auto mb-6 flex items-center justify-center animate-bounce">
                                        <Bot size={48} className="text-blue-600" />
                                    </div>
                                    <h3 className="text-3xl font-bold text-slate-800 mb-3">Xin chào Tâm,</h3>
                                    <p className="text-slate-500 text-lg">Tôi là AI Recruiter. Hãy giới thiệu về bản thân bạn?</p>
                                    
                                    <div className="absolute bottom-12 left-12 right-12 flex flex-col gap-4 opacity-0 group-hover:opacity-100 transition-all duration-700 transform translate-y-10 group-hover:translate-y-0">
                                        <div className="self-end bg-amber-500 text-white p-4 rounded-2xl rounded-tr-sm max-w-sm text-sm shadow-md">
                                            Em là sinh viên năm cuối ĐH FPT, chuyên ngành Kỹ thuật phần mềm...
                                        </div>
                                        <div className="self-start bg-white text-slate-800 p-4 rounded-2xl rounded-tl-sm max-w-sm text-sm shadow-md border border-slate-200 flex gap-3 items-center">
                                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                            Rất tốt. Vậy điểm mạnh lớn nhất của bạn là gì?
                                        </div>
                                    </div>
                                </div>                             
                            </div>
                        </div>
                    </FadeIn>
                </div>
            </section>            

            <section id="features" className="py-32 bg-slate-950 text-white">
                <div className="max-w-7xl mx-auto px-6">
                    <FadeIn className="text-center mb-24">
                        <h2 className="text-amber-500 font-bold tracking-[0.3em] uppercase text-sm mb-4">Core Engine</h2>
                        <h3 className="text-4xl md:text-6xl font-black">Vũ khí bí mật của bạn</h3>
                    </FadeIn>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-auto md:h-[600px]">
                        <motion.div whileHover={{ y: -5 }} className="md:col-span-8 bg-slate-900 rounded-[2rem] p-10 border border-slate-800 relative overflow-hidden group transform-gpu transition-all duration-300">
                            <div className="relative z-10">
                                <Trophy className="text-amber-500 mb-6" size={48} />
                                <h4 className="text-3xl font-black mb-4">Cá nhân hóa theo JD</h4>
                                <p className="text-slate-400 max-w-md text-lg leading-relaxed">Hệ thống AI bóc tách từng từ khóa trong mô tả công việc của bạn để đưa ra bộ câu hỏi sát thực tế nhất.</p>
                            </div>
                            <div className="absolute right-0 bottom-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] group-hover:bg-amber-500/20 transition-all duration-500" />
                        </motion.div>
                        <motion.div whileHover={{ y: -5 }} className="md:col-span-4 bg-amber-500 rounded-[2rem] p-10 text-slate-900 group relative overflow-hidden transform-gpu transition-all duration-300 shadow-xl shadow-amber-500/10">
                            <div className="relative z-10">
                                <Zap size={48} className="mb-6" />
                                <h4 className="text-2xl font-black mb-4">Real-time Feedback</h4>
                                <p className="font-bold opacity-80 leading-relaxed">Phân tích lỗi sai ngay khi bạn vừa dứt lời. Không cần chờ đợi.</p>
                            </div>
                            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/20 rounded-full blur-2xl" />
                        </motion.div>
                        <motion.div whileHover={{ y: -5 }} className="md:col-span-4 bg-slate-900 rounded-[2rem] p-10 border border-slate-800 transform-gpu transition-all duration-300 hover:border-slate-700">
                            <Target size={48} className="text-slate-400 mb-6" />
                            <h4 className="text-2xl font-black mb-4">Báo cáo Năng lực</h4>
                            <p className="text-slate-500 font-medium leading-relaxed">Xuất báo cáo chi tiết về điểm mạnh, điểm yếu sau mỗi buổi.</p>
                        </motion.div>
                        <motion.div whileHover={{ y: -5 }} className="md:col-span-8 bg-gradient-to-r from-slate-900 to-slate-800 rounded-[2rem] p-10 border border-slate-800 flex items-center justify-between group transform-gpu transition-all duration-300">
                            <div className="max-w-sm">
                                <Star size={48} className="text-yellow-400 mb-6" />
                                <h4 className="text-2xl font-black mb-4">95% Tỉ lệ hài lòng</h4>
                                <p className="text-slate-400 leading-relaxed">Đã được kiểm chứng bởi hơn 5,000 sinh viên FPT và các trường công nghệ.</p>
                            </div>
                            <div className="hidden lg:block w-32 h-32 bg-amber-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                        </motion.div>
                    </div>
                </div>
            </section>

            <section id="pricing" className="py-32 bg-slate-50 relative overflow-hidden perspective-1000">
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <FadeIn className="text-center mb-20">
                        <h2 className="text-amber-600 font-bold tracking-[0.2em] uppercase text-sm mb-3">Đầu tư thông minh</h2>
                        <h3 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">Chọn gói phù hợp</h3>
                        <p className="text-slate-500 text-lg font-medium">Luyện tập phỏng vấn tự tin – chọn gói phù hợp với mục tiêu của bạn.</p>
                    </FadeIn>
                    
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
                        {loadingPlans ? (
                            <div className="col-span-full text-center text-slate-500 py-10 flex items-center justify-center gap-3">
                                <Loader2 className="animate-spin text-amber-500" /> Đang tải bảng giá...
                            </div>
                        ) : (
                            pricingPlans.map((plan, i) => (
                                <FadeIn key={plan.id || i} delay={i * 0.1} className="h-full">
                                    <motion.div
                                        whileHover={{ y: -8, scale: 1.01 }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                        className={`relative p-8 md:p-10 rounded-[2rem] h-full flex flex-col justify-between overflow-hidden group transition-all duration-300 transform-gpu ${
                                            plan.highlight 
                                                ? 'bg-slate-900 text-white border border-slate-800 shadow-xl shadow-amber-900/10' 
                                                : 'bg-white text-slate-900 border border-slate-200 shadow-sm hover:shadow-lg hover:border-slate-300'
                                        }`}
                                    >
                                        {plan.highlight && (
                                            <div className="absolute inset-0 p-[1px] rounded-[2rem] bg-gradient-to-br from-amber-400 via-yellow-200 to-transparent opacity-30 pointer-events-none -z-10" />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite] pointer-events-none z-20" />
                                        {plan.highlight && (
                                            <div className="absolute top-6 right-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold uppercase tracking-wider px-8 py-1.5 shadow-sm transform rotate-45 translate-x-8 translate-y-2 z-30">
                                                Best Value
                                            </div>
                                        )}

                                        <div className="relative z-10">
                                            <h4 className="text-2xl font-bold mb-2 flex items-center gap-2">
                                                {plan.name}
                                                {plan.highlight && <Crown size={20} className="text-amber-400 fill-amber-400" />}
                                            </h4>
                                            <p className={`text-sm mb-8 pb-8 border-b ${plan.highlight ? 'text-slate-400 border-slate-800' : 'text-slate-500 border-slate-100'}`}>{plan.desc}</p>
                                            
                                            <div className="flex items-baseline gap-1 mb-8">
                                                <span className={`text-5xl lg:text-6xl font-black tracking-tight ${plan.highlight ? 'text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-500' : 'text-slate-900'}`}>{plan.price}</span>
                                                <span className={`text-lg font-medium ${plan.highlight ? 'text-slate-400' : 'text-slate-500'}`}>{plan.period}</span>
                                            </div>

                                            <ul className="space-y-5 mb-10">
                                                {plan.features.map((feat, idx) => (
                                                    <li key={idx} className={`flex items-start gap-3 text-sm font-medium group/item ${plan.highlight ? 'text-slate-300' : 'text-slate-600'}`}>
                                                        <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${plan.highlight ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-100 text-slate-600'}`}>
                                                            <Check size={12} strokeWidth={4} />
                                                        </div>
                                                        <span className="flex-1">{feat}</span>
                                                        <Info size={14} className={`opacity-0 group-hover/item:opacity-50 cursor-help ${plan.highlight ? 'text-slate-500' : 'text-slate-400'}`} />
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <button 
                                            onClick={() => handleSelectPlan(plan)} 
                                            className={`relative w-full py-4 rounded-xl font-bold text-base transition-all duration-200 transform overflow-hidden group/btn z-10 ${
                                                plan.highlight 
                                                    ? 'bg-amber-500 text-white shadow-md hover:shadow-lg hover:bg-amber-600 hover:-translate-y-0.5' 
                                                    : 'bg-white text-slate-800 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:-translate-y-0.5'
                                            }`}
                                        >
                                            <span className="relative z-10 flex items-center justify-center gap-2">
                                                {plan.cta} <ArrowRight size={18} className="transition-transform group-hover/btn:translate-x-1" />
                                            </span>
                                        </button>
                                    </motion.div>
                                </FadeIn>
                            ))
                        )}
                    </div>
                </div>
            </section>

            <section className="py-24 bg-white border-t border-slate-100">
                <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16">
                    <div id="faq">
                        <h3 className="text-3xl font-black mb-8 text-slate-900">Câu hỏi thường gặp</h3>
                        <div className="space-y-4">
                            {faqs.map((f, i) => (
                                <div key={i} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
                                    <button onClick={() => toggleFaq(i)} className="w-full flex justify-between items-center p-5 hover:bg-slate-50 transition-colors text-left">
                                        <span className="font-bold text-slate-800">{f.q}</span>
                                        {openFaq === i ? <ChevronUp size={20} className="text-amber-500" /> : <ChevronDown size={20} className="text-slate-400" />}
                                    </button>
                                    {openFaq === i && <div className="p-5 pt-0 text-slate-600 text-sm leading-relaxed border-t border-slate-100 bg-slate-50/50">{f.a}</div>}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h3 className="text-3xl font-black mb-8 text-slate-900">Sinh viên nói gì?</h3>
                        <div className="grid gap-6">
                            {[
                                { name: "Minh Tuấn", role: "Fresher @ FPT Software", quote: "Nhờ AI Mock Interviewer, mình đã tự tự tin trả lời phỏng vấn tiếng Anh và nhận offer ngay lần đầu." },
                                { name: "Lan Anh", role: "Intern @ Shopee", quote: "Feedback cực kỳ chi tiết, giúp mình nhận ra những lỗi sai ngớ ngẩn về body language mà mình không hề biết." }
                            ].map((t, i) => (
                                <motion.div whileHover={{ scale: 1.02, y: -2 }} key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative transform-gpu transition-all duration-300">
                                    <div className="flex gap-1 text-amber-400 mb-4"><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /></div>
                                    <p className="text-slate-600 italic mb-4">"{t.quote}"</p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center font-bold text-slate-700 text-sm">{t.name[0]}</div>
                                        <div><p className="font-bold text-sm text-slate-900">{t.name}</p><p className="text-xs text-slate-500">{t.role}</p></div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section id="cta" className="py-24 px-6 bg-slate-50 overflow-hidden border-t border-slate-100">
                <div className="max-w-7xl mx-auto">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        className="relative rounded-[3rem] overflow-hidden bg-slate-900 px-6 py-24 text-center shadow-xl transform-gpu"
                    >
                        <div className="hidden md:block absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-b from-amber-500/10 to-transparent rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
                        <div className="hidden md:block absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-t from-yellow-600/10 to-transparent rounded-full blur-[100px] translate-y-1/2 -translate-x-1/3 pointer-events-none"></div>
                        
                        <div className="relative z-10 max-w-3xl mx-auto">
                            <h2 className="text-4xl md:text-5xl font-black text-white mb-6">Sẵn sàng để <span className="text-amber-500">tỏa sáng?</span></h2>
                            <p className="text-slate-400 text-lg mb-10">Gia nhập cùng 15,000+ sinh viên đã thay đổi sự nghiệp.</p>
                            <button onClick={() => navigate('/auth')} className="px-12 py-4 bg-amber-500 text-white rounded-full font-bold text-lg shadow-md hover:-translate-y-1 transition-all duration-300 hover:shadow-lg hover:bg-amber-600">
                                Đăng ký ngay - Miễn phí
                            </button>
                        </div>
                    </motion.div>
                </div>
            </section>

            <footer className="bg-slate-950 border-t border-slate-900 pt-20 pb-10 text-slate-400">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
                        
                        {/* Cột 1: Thông tin & Mạng xã hội */}
                        <div className="col-span-1 md:col-span-4 lg:col-span-5">
                            <div 
                                className="flex items-center gap-2 mb-6 cursor-pointer group w-fit"
                                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            >
                                <div className="bg-slate-800 p-2 rounded-xl text-amber-500 group-hover:-translate-y-1 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300">
                                    <Crown size={20} />
                                </div>
                                <span className="text-2xl font-black text-white group-hover:text-amber-400 transition-colors">AI Interviewer.</span>
                            </div>
                            <p className="text-sm leading-relaxed mb-8 opacity-80 max-w-sm">
                                Nền tảng luyện phỏng vấn AI hàng đầu Việt Nam. Nâng tầm kỹ năng thực chiến, giúp sinh viên tự tin chinh phục mọi nhà tuyển dụng.
                            </p>
                            
                            <div className="flex gap-4">
                                <a 
                                    href="https://www.facebook.com/profile.php?id=61590511753646" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    title="Theo dõi chúng tôi trên Facebook"
                                    className="p-3 bg-slate-900 border border-slate-800 rounded-full hover:bg-[#1877F2] hover:border-[#1877F2] hover:text-white cursor-pointer transition-all duration-300 hover:-translate-y-1.5 shadow-sm hover:shadow-lg hover:shadow-[#1877F2]/40"
                                >
                                    <Facebook size={18} />
                                </a>
                                <a 
                                    href="https://github.com/chinsuhdh/ai_mockinterview" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    title="Mã nguồn dự án trên GitHub"
                                    className="p-3 bg-slate-900 border border-slate-800 rounded-full hover:bg-white hover:border-white hover:text-slate-900 cursor-pointer transition-all duration-300 hover:-translate-y-1.5 shadow-sm hover:shadow-lg hover:shadow-white/40"
                                >
                                    <Github size={18} />
                                </a>
                                <a 
                                    href="#" 
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Kết nối qua LinkedIn"
                                    className="p-3 bg-slate-900 border border-slate-800 rounded-full hover:bg-[#0A66C2] hover:border-[#0A66C2] hover:text-white cursor-pointer transition-all duration-300 hover:-translate-y-1.5 shadow-sm hover:shadow-lg hover:shadow-[#0A66C2]/40"
                                >
                                    <Linkedin size={18} />
                                </a>
                            </div>
                        </div>

                        {/* Cột 2 & 3: Link điều hướng */}
                        <div className="col-span-1 md:col-span-4 lg:col-span-3 flex flex-row justify-between md:justify-around">
                            <div>
                                <h4 className="font-bold text-lg mb-6 text-slate-200">Sản phẩm</h4>
                                <ul className="space-y-4 text-sm font-medium">
                                    {['Tính năng', 'Bảng giá', 'Showcase'].map(item => (
                                        <li key={item}>
                                            <a 
                                                href={`#${item === 'Bảng giá' ? 'pricing' : item === 'Tính năng' ? 'features' : 'process'}`}
                                                className="group flex items-center hover:text-amber-400 transition-colors"
                                            >
                                                <ChevronRight size={14} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300 mr-1" />
                                                {item}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div>
                                <h4 className="font-bold text-lg mb-6 text-slate-200">Hỗ trợ</h4>
                                <ul className="space-y-4 text-sm font-medium">
                                    <li>
                                        <a 
                                            href="#faq"
                                            className="group flex items-center hover:text-amber-400 transition-colors"
                                        >
                                            <ChevronRight size={14} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300 mr-1" />
                                            Câu hỏi thường gặp
                                        </a>
                                    </li>
                                    <li>
                                        <a 
                                            href="mailto:buingoctam06042003@gmail.com?subject=Hỗ trợ dự án AI Mock Interviewer&body=Xin chào team hỗ trợ,%0D%0A%0D%0ATôi cần hỗ trợ về vấn đề: "
                                            className="group flex items-center hover:text-amber-400 transition-colors"
                                        >
                                            <ChevronRight size={14} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300 mr-1" />
                                            Liên hệ
                                        </a>
                                    </li>
                                    <li>
                                        <button 
                                            onClick={() => setIsTermsOpen(true)}
                                            className="group flex items-center hover:text-amber-400 transition-colors"
                                        >
                                            <ChevronRight size={14} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300 mr-1" />
                                            Điều khoản
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Cột 4: Form Đăng ký nhận tin */}
                        <div className="col-span-1 md:col-span-4 lg:col-span-4">
                            <h4 className="font-bold text-lg mb-6 text-slate-200">Đăng ký nhận mẹo phỏng vấn</h4>
                            
                            <form onSubmit={handleSubscribe} className="relative flex items-center">
                                <input 
                                    type="email"
                                    value={emailSub}
                                    onChange={(e) => setEmailSub(e.target.value)}
                                    placeholder="Nhập email của bạn..." 
                                    required
                                    disabled={isSubscribed}
                                    className="bg-slate-900/80 border border-slate-800 px-5 py-3.5 rounded-2xl text-sm w-full outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 text-white placeholder:text-slate-500 transition-all shadow-inner" 
                                />
                                <button 
                                    type="submit"
                                    disabled={isSubscribed || !emailSub}
                                    className={`absolute right-1.5 p-2.5 rounded-xl flex items-center justify-center transition-all duration-300 ${
                                        isSubscribed 
                                            ? 'bg-green-500 text-white' 
                                            : 'bg-amber-500 hover:bg-amber-400 text-slate-900 disabled:bg-slate-800 disabled:text-slate-600'
                                    }`}
                                >
                                    {isSubscribed ? <CheckCircle2 size={18} className="animate-in zoom-in" /> : <ArrowRight size={18} />}
                                </button>
                            </form>
                            
                            <div className="mt-3 h-5">
                                <AnimatePresence mode="wait">
                                    {isSubscribed ? (
                                        <motion.p 
                                            initial={{ opacity: 0, y: -5 }} 
                                            animate={{ opacity: 1, y: 0 }} 
                                            exit={{ opacity: 0 }}
                                            className="text-xs text-green-400 font-medium"
                                        >
                                            Cảm ơn bạn! Chúng tôi đã ghi nhận email.
                                        </motion.p>
                                    ) : (
                                        <motion.p 
                                            initial={{ opacity: 0 }} 
                                            animate={{ opacity: 1 }}
                                            className="text-xs text-slate-500"
                                        >
                                            Nhận CV Templates và mẹo phỏng vấn miễn phí mỗi tuần.
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-slate-800/50 pt-8 flex flex-col md:flex-row justify-between items-center text-sm font-medium text-slate-500">
                        <p>© 2026 Dự án EXE101 - FPT University.</p>
                        <div className="flex items-center gap-1.5 mt-4 md:mt-0 bg-slate-900/50 px-4 py-2 rounded-full border border-slate-800">
                            Designed with <span className="text-rose-500 animate-pulse inline-block mx-0.5">❤️</span> by Team AI Interviewer.
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}