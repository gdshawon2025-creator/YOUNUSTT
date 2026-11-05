import React, { useEffect, useState, useRef } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  HeartPulse,
  Wheat,
  TrendingUp,
  ListChecks,
  User,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  Clock,
  Sparkle,
} from 'lucide-react';
import { useFarm } from '../context/FarmContext';
import { ActiveTab, AiChatMessage, FarmAiGuidance } from '../types/farm';

interface AiAdvisorViewProps {
  onNavigate?: (tab: ActiveTab) => void;
}

const QUICK_PROMPTS = [
  'আজকের খামারের শীর্ষ ৩টি জরুরি করণীয় কী?',
  'খাদ্য খরচ কমিয়ে দুধ ও ওজন বাড়ানোর উপায় কী?',
  'অসুস্থ ও গর্ভবতী পশুর বিশেষ যত্ন কীভাবে নেব?',
  'খামারের বকেয়া টাকা দ্রুত আদায়ের কৌশল কী?',
  'বর্ষা ও শীতে রোগ প্রতিরোধে কী কী ব্যবস্থা নেব?',
];

export const AiAdvisorView: React.FC<AiAdvisorViewProps> = ({ onNavigate }) => {
  const {
    animals,
    feedStocks,
    transactions,
    sales,
    summary,
    profile,
    showToast,
  } = useFarm();

  const [guidance, setGuidance] = useState<FarmAiGuidance | null>(null);
  const [isLoadingGuidance, setIsLoadingGuidance] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<Record<number, boolean>>({});

  // Chat State
  const [chatMessages, setChatMessages] = useState<AiChatMessage[]>(() => [
    {
      id: 'welcome-msg',
      sender: 'agent',
      text: `আসসালামু আলাইকুম ${profile.ownerName || 'খামারি ভাই'}! আমি আপনার 'সবুজ খামার এআই এজেন্ট'। আপনার খামারের বর্তমান পশুসংখ্যা, খাবারের স্টক এবং আয়-ব্যয়ের তথ্য আমি সার্বক্ষণিক পর্যবেক্ষণ করছি। যে কোনো পরামর্শের জন্য আমাকে জিজ্ঞেস করুন।`,
      timestamp: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
      suggestedActions: [
        'আজকের করণীয় তালিকা',
        'খাদ্য খরচ কমানোর উপায়',
        'পশুর রোগ প্রতিরোধ গাইড',
      ],
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Fetch proactive farm guidance
  const fetchProactiveGuidance = async () => {
    setIsLoadingGuidance(true);
    try {
      const payload = {
        farmProfile: profile,
        summary,
        animals: animals.map((a) => ({
          name: a.name,
          species: a.species,
          healthCondition: a.healthCondition,
          weightKg: a.weightKg,
        })),
        feedStocks: feedStocks.map((f) => ({
          name: f.name,
          category: f.category,
          currentStock: f.currentStock,
          unit: f.unit,
          minStockAlert: f.minStockAlert,
        })),
        transactions: transactions.slice(0, 10).map((t) => ({
          type: t.type,
          title: t.title,
          amount: t.amount,
        })),
        sales: sales.slice(0, 10).map((s) => ({
          itemName: s.itemName,
          totalAmount: s.totalAmount,
          dueAmount: s.dueAmount,
        })),
      };

      const res = await fetch('/api/ai/proactive-guidance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('পরামর্শ লোড করা সম্ভব হয়নি');
      }

      const data: FarmAiGuidance = await res.json();
      setGuidance(data);
    } catch (err: any) {
      console.warn('Guidance fetch error:', err);
      // Fallback local assessment
      setGuidance({
        headline: 'খামারের সার্বিক ব্যবস্থাপনা স্থিতিশীল রাখতে নিয়মিত তদারকি নিশ্চিত করুন',
        healthAssessment: `মোট পশু ${animals.length} টি। নিয়মিত স্বাস্থ্য পরীক্ষা ও ভ্যাকসিন শিডিউল মেনে চলুন।`,
        feedAssessment: `মোট খাবার আইটেম ${feedStocks.length} টি। দানাদার খাদ্যের পাশাপাশি পর্যাপ্ত কাঁচা ঘাস সরবরাহ করুন।`,
        financeAssessment: `বর্তমান বিক্রয় বকেয়া ৳${summary.totalSalesDue.toLocaleString('bn-BD')}। দ্রুত বকেয়া পরিশোধে তাগাদা দিন।`,
        topRecommendations: [
          'অসুস্থ ও চিকিৎসাধীন পশুর প্রতি বিশেষ যত্ন নিন এবং আলাদা রাখুন।',
          'খাবারের স্টক পর্যবেক্ষণ করুন যাতে ঘাটতি না পড়ে।',
          'বকেয়া টাকা আদায়ে গ্রাহকদের সাথে নিয়মিত যোগাযোগ বজায় রাখুন।',
        ],
      });
    } finally {
      setIsLoadingGuidance(false);
    }
  };

  useEffect(() => {
    fetchProactiveGuidance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isSendingMessage]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isSendingMessage) return;

    const userMsg: AiChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsSendingMessage(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: chatMessages.slice(-6),
          farmContext: {
            farmName: profile.farmName,
            totalAnimals: animals.length,
            sickAnimals: summary.careNeededAnimals,
            lowStockFeeds: summary.lowStockCount,
            totalSalesDue: summary.totalSalesDue,
            netBalance: summary.netBalance,
          },
        }),
      });

      if (!res.ok) {
        throw new Error('এআই সার্ভারে সাড়া পাওয়া যায়নি');
      }

      const data = await res.json();
      const agentMsg: AiChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'agent',
        text: data.reply || 'আপনার প্রশ্নের উত্তর তৈরি করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।',
        timestamp: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: data.suggestedActions,
      };

      setChatMessages((prev) => [...prev, agentMsg]);
    } catch (err: any) {
      console.warn('Chat error:', err);
      const fallbackMsg: AiChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'agent',
        text: 'বর্তমানে নেটওয়ার্কে সাময়িক সমস্যা হচ্ছে। তবে আপনার খামারের সকল তথ্য সুরক্ষিত আছে। পশুদের নিয়মিত পুষ্টিকর খাদ্য ও বিশুদ্ধ পানি নিশ্চিত করুন।',
        timestamp: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const toggleTask = (index: number) => {
    const isNowDone = !completedTasks[index];
    setCompletedTasks((prev) => ({ ...prev, [index]: isNowDone }));
    if (isNowDone) {
      showToast('করণীয় সম্পন্ন হিসেবে চিহ্নিত করা হয়েছে', 'success');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0D1812] via-[#102219] to-[#0A140E] border border-emerald-500/25 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white flex items-center justify-center shadow-lg shadow-emerald-950/40 shrink-0">
              <Bot className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#EFF5F1]">
                  খামার পরামর্শক এআই এজেন্ট
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  সার্বক্ষণিক সক্রিয়
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#9CB0A4]">
                আপনার খামারের লাইভ ডাটা পর্যবেক্ষণ করে স্বয়ংক্রিয় বুদ্ধিমান বিশ্লেষণ ও তাৎক্ষণিক বাস্তবসম্মত গাইডলাইন।
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchProactiveGuidance}
            disabled={isLoadingGuidance}
            className="min-h-[40px] px-4 py-2 bg-[#14261D] hover:bg-[#1A3327] border border-emerald-500/30 text-emerald-300 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingGuidance ? 'animate-spin' : ''}`} />
            <span>{isLoadingGuidance ? 'বিশ্লেষণ হচ্ছে...' : 'নতুন অডিট তৈরি করুন'}</span>
          </button>
        </div>

        {/* Live Context Strip */}
        <div className="mt-5 pt-4 border-t border-[#1C2F24] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-[#0A120E]/70 border border-[#16261E] rounded-xl p-2.5">
            <span className="text-[11px] text-[#7A9386] block">মোট পশু সংখ্যা</span>
            <span className="text-base font-bold text-[#EFF5F1]">{animals.length} টি</span>
          </div>
          <div className="bg-[#0A120E]/70 border border-[#16261E] rounded-xl p-2.5">
            <span className="text-[11px] text-[#7A9386] block">চিকিৎসাধীন / পর্যবেক্ষণ</span>
            <span className="text-base font-bold text-amber-400">{summary.careNeededAnimals} টি</span>
          </div>
          <div className="bg-[#0A120E]/70 border border-[#16261E] rounded-xl p-2.5">
            <span className="text-[11px] text-[#7A9386] block">কম স্টকের খাবার</span>
            <span className="text-base font-bold text-rose-400">{summary.lowStockCount} টি</span>
          </div>
          <div className="bg-[#0A120E]/70 border border-[#16261E] rounded-xl p-2.5">
            <span className="text-[11px] text-[#7A9386] block">মোট বিক্রয় বকেয়া</span>
            <span className="text-base font-bold text-amber-300">৳{summary.totalSalesDue.toLocaleString('bn-BD')}</span>
          </div>
        </div>
      </div>

      {/* Proactive Guidance Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h2 className="text-base font-bold text-[#EFF5F1]">আজকের খামার স্বয়ংক্রিয় অডিট ও মূল্যায়ন</h2>
          </div>
          <span className="text-xs text-[#7B9487]">Gemini 3.8 Flash ইন্টেলিজেন্স</span>
        </div>

        {isLoadingGuidance ? (
          <div className="bg-[#0E1612] border border-[#1C2C23] rounded-2xl p-8 text-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mx-auto" />
            <p className="text-xs text-[#9BB1A4]">খামারের সকল পশু, খাদ্য ও আয়-ব্যয়ের হিসাব বিশ্লেষণ করা হচ্ছে...</p>
          </div>
        ) : guidance ? (
          <div className="space-y-4">
            {/* Headline Alert */}
            <div className="bg-[#101D17] border border-emerald-500/30 rounded-xl p-4 flex items-start gap-3">
              <Sparkle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">
                  প্রধান পর্যবেক্ষণ
                </span>
                <p className="text-sm font-medium text-[#EFF5F1] mt-0.5">{guidance.headline}</p>
              </div>
            </div>

            {/* 3 Pillar Assessment Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Health Pillar */}
              <div className="bg-[#0E1612] border border-[#1B2B22] rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-rose-400">
                  <HeartPulse className="w-4 h-4" />
                  <h3 className="text-xs font-bold text-[#EFF5F1]">পশু স্বাস্থ্য ও প্রজনন</h3>
                </div>
                <p className="text-xs text-[#9BB1A4] leading-relaxed">{guidance.healthAssessment}</p>
                {onNavigate && (
                  <button
                    type="button"
                    onClick={() => onNavigate(ActiveTab.ANIMALS)}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1 pt-1 cursor-pointer"
                  >
                    <span>পশুর তালিকা দেখুন</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Feed Pillar */}
              <div className="bg-[#0E1612] border border-[#1B2B22] rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-amber-400">
                  <Wheat className="w-4 h-4" />
                  <h3 className="text-xs font-bold text-[#EFF5F1]">খাদ্য পুষ্টি ও মজুদ</h3>
                </div>
                <p className="text-xs text-[#9BB1A4] leading-relaxed">{guidance.feedAssessment}</p>
                {onNavigate && (
                  <button
                    type="button"
                    onClick={() => onNavigate(ActiveTab.FEED_STOCK)}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1 pt-1 cursor-pointer"
                  >
                    <span>খাবারের স্টক চেক করুন</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Finance Pillar */}
              <div className="bg-[#0E1612] border border-[#1B2B22] rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400">
                  <TrendingUp className="w-4 h-4" />
                  <h3 className="text-xs font-bold text-[#EFF5F1]">আর্থিক ও বকেয়া ব্যবস্থাপনা</h3>
                </div>
                <p className="text-xs text-[#9BB1A4] leading-relaxed">{guidance.financeAssessment}</p>
                {onNavigate && (
                  <button
                    type="button"
                    onClick={() => onNavigate(ActiveTab.SALES)}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1 pt-1 cursor-pointer"
                  >
                    <span>বিক্রয় ও বকেয়া তালিকা</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Daily Priority Checklist */}
            <div className="bg-[#0D1511] border border-[#1B2921] rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-[#EFF5F1]">
                  আজকের শীর্ষ অগ্রাধিকার পদক্ষেপ (এআই অ্যাকশন প্ল্যান)
                </h3>
              </div>
              <div className="space-y-2">
                {guidance.topRecommendations?.map((rec, idx) => {
                  const isDone = Boolean(completedTasks[idx]);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleTask(idx)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${
                        isDone
                          ? 'bg-emerald-950/20 border-emerald-500/30 text-[#7F9588]'
                          : 'bg-[#111C16] border-[#1C2C23] hover:border-emerald-500/40 text-[#EFF5F1]'
                      }`}
                    >
                      <CheckCircle
                        className={`w-4 h-4 mt-0.5 shrink-0 transition-colors ${
                          isDone ? 'text-emerald-400' : 'text-[#485E53]'
                        }`}
                      />
                      <span className={`text-xs leading-relaxed flex-1 ${isDone ? 'line-through' : ''}`}>
                        {rec}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Interactive AI Chat Console */}
      <div className="bg-[#0C1310] border border-[#18261F] rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[560px]">
        {/* Chat Header */}
        <div className="px-5 py-3.5 bg-[#0F1813] border-b border-[#18261F] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-[#EFF5F1]">এআই এজেন্টের সাথে সরাসরি কথোপকথন</h2>
              <p className="text-[11px] text-[#789183]">পশুর রোগ, খাবার, চিকিৎসা বা হিসাব সংক্রান্ত প্রশ্ন করুন</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] text-emerald-400 font-medium">লাইভ গাইড</span>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4">
          {chatMessages.map((msg) => {
            const isAgent = msg.sender === 'agent';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${isAgent ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                    isAgent
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#1F3127] text-emerald-300 border border-[#2D4537]'
                  }`}
                >
                  {isAgent ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                <div className="space-y-1.5">
                  <div
                    className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      isAgent
                        ? 'bg-[#121B16] border border-[#1C2C23] text-[#EFF5F1]'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>

                  <span className="text-[10px] text-[#697F72] px-1 block">
                    {msg.timestamp}
                  </span>

                  {/* Suggested follow-up action pills */}
                  {isAgent && msg.suggestedActions && msg.suggestedActions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {msg.suggestedActions.map((action, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleSendMessage(action)}
                          className="px-2.5 py-1 rounded-lg text-[11px] bg-[#142019] hover:bg-[#1A2C22] border border-[#1F3327] text-emerald-300 hover:text-white transition-colors cursor-pointer"
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isSendingMessage && (
            <div className="flex gap-3 mr-auto max-w-[80%]">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-[#121B16] border border-[#1C2C23] p-3 rounded-2xl flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce delay-150" />
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce delay-300" />
                <span className="text-xs text-[#8BA193] ml-1">এজেন্ট চিন্তা করছে...</span>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Quick Suggestion Pills */}
        <div className="px-4 py-2 bg-[#0A100D] border-t border-[#16231C] overflow-x-auto flex items-center gap-2 scrollbar-none">
          <span className="text-[10px] text-[#637A6D] whitespace-nowrap shrink-0">দ্রুত প্রশ্ন:</span>
          {QUICK_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(prompt)}
              className="px-2.5 py-1 rounded-lg text-[11px] bg-[#101813] hover:bg-[#15231B] border border-[#1C2D23] text-[#9AB0A3] hover:text-emerald-300 whitespace-nowrap cursor-pointer transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3.5 bg-[#0D1511] border-t border-[#18261F]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="পশুর লক্ষণ, খাবারের ফর্মুলা বা বিক্রয়ের বিষয়ে লিখুন..."
              className="flex-1 bg-[#121A15] border border-[#1F2E26] focus:border-emerald-500 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#EFF5F1] placeholder-[#657B6F] focus:outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isSendingMessage}
              className="min-h-[42px] px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-[#15241C] disabled:text-[#4F6357] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">পাঠান</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
