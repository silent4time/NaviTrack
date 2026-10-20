import React, { useState } from 'react';
import { StorageService } from '../services/storage';
import { AuthSession } from '../types/auth';
import { Language, translations } from '../services/i18n';
import {
  Navigation,
  KeyRound,
  User,
  Smartphone,
  Lock,
  Globe,
  Shield,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (session: AuthSession) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  language,
  onLanguageChange,
}) => {
  const t = translations[language];
  const [activeTab, setActiveTab] = useState<'account' | 'imei'>('account');
  const [username, setUsername] = useState('user');
  const [password, setPassword] = useState('123456');
  const [imei, setImei] = useState('862908041539201');
  const [errorMsg, setErrorMsg] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (activeTab === 'account') {
      const result = StorageService.authenticateByAccount(username, password);
      if (!result.success) {
        setErrorMsg(result.message || t.loginError);
      } else if (result.session) {
        onLoginSuccess(result.session);
      }
    } else {
      const result = StorageService.authenticateByImei(imei, password);
      if (!result.success) {
        setErrorMsg(result.message || t.imeiNotFoundError);
      } else if (result.session) {
        onLoginSuccess(result.session);
      }
    }
  };

  const handleQuickDemoClient = () => {
    const result = StorageService.authenticateByAccount('user', '123456');
    if (result.session) onLoginSuccess(result.session);
  };

  const handleQuickDemoDistributor = () => {
    const result = StorageService.authenticateByAccount('dealer', '123456');
    if (result.session) onLoginSuccess(result.session);
  };

  return (
    <div
      className="min-h-screen w-screen bg-slate-950 flex flex-col justify-between select-none relative overflow-hidden font-['Vazirmatn',sans-serif]"
      dir={language === 'fa' ? 'rtl' : 'ltr'}
    >
      {/* Background Decorative Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.15),rgba(255,255,255,0))] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-600 flex items-center justify-center text-white shadow-md shadow-cyan-600/30">
            <Navigation className="w-4 h-4 -rotate-45" />
          </div>
          <div>
            <h1 className="font-mono font-black text-white text-base tracking-wider">
              PROTRACK<span className="text-cyan-400 font-sans text-xs mr-1 font-bold">ناویار</span>
            </h1>
          </div>
        </div>

        {/* Language Switcher */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs font-semibold">
          <button
            onClick={() => onLanguageChange('fa')}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
              language === 'fa' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            فارسی
          </button>
          <button
            onClick={() => onLanguageChange('en')}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
              language === 'en' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            English
          </button>
        </div>
      </header>

      {/* Login Card Body */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95">
          {/* Protrack-style Tab Switcher */}
          <div className="grid grid-cols-2 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setActiveTab('account');
                setErrorMsg('');
              }}
              className={`py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'account'
                  ? 'bg-slate-800 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-4 h-4" />
              <span>{t.byAccount}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('imei');
                setErrorMsg('');
              }}
              className={`py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'imei'
                  ? 'bg-slate-800 text-cyan-300 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>{t.byImei}</span>
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {activeTab === 'account' ? (
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  {t.usernameOrEmail}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="user / dealer / fleet"
                    required
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pr-10 pl-3 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  {t.imeiNumber}
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
                  <input
                    type="text"
                    value={imei}
                    onChange={(e) => setImei(e.target.value.replace(/\D/g, ''))}
                    placeholder="862908041539201"
                    maxLength={15}
                    required
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pr-10 pl-3 py-2.5 text-cyan-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono tracking-widest text-sm"
                    dir="ltr"
                  />
                </div>
              </div>
            )}

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-slate-300 font-semibold">{t.password}</label>
                <span className="text-[10px] text-slate-500 font-mono">(پیش‌فرض: 123456)</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="******"
                  required
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pr-10 pl-3 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded accent-cyan-500"
                />
                <span>{t.rememberMe}</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-bold shadow-lg shadow-cyan-600/30 cursor-pointer transition-all flex items-center justify-center gap-2 text-sm"
            >
              <span>{t.loginBtn}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          </form>

          {/* Quick Demo Login Triggers for Instant Testing */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <span className="block text-[11px] text-slate-400 text-center font-medium">
              دسترسی سریع و مشاهده آنی نقشه:
            </span>
            <button
              type="button"
              onClick={handleQuickDemoDistributor}
              className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
            >
              <Navigation className="w-4 h-4 -rotate-45" />
              <span>مشاهده مستقیم نقشه زنده مانیتورینگ (دمو کامل)</span>
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
              <button
                type="button"
                onClick={handleQuickDemoClient}
                className="py-2 px-3 bg-slate-800 hover:bg-slate-750 text-cyan-300 border border-cyan-500/30 rounded-xl font-bold cursor-pointer transition-colors flex items-center justify-center gap-1.5"
              >
                <User className="w-3.5 h-3.5 text-cyan-400" />
                <span>{t.demoClientBtn}</span>
              </button>

              <button
                type="button"
                onClick={handleQuickDemoDistributor}
                className="py-2 px-3 bg-slate-800 hover:bg-slate-750 text-amber-300 border border-amber-500/30 rounded-xl font-bold cursor-pointer transition-colors flex items-center justify-center gap-1.5"
              >
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>{t.demoDealerBtn}</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-3 text-center text-[11px] text-slate-500 border-t border-slate-900">
        <span>© Protrack / NaviTrack Fleet Platform 2026. All rights reserved.</span>
      </footer>
    </div>
  );
};
