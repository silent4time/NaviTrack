import React, { useState } from 'react';
import { LICENSE_PACKAGES, generateLicenseKey, StorageService } from '../services/storage';
import { LicensePackage, Device } from '../types/tracker';
import confetti from 'canvas-confetti';
import {
  X,
  KeyRound,
  Check,
  ShieldCheck,
  Zap,
  CreditCard,
  Copy,
  Sparkles,
  ArrowRight,
  Clock,
  Car,
} from 'lucide-react';

interface LicenseStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  devices: Device[];
  onLicenseActivated: () => void;
}

export const LicenseStoreModal: React.FC<LicenseStoreModalProps> = ({
  isOpen,
  onClose,
  devices,
  onLicenseActivated,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<LicensePackage>(LICENSE_PACKAGES[2]); // 6-month default
  const [checkoutStep, setCheckoutStep] = useState<'select' | 'payment' | 'success'>('select');
  const [targetImei, setTargetImei] = useState<string>(devices[0]?.imei || '');
  const [generatedKey, setGeneratedKey] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleStartPayment = (pkg: LicensePackage) => {
    setSelectedPlan(pkg);
    setCheckoutStep('payment');
  };

  const handleExecutePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      const newKey = generateLicenseKey('NVTRK');
      setGeneratedKey(newKey);

      // Save to stored licenses
      StorageService.createLicense({
        key: newKey,
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        durationMonths: selectedPlan.durationMonths,
        createdAt: new Date().toISOString(),
        isUsed: false,
        notes: `خریداری شده آنلاین - بسته ${selectedPlan.name}`,
      });

      // If user selected an IMEI to auto-activate right now
      if (targetImei) {
        StorageService.activateLicenseForDevice(targetImei, newKey);
        onLicenseActivated();
      }

      setCheckoutStep('success');

      // Trigger Confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}
    }, 1200);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetModal = () => {
    setCheckoutStep('select');
    setGeneratedKey('');
    setCopied(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[650] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">فروشگاه لایسنس و اشتراک ردیاب آنلاین</h3>
              <p className="text-xs text-slate-400 mt-0.5">انتخاب و خرید آنی کدهای فعال‌سازی برای دستگاه‌های ناوگان</p>
            </div>
          </div>
          <button
            onClick={resetModal}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1">
          {checkoutStep === 'select' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-300 bg-slate-950/50 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
                <span>دستگاه مورد نظر برای فعال‌سازی خودکار:</span>
                <select
                  value={targetImei}
                  onChange={(e) => setTargetImei(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-xs text-cyan-300 font-medium focus:outline-none"
                >
                  <option value="">بدون انتصاب (فقط دریافت کد لایسنس خام)</option>
                  {devices.map((d) => (
                    <option key={d.id} value={d.imei}>
                      {d.name} ({d.imei})
                    </option>
                  ))}
                </select>
              </div>

              {/* Grid of Packages */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {LICENSE_PACKAGES.map((pkg) => {
                  const isSelected = selectedPlan.id === pkg.id;
                  return (
                    <div
                      key={pkg.id}
                      onClick={() => setSelectedPlan(pkg)}
                      className={`relative rounded-2xl p-4 border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-gradient-to-b from-slate-800 to-slate-850 border-amber-500/80 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/50'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                      }`}
                    >
                      {pkg.badge && (
                        <div className="absolute top-3 left-3 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow">
                          {pkg.badge}
                        </div>
                      )}

                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                          {pkg.name}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                          {pkg.description}
                        </p>

                        <div className="my-3 py-2 border-y border-slate-800 flex items-baseline justify-between">
                          <span className="text-xs text-slate-400">مبلغ اشتراک:</span>
                          <div className="flex items-baseline gap-1.5">
                            {pkg.originalPriceToman && (
                              <span className="text-xs line-through text-slate-500">
                                {pkg.originalPriceToman.toLocaleString('fa-IR')}
                              </span>
                            )}
                            <span className="text-base font-black text-amber-400">
                              {pkg.priceToman.toLocaleString('fa-IR')}
                            </span>
                            <span className="text-[10px] text-slate-400">تومان</span>
                          </div>
                        </div>

                        <ul className="space-y-1.5 text-[11px] text-slate-300">
                          {pkg.features.map((feat, idx) => (
                            <li key={idx} className="flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartPayment(pkg);
                        }}
                        className={`mt-4 w-full py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                          isSelected
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                        }`}
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>انتخاب و پرداخت آنلاین</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {checkoutStep === 'payment' && (
            <div className="space-y-5 max-w-md mx-auto py-2">
              <div className="text-center">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mb-3">
                  <CreditCard className="w-7 h-7" />
                </div>
                <h4 className="text-base font-bold text-white">تأیید پیش‌فاکتور و اتصال به درگاه بانکی</h4>
                <p className="text-xs text-slate-400 mt-1">شبیه‌ساز پرداخت شاپرک با صدور آنی کد لایسنس</p>
              </div>

              {/* Invoice Summary */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>بسته انتخابی:</span>
                  <span className="font-bold text-white">{selectedPlan.name}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>مدت اعتبار:</span>
                  <span className="text-white">{selectedPlan.durationMonths} ماه کامل</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>دستگاه هدف:</span>
                  <span className="text-cyan-400 font-mono">
                    {targetImei ? `${targetImei}` : 'دریافت کد لایسنس خام (فعال‌سازی دستی)'}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
                  <span className="font-semibold text-slate-300">مبلغ نهایی قابل پرداخت:</span>
                  <span className="text-lg font-black text-amber-400">
                    {selectedPlan.priceToman.toLocaleString('fa-IR')} تومان
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCheckoutStep('select')}
                  className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  بازگشت
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleExecutePayment}
                  className="flex-1 py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <span>در حال اتصال به بانک...</span>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>پرداخت موفق آزمایشی</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {checkoutStep === 'success' && (
            <div className="space-y-5 text-center py-4 max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-500/20 border-2 border-emerald-500/50 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Sparkles className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-lg font-black text-white">پرداخت با موفقیت انجام شد!</h4>
                <p className="text-xs text-slate-400 mt-1">
                  کد لایسنس اختصاصی شما صادر گردید و در حافظه سیستم ثبت شد.
                </p>
              </div>

              {/* License Code Display Box */}
              <div className="bg-slate-950 p-4 rounded-2xl border-2 border-dashed border-cyan-500/50 space-y-2">
                <span className="text-[11px] text-slate-400">کد فعال‌سازی اختصاصی (License Key):</span>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg md:text-xl font-mono font-black text-cyan-300 tracking-widest selection:bg-cyan-400">
                    {generatedKey}
                  </span>
                  <button
                    onClick={handleCopy}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg cursor-pointer transition-colors"
                    title="کپی در حافظه"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                {copied && <p className="text-[10px] text-emerald-400">کد لایسنس کپی شد!</p>}
              </div>

              {targetImei ? (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300">
                  ✓ لایسنس بلافاصله برای دستگاه با شناسه <span className="font-mono">{targetImei}</span> فعال و تمدید شد.
                </div>
              ) : (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300">
                  می‌توانید این کد را هر زمان از بخش «فعال‌سازی لایسنس» روی هر کد IMEI اعمال کنید.
                </div>
              )}

              <button
                onClick={resetModal}
                className="w-full py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-cyan-600/30 cursor-pointer"
              >
                تکمیل و بازگشت به سامانه
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
