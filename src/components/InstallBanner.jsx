import { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

const DISMISS_KEY = 'lulu-tokki-install-dismissed-at';
const DISMISS_FOR_MS = 7 * 24 * 60 * 60 * 1000;

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function isMobileDevice() {
  return window.matchMedia('(max-width: 768px)').matches || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function isIosDevice() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export default function InstallBanner() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [showManualHelp, setShowManualHelp] = useState(isIosDevice);
  const { isRTL, tr } = useLanguage();

  useEffect(() => {
    if (!isMobileDevice() || isStandalone()) return undefined;

    let dismissedAt = 0;
    try { dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0); } catch { /* Storage may be unavailable. */ }
    if (Date.now() - dismissedAt < DISMISS_FOR_MS) return undefined;

    const showTimer = window.setTimeout(() => setVisible(true), 1200);
    const capturePrompt = event => {
      event.preventDefault();
      setInstallPrompt(event);
      setVisible(true);
    };
    const installed = () => {
      setVisible(false);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', capturePrompt);
    window.addEventListener('appinstalled', installed);

    return () => {
      window.clearTimeout(showTimer);
      window.removeEventListener('beforeinstallprompt', capturePrompt);
      window.removeEventListener('appinstalled', installed);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) {
      setShowManualHelp(true);
      return;
    }

    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setVisible(false);
      setInstallPrompt(null);
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* Storage may be unavailable. */ }
  };

  if (!visible) return null;

  return (
    <aside
      role="dialog"
      aria-modal="false"
      aria-label={tr('تثبيت تطبيق Lulu Tokki', 'Install Lulu Tokki', 'התקנת Lulu Tokki')}
      style={{
        position: 'fixed', insetInline: 14, bottom: 'max(18px, env(safe-area-inset-bottom))', zIndex: 2000,
        maxWidth: 430, marginInline: 'auto', padding: 16, borderRadius: 22,
        background: 'linear-gradient(145deg, #fffdf9, #fff4f7)', color: 'var(--text)',
        border: '1px solid rgba(184,100,125,0.22)', boxShadow: '0 18px 55px rgba(78,42,55,0.24)',
        fontFamily: 'Cairo, sans-serif', direction: isRTL ? 'rtl' : 'ltr',
      }}
    >
      <button
        type="button"
        onClick={handleDismiss}
        aria-label={tr('إغلاق', 'Close', 'סגירה')}
        style={{ position: 'absolute', insetInlineEnd: 10, top: 10, width: 30, height: 30, border: 0, borderRadius: '50%', background: 'rgba(184,100,125,0.1)', color: 'var(--brand)', fontSize: 18, cursor: 'pointer' }}
      >×</button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingInlineEnd: 24 }}>
        <img src="/icon-192.png" alt="" width="62" height="62" style={{ borderRadius: 16, boxShadow: '0 6px 18px rgba(184,100,125,0.2)', flexShrink: 0 }} />
        <div>
          <div style={{ fontWeight: 900, fontSize: 16 }}>{tr('ثبّت Lulu Tokki على هاتفك', 'Install Lulu Tokki', 'התקינו את Lulu Tokki')}</div>
          <div style={{ color: 'var(--subtext)', fontSize: 12, lineHeight: 1.6, marginTop: 2 }}>
            {tr('وصول أسرع وتجربة مريحة من الشاشة الرئيسية', 'Faster access from your home screen', 'גישה מהירה ונוחה ממסך הבית')}
          </div>
        </div>
      </div>

      {showManualHelp && !installPrompt ? (
        <div style={{ marginTop: 13, padding: '10px 12px', borderRadius: 12, background: 'rgba(248,219,228,0.45)', fontSize: 12, lineHeight: 1.7 }}>
          {isIosDevice()
            ? tr('على iPhone: اضغط زر المشاركة ثم اختر «إضافة إلى الشاشة الرئيسية».', 'On iPhone: tap Share, then choose “Add to Home Screen.”', 'ב-iPhone: לחצו על שיתוף ואז ״הוספה למסך הבית״.')
            : tr('افتح قائمة المتصفح ثم اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».', 'Open the browser menu, then choose “Install app” or “Add to Home screen.”', 'פתחו את תפריט הדפדפן ובחרו ״התקנת אפליקציה״ או ״הוספה למסך הבית״.')}
        </div>
      ) : null}

      <div style={{ display: 'flex', gap: 9, marginTop: 14 }}>
        <button type="button" onClick={handleInstall} style={{ flex: 1, padding: '10px 16px', border: 0, borderRadius: 12, background: 'var(--brand)', color: 'white', fontFamily: 'inherit', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
          {installPrompt ? tr('تثبيت الآن', 'Install now', 'התקנה עכשיו') : tr('طريقة التثبيت', 'How to install', 'איך מתקינים')}
        </button>
        <button type="button" onClick={handleDismiss} style={{ padding: '10px 16px', border: '1px solid var(--border)', borderRadius: 12, background: 'var(--card)', color: 'var(--subtext)', fontFamily: 'inherit', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
          {tr('لاحقاً', 'Not now', 'לא עכשיו')}
        </button>
      </div>
    </aside>
  );
}
