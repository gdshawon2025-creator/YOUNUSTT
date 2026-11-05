import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  X,
  Send,
  Sparkles,
  ChevronUp,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';
import { useFarm } from '../context/FarmContext';
import { ActiveTab, AiChatMessage } from '../types/farm';

interface FloatingAiAssistantProps {
  onNavigateToAiAdvisor: () => void;
}

export const FloatingAiAssistant: React.FC<FloatingAiAssistantProps> = ({
  onNavigateToAiAdvisor,
}) => {
  const { summary, animals, feedStocks, profile } = useFarm();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Derive proactive alerts to guide the user in real time
  const alertsCount = summary.careNeededAnimals + summary.lowStockCount + (summary.totalSalesDue > 0 ? 1 : 0);

  useEffect(() => {
    // Generate context-aware initial greeting
    let greeting = `আসসালামু আলাইকুম ${profile.ownerName || 'খামারি ভাই'}! আমি আপনার খামারের সার্বক্ষণিক এআই গাইড। `;
    if (summary.careNeededAnimals > 0) {
      greeting += `সতর্কতা: বর্তমানে ${summary.careNeededAnimals} টি পশুর বিশেষ নজরদারি বা চিকিৎসা চলছে। `;
    }
    if (summary.lowStockCount > 0) {
      greeting += `পাশাপাশি ${summary.lowStockCount} টি খাবারের স্টক কমে এসেছে। `;
    }
    if (summary.careNeededAnimals === 0 && summary.lowStockCount === 0) {
      greeting += `আপনার খামারের সকল পশুর স্বাস্থ্য ও খাদ্য মজুদ বর্তমানে স্বাভাবিক রয়েছে। `;
    }
    greeting += `যেকোনো বিষয়ে প্রশ্ন করুন, আমি সাহায্য করব।`;

    setMessages([
      {
        id: 'floating-init',
        sender: 'agent',
        text: greeting,
        timestamp: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, [summary.careNeededAnimals, summary.lowStockCount, profile.ownerName]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (customPrompt?: string) => {
    const text = (customPrompt || input).trim();
    if (!text || isTyping) return;

    const userMsg: AiChatMessage = {
      id: `f-user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-4),
          farmContext: {
            farmName: profile.farmName,
            totalAnimals: animals.length,
            sickAnimals: summary.careNeededAnimals,
            lowStockFeeds: summary.lowStockCount,
            totalSalesDue: summary.totalSalesDue,
          },
        }),
      });

      if (!res.ok) throw new Error('Network error');

      const data = await res.json();
      const agentMsg: AiChatMessage = {
        id: `f-agent-${Date.now()}`,
        sender: 'agent',
        text: data.reply || 'আপনার অনুরোধ বিশ্লেষণ করা হয়েছে। খামারের নিয়মিত পরিচালনা বজায় রাখুন।',
        timestamp: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, agentMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `f-agent-${Date.now()}`,
          sender: 'agent',
          text: 'পশুর নিয়মিত পরিচর্যা ও খাদ্যের সঠিক অনুপাত বজায় রাখুন। জরুরি ক্ষেত্রে স্থানীয় পশু চিকিৎসকের পরামর্শ নিন।',
          timestamp: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Pill */}
      {!isOpen && (
        <aside aria-label="এআই খামার গাইড উইজেট" className="fixed bottom-20 lg:bottom-6 right-4 lg:right-8 z-40">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-2.5 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-full shadow-2xl border border-emerald-400/40 cursor-pointer transition-all hover:scale-105 active:scale-95"
            aria-label="এআই খামার গাইড খুলুন"
          >
            <div className="relative">
              <Bot className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-300 rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full" />
            </div>

            <span className="text-xs font-bold tracking-wide">এআই গাইড</span>

            {alertsCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-black">
                {alertsCount}
              </span>
            )}
          </button>
        </aside>
      )}

      {/* Expanded Quick Chat & Guidance Drawer */}
      {isOpen && (
        <aside
          aria-label="এআই খামার গাইড ডিরেক্টর"
          className="fixed bottom-20 lg:bottom-6 right-4 lg:right-8 z-40 w-[calc(100vw-2rem)] sm:w-[380px] h-[500px] bg-[#0E1712] border border-emerald-500/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          {/* Header */}
          <div className="px-4 py-3 bg-[#121F18] border-b border-[#1B3024] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#EFF5F1] flex items-center gap-1.5">
                  <span>সবুজ এআই গাইড</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </h3>
                <p className="text-[10px] text-[#789384]">সার্বক্ষণিক খামার উপদেষ্টা</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onNavigateToAiAdvisor();
                }}
                className="p-1.5 text-[#88A393] hover:text-emerald-400 rounded-lg hover:bg-[#182B21] transition-colors cursor-pointer"
                title="পূর্ণ এআই ড্যাশবোর্ড খুলুন"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-[#88A393] hover:text-white rounded-lg hover:bg-[#182B21] transition-colors cursor-pointer"
                title="বন্ধ করুন"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Context Bar */}
          {alertsCount > 0 && (
            <div className="px-3.5 py-1.5 bg-[#17251B] border-b border-[#1F3325] text-[11px] text-[#CFDFD6] flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-amber-400">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {summary.careNeededAnimals > 0 ? `${summary.careNeededAnimals} টি পশুর বিশেষ যত্ন` : ''}
                  {summary.careNeededAnimals > 0 && summary.lowStockCount > 0 ? ' ও ' : ''}
                  {summary.lowStockCount > 0 ? `${summary.lowStockCount} টি খাদ্যের স্টক কম` : ''}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleSend('আমার খামারের জরুরি সমস্যাগুলোর সমাধান কী?')}
                className="text-[10px] font-bold text-emerald-400 hover:underline cursor-pointer"
              >
                পরামর্শ নিন
              </button>
            </div>
          )}

          {/* Message List */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 text-xs">
            {messages.map((m) => {
              const isAgent = m.sender === 'agent';
              return (
                <div
                  key={m.id}
                  className={`p-3 rounded-xl leading-relaxed ${
                    isAgent
                      ? 'bg-[#14221A] border border-[#1E3326] text-[#EFF5F1]'
                      : 'bg-emerald-600 text-white ml-auto max-w-[85%]'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  <span className="text-[9px] text-[#71897C] block mt-1">
                    {m.timestamp}
                  </span>
                </div>
              );
            })}

            {isTyping && (
              <div className="bg-[#14221A] border border-[#1E3326] p-2.5 rounded-xl text-xs text-[#82998C] flex items-center gap-2">
                <Bot className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                <span>এআই পরামর্শ লিখছে...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Preset Prompts */}
          <div className="px-3 py-1.5 bg-[#0B130F] border-t border-[#17271E] flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => handleSend('আজকের করণীয়')}
              className="px-2 py-0.5 rounded text-[10px] bg-[#121F17] hover:bg-[#182B20] text-[#93AAA0] hover:text-emerald-300 whitespace-nowrap cursor-pointer"
            >
              আজকের করণীয়
            </button>
            <button
              type="button"
              onClick={() => handleSend('খাবার খরচ কমানো')}
              className="px-2 py-0.5 rounded text-[10px] bg-[#121F17] hover:bg-[#182B20] text-[#93AAA0] hover:text-emerald-300 whitespace-nowrap cursor-pointer"
            >
              খাবার খরচ কমানো
            </button>
            <button
              type="button"
              onClick={() => handleSend('বকেয়া আদায়ের টিপস')}
              className="px-2 py-0.5 rounded text-[10px] bg-[#121F17] hover:bg-[#182B20] text-[#93AAA0] hover:text-emerald-300 whitespace-nowrap cursor-pointer"
            >
              বকেয়া আদায়
            </button>
          </div>

          {/* Quick Input Bar */}
          <div className="p-2.5 bg-[#101B15] border-t border-[#192A20]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleSend();
              }}
              className="flex items-center gap-1.5"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="দ্রুত পরামর্শের জন্য লিখুন..."
                className="flex-1 bg-[#15231B] border border-[#1E3327] rounded-lg px-3 py-1.5 text-xs text-[#EFF5F1] placeholder-[#60796B] focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="p-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-lg transition-colors cursor-pointer shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </aside>
      )}
    </>
  );
};
