import React, { useState } from 'react';
import { Trash2, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title: string;
  itemLabel: string;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  title,
  itemLabel,
  onCancel,
  onConfirm,
}) => {
  const [busy, setBusy] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
      onCancel();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
    >
      <div className="w-full max-w-md bg-[#101814] border border-[#1E2E26] rounded-2xl p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 id="delete-modal-title" className="text-lg font-semibold text-[#EFF5F1]">
              {title}
            </h2>
            <p className="text-sm text-[#9FB3A7] leading-relaxed">
              আপনি কি নিশ্চিতভাবে <strong className="text-[#EFF5F1] font-semibold">"{itemLabel}"</strong> মুছে ফেলতে চান? মুছে ফেলার পর এই তথ্যটি আর ফিরিয়ে আনা যাবে না।
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="বাতিল ও বন্ধ করুন"
            className="min-w-[44px] min-h-[44px] -mt-1 -mr-2 flex items-center justify-center text-[#8CA295] hover:text-[#EFF5F1] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="min-h-[44px] px-4 py-2 text-sm font-medium text-[#C8D8CE] bg-[#16221C] hover:bg-[#1E2E26] border border-[#24382E] rounded-xl transition-colors whitespace-nowrap shrink-0"
          >
            না, থাকুক
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy}
            className="min-h-[44px] px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-500 rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 disabled:opacity-60"
          >
            <Trash2 className="w-4 h-4 shrink-0" />
            <span>{busy ? 'মুছে ফেলা হচ্ছে...' : 'হ্যাঁ, মুছে ফেলুন'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
