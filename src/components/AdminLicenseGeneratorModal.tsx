import React, { useState } from 'react';
import { StorageService, StoredLicenseRecord, generateLicenseKey } from '../services/storage';
import {
  X,
  Sliders,
  Plus,
  Copy,
  Check,
  Trash2,
  KeyRound,
  Download,
  Shield,
} from 'lucide-react';

interface AdminLicenseGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLicensesUpdated: () => void;
}

export const AdminLicenseGeneratorModal: React.FC<AdminLicenseGeneratorModalProps> = ({
  isOpen,
  onClose,
  onLicensesUpdated,
}) => {
  const [durationMonths, setDurationMonths] = useState<number>(12);
  const [batchCount, setBatchCount] = useState<number>(1);
  const [notes, setNotes] = useState<string>('صدور از پنل مدیریت ناوگان');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [filterState, setFilterState] = useState<'all' | 'unused' | 'used'>('all');

  if (!isOpen) return null;

  const licenses = StorageService.getLicenses();

  const handleGenerate = () => {
    for (let i = 0; i < batchCount; i++) {
      const key = generateLicenseKey('NVTRK');
      const planName =
        durationMonths === 12
          ? 'اشتراک ۱۲ ماهه طلایی'
          : durationMonths === 6
          ? 'اشتراک ۶ ماهه پیشرفته'
          : durationMonths === 3
          ? 'اشتراک ۳ ماهه اقتصادی'
          : `اشتراک ${durationMonths} ماهه`;

      const record: StoredLicenseRecord = {
        key,
        planId: `plan_${durationMonths}m`,
        planName,
        durationMonths,
        createdAt: new Date().toISOString(),
        isUsed: false,
        notes: notes.trim() || 'صدور مستقیم مدیر',
      };
      StorageService.createLicense(record);
    }
    onLicensesUpdated();
  };

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDelete = (key: string) => {
    const list = licenses.filter((l) => l.key !== key);
    StorageService.saveLicenses(list);
    onLicensesUpdated();
  };

  const filtered = licenses.filter((l) => {
    if (filterState === 'unused') return !l.isUsed;
    if (filterState === 'used') return l.isUsed;
    return true;
  });

  return (
    <div className="fixed inset-0 z-[650] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">پنل مدیریت و صدور کدهای لایسنس</h3>
              <p className="text-xs text-slate-400 mt-0.5">تولید تکی و دسته‌ای لایسنس برای نمایندگان و مشتریان</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* License Generator Form Box */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              <span>تولید کدهای لایسنس جدید</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">مدت اعتبار اشتراک</label>
                <select
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value={1}>۱ ماهه (آزمایشی)</option>
                  <option value={3}>۳ ماهه (اقتصادی)</option>
                  <option value={6}>۶ ماهه (پیشرفته)</option>
                  <option value={12}>۱۲ ماهه (طلایی ناوگان)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">تعداد کد (صدور دسته‌ای)</label>
                <select
                  value={batchCount}
                  onChange={(e) => setBatchCount(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value={1}>۱ عدد</option>
                  <option value={3}>۳ عدد</option>
                  <option value={5}>۵ عدد</option>
                  <option value={10}>۱۰ عدد</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">یادداشت / مشتری</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثال: قرارداد سالانه شرکت باربری"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleGenerate}
              className="w-full py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 cursor-pointer transition-all flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>تولید و ثبت آنی {batchCount} کد لایسنس جدید</span>
            </button>
          </div>

          {/* List of Issued Licenses */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-bold text-slate-300">
                تاریخچه لایسنس‌های صادر شده ({licenses.length})
              </h4>

              <div className="flex items-center gap-1.5 text-[11px]">
                <button
                  onClick={() => setFilterState('all')}
                  className={`px-2 py-0.5 rounded-lg ${
                    filterState === 'all' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400'
                  }`}
                >
                  همه ({licenses.length})
                </button>
                <button
                  onClick={() => setFilterState('unused')}
                  className={`px-2 py-0.5 rounded-lg ${
                    filterState === 'unused' ? 'bg-emerald-700 text-white font-bold' : 'text-slate-400'
                  }`}
                >
                  استفاده‌نشده ({licenses.filter((l) => !l.isUsed).length})
                </button>
                <button
                  onClick={() => setFilterState('used')}
                  className={`px-2 py-0.5 rounded-lg ${
                    filterState === 'used' ? 'bg-amber-700 text-white font-bold' : 'text-slate-400'
                  }`}
                >
                  فعال‌شده ({licenses.filter((l) => l.isUsed).length})
                </button>
              </div>
            </div>

            <div className="border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800 bg-slate-950/60 max-h-72 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  لایسنسی در این دسته‌بندی یافت نشد.
                </div>
              ) : (
                filtered.map((lic) => (
                  <div
                    key={lic.key}
                    className="p-3 flex items-center justify-between hover:bg-slate-900/60 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${
                          lic.isUsed ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        title={lic.isUsed ? 'مصرف شده' : 'آماده استفاده'}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-cyan-300 tracking-wider">
                            {lic.key}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                            {lic.planName}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {lic.isUsed ? (
                            <span className="text-amber-400">
                              فعال‌شده روی IMEI: {lic.usedByImei}
                            </span>
                          ) : (
                            <span className="text-slate-500">{lic.notes || 'بدون یادداشت'}</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleCopy(lic.key)}
                        title="کپی کد لایسنس"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                      >
                        {copiedKey === lic.key ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(lic.key)}
                        title="حذف"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-900/40 text-slate-400 hover:text-red-300 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
          >
            بستن پنل
          </button>
        </div>
      </div>
    </div>
  );
};
