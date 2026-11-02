import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: unknown): State {
    let readable = 'অপ্রত্যাশিত একটি ত্রুটি ঘটেছে।';
    if (error instanceof Error) {
      try {
        const parsed = JSON.parse(error.message) as { error?: string };
        if (parsed && parsed.error) {
          if (parsed.error.includes('Quota exceeded')) {
            readable = 'আজকের ফ্রি ক্লাউড ডাটাবেস কোটা পূর্ণ হয়েছে। আগামীকাল পুনরায় কোটা রিসেট হবে।';
          } else if (parsed.error.includes('Missing or insufficient permissions')) {
            readable = 'নিরাপত্তা নীতিমালার কারণে এই কাজটি অনুমোদিত হয়নি। আপনার অ্যাকাউন্ট ইমেইল ভেরিফাইড কি না যাচাই করুন।';
          } else {
            readable = parsed.error;
          }
        } else {
          readable = error.message;
        }
      } catch {
        readable = error.message;
      }
    }
    return { hasError: true, message: readable };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#090D0B] text-[#EFF5F1] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#101814] border border-[#1E2E26] rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h1 className="text-lg font-semibold">সিস্টেম বার্তা</h1>
            </div>
            <p className="text-sm text-[#A9BCB0] leading-relaxed">{this.state.message}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full min-h-[44px] px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <RotateCcw className="w-4 h-4 shrink-0" />
              <span>পেইজটি পুনরায় লোড করুন</span>
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
