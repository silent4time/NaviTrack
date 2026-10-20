import React, { useState } from 'react';
import {
  X,
  Code2,
  Copy,
  Check,
  Globe,
  Link,
  ShieldCheck,
  ShoppingBag,
  Terminal,
  Zap,
} from 'lucide-react';

interface WordPressPluginGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WordPressPluginGuideModal: React.FC<WordPressPluginGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [testImei, setTestImei] = useState('862908041539201');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  if (!isOpen) return null;

  const WORDPRESS_PHP_CODE = `<?php
/**
 * Plugin Name: NaviTrack License & Hardware Sync for WooCommerce
 * Description: افزونه اتصال ووکامرس به سامانه ردیابی آنلاین ناویار جهت فعال‌سازی لایسنس سخت‌افزار با کد IMEI
 * Version: 1.0.0
 * Author: NaviTrack Team
 */

if (!defined('ABSPATH')) exit;

// ۱. افزودن فیلد دریافت کد IMEI ردیاب در صفحه تسویه حساب (Checkout)
add_filter('woocommerce_checkout_fields', 'navitrack_add_imei_checkout_field');
function navitrack_add_imei_checkout_field($fields) {
    $fields['billing']['billing_tracker_imei'] = array(
        'type'        => 'text',
        'label'       => __('کد ۱۵ رقمی IMEI ردیاب', 'navitrack'),
        'placeholder' => 'مثال: 862908041539201',
        'required'    => true,
        'class'       => array('form-row-wide'),
        'clear'       => true
    );
    return $fields;
}

// ۲. اعتبارسنجی کد ۱۵ رقمی IMEI در صفحه پرداخت
add_action('woocommerce_checkout_process', 'navitrack_validate_imei_field');
function navitrack_validate_imei_field() {
    if (isset($_POST['billing_tracker_imei'])) {
        $imei = preg_replace('/\\D/', '', $_POST['billing_tracker_imei']);
        if (strlen($imei) !== 15) {
            wc_add_notice(__('کد IMEI سخت‌افزار ردیاب باید دقیقاً ۱۵ رقم عددی باشد.', 'navitrack'), 'error');
        }
    }
}

// ۳. ذخیره کد IMEI در متادیتاهای سفارش
add_action('woocommerce_checkout_update_order_meta', 'navitrack_save_imei_order_meta');
function navitrack_save_imei_order_meta($order_id) {
    if (!empty($_POST['billing_tracker_imei'])) {
        update_post_meta($order_id, '_billing_tracker_imei', sanitize_text_field($_POST['billing_tracker_imei']));
    }
}

// ۴. وب‌هوک فعال‌سازی آنی لایسنس پس از پرداخت موفق در درگاه شتابی
add_action('woocommerce_payment_complete', 'navitrack_activate_license_on_payment');
function navitrack_activate_license_on_payment($order_id) {
    $order = wc_get_order($order_id);
    $imei = get_post_meta($order_id, '_billing_tracker_imei', true);
    
    if (empty($imei)) return;

    $api_url = 'https://app.navitrack.ir/api/wordpress/license/activate'; // آدرس سامانه ردیاب شما
    
    $payload = array(
        'imei'          => $imei,
        'orderId'       => $order_id,
        'planMonths'    => 12, // مدت اشتراک بر اساس محصول خریداری شده
        'customerEmail' => $order->get_billing_email(),
    );

    $response = wp_remote_post($api_url, array(
        'method'    => 'POST',
        'headers'   => array('Content-Type' => 'application/json'),
        'body'      => json_encode($payload),
        'timeout'   => 15,
    ));

    if (!is_wp_error($response)) {
        $body = json_decode(wp_remote_retrieve_body($response), true);
        if (!empty($body['licenseKey'])) {
            // ثبت کد لایسنس صادر شده در یادداشت‌های سفارش
            $order->add_order_note('لایسنس ناویار فعال شد: ' . $body['licenseKey']);
        }
    }
}
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(WORDPRESS_PHP_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestApi = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`/api/wordpress/license/verify?imei=${testImei}`);
      const data = await res.json();
      setTestResult(JSON.stringify(data, null, 2));
    } catch {
      setTestResult('خطا در ارتباط با سرور');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[650] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">معماری و کد افزونه وردپرس (WordPress / WooCommerce)</h3>
              <p className="text-xs text-slate-400 mt-0.5">اتصال سایت وردپرسی فروشگاه به نرم‌افزار ناویار بر اساس کد IMEI</p>
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
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Architecture Concept */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
            <span className="font-bold text-amber-300">مراحل عملکرد مطابق طرح شما:</span>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-300 text-[11px] leading-relaxed">
              <li>مشتری در سایت وردپرس شما وارد برگه خرید لایسنس می‌شود و بسته (مثلاً ۱ ساله) را به سبد خرید اضافه می‌کند.</li>
              <li>در صفحه پرداخت (Checkout)، فیلد اجباری **«کد ۱۵ رقمی IMEI ردیاب»** از او دریافت می‌شود.</li>
              <li>پس از پرداخت موفق از طریق درگاه بانکی شتاب، افزونه وردپرس وب‌هوک <code className="bg-slate-900 px-1 py-0.5 rounded font-mono text-cyan-300">/api/wordpress/license/activate</code> را با شماره IMEI فراخوانی می‌کند.</li>
              <li>نرم‌افزار ناویار بلافاصله لایسنس ردیاب سخت‌افزاری را تمدید کرده و آن را روی نقشه مجاز و آنلاین نگه می‌دارد.</li>
            </ol>
          </div>

          {/* Quick API Tester */}
          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 space-y-2">
            <span className="font-bold text-slate-200">تست اتصال و وب‌سرویس REST API وردپرس:</span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={testImei}
                onChange={(e) => setTestImei(e.target.value)}
                placeholder="کد IMEI برای تست..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono dir-ltr"
              />
              <button
                onClick={handleTestApi}
                disabled={isTesting}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold cursor-pointer transition-colors"
              >
                {isTesting ? 'در حال استعلام...' : 'استعلام وضعیت با API'}
              </button>
            </div>
            {testResult && (
              <pre className="bg-black/60 p-2.5 rounded-xl font-mono text-[10px] text-emerald-400 dir-ltr overflow-x-auto">
                {testResult}
              </pre>
            )}
          </div>

          {/* Copyable PHP Code */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-cyan-400" />
                <span>کد آماده افزونه وردپرس (<span className="font-mono text-cyan-300">navitrack-license-sync.php</span>):</span>
              </span>
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'کپی شد!' : 'کپی کامل کد PHP افزونه'}</span>
              </button>
            </div>

            <div className="relative">
              <pre className="bg-slate-950 p-4 rounded-2xl border border-slate-800 font-mono text-[11px] text-slate-300 dir-ltr max-h-72 overflow-y-auto leading-relaxed select-all">
                {WORDPRESS_PHP_CODE}
              </pre>
            </div>
            <p className="text-[11px] text-slate-400">
              * این فایل را در مسیر <code className="bg-slate-950 px-1 py-0.5 rounded font-mono text-cyan-300">wp-content/plugins/navitrack-sync/</code> قرار داده و از منوی افزونه‌های وردپرس فعال نمایید.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
