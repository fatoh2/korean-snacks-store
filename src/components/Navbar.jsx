import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Logo from './Logo';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

export default function Navbar() {
  const { totalItems } = useCart();
  const { t, lang, setLang, isRTL } = useLanguage();
  const { user, logout } = useAuth();
  const { dark, toggle: toggleDark } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const LANGS = [
    { code: 'ar', label: 'العربية' },
    { code: 'he', label: 'עברית' },
    { code: 'en', label: 'English' },
  ];
  const currentLangLabel = LANGS.find(l => l.code === lang)?.label;

  useEffect(() => {
    if (!langOpen) return;
    const close = () => setLangOpen(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [langOpen]);

  // Close the mobile menu whenever the route changes.
  const [prevPath, setPrevPath] = useState(location.pathname);
  if (location.pathname !== prevPath) {
    setPrevPath(location.pathname);
    setMenuOpen(false);
  }

  const isActive = (path) => location.pathname === path;

  const navLinkStyle = (path) => ({
    textDecoration: 'none',
    padding: '8px 16px',
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 15,
    color: isActive(path) ? 'var(--brand)' : 'var(--subtext)',
    background: isActive(path) ? 'var(--brand-soft)' : 'transparent',
  });

  const iconBtnStyle = {
    padding: '6px 12px', borderRadius: 8, border: '2px solid var(--border)',
    background: 'var(--card)', color: 'var(--subtext)',
    fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: 13, cursor: 'pointer',
  };

  const firstName = user?.name?.split(' ')[0] || '';

  return (
    <nav style={{ background: 'var(--nav-bg)', backdropFilter: 'blur(14px)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 50, boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64, direction: 'ltr', flexDirection: isRTL ? 'row' : 'row-reverse' }}>

        {/* Brand side: logo and display preferences */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Logo size={82} />
            <span style={{ fontWeight: 900, fontSize: 19, background: 'linear-gradient(135deg, var(--brand), var(--brand-blue))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: -0.5, whiteSpace: 'nowrap' }}>Lulu Tokki</span>
          </Link>

          {!isMobile && (
            <>
              <span style={{ width: 1, height: 24, background: 'var(--border)', marginInline: 3 }} />
              <button
                onClick={toggleDark}
                title={dark ? 'Light mode' : 'Dark mode'}
                style={{ ...iconBtnStyle, fontSize: 16, padding: '6px 10px' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
              >
                {dark ? '☀️' : '🌙'}
              </button>
              <div style={{ position: 'relative' }}>
                <button
                  onClick={e => { e.stopPropagation(); setLangOpen(o => !o); }}
                  style={iconBtnStyle}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand)'; e.currentTarget.style.color = 'var(--brand)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--subtext)'; }}
                >
                  {currentLangLabel} ▾
                </button>
                {langOpen && (
                  <div style={{ position: 'absolute', top: '110%', left: 0, background: 'var(--card)', border: '2px solid var(--border)', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden', zIndex: 100, minWidth: 120 }}>
                    {LANGS.map(l => (
                      <button
                        key={l.code}
                        onClick={() => { setLang(l.code); setLangOpen(false); }}
                        style={{ display: 'block', width: '100%', padding: '10px 16px', border: 'none', background: lang === l.code ? 'var(--brand-soft)' : 'transparent', color: lang === l.code ? 'var(--brand)' : 'var(--text)', fontFamily: 'Cairo, sans-serif', fontWeight: lang === l.code ? 800 : 600, fontSize: 14, cursor: 'pointer', textAlign: 'start' }}
                        onMouseEnter={e => { if (lang !== l.code) e.currentTarget.style.background = 'var(--muted-bg)'; }}
                        onMouseLeave={e => { if (lang !== l.code) e.currentTarget.style.background = 'transparent'; }}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
          {!isMobile && (
            <>
              <Link to="/" style={navLinkStyle('/')}>{t('footerHome')}</Link>
              <Link to="/store" style={navLinkStyle('/store')}>{t('navStore')}</Link>

              {user ? (
                <>
                  <Link to="/account" style={{ ...navLinkStyle('/account'), display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg,var(--brand),var(--brand-blue))', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'white', fontWeight: 800 }}>
                      {firstName.charAt(0).toUpperCase()}
                    </span>
                    {firstName}
                  </Link>
                  <button
                    onClick={() => { logout(); navigate('/'); }}
                    style={iconBtnStyle}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand)'; e.currentTarget.style.color = 'var(--brand)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--subtext)'; }}
                  >
                    {t('signOut')}
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" style={navLinkStyle('/login')}>{t('signIn')}</Link>
                  <Link to="/signup" style={{ ...navLinkStyle('/signup'), background: 'var(--brand)', color: 'white', padding: '8px 16px' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--brand-dark)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--brand)'}
                  >{t('signUp')}</Link>
                </>
              )}
            </>
          )}

          {/* Hamburger */}
          {isMobile && (
            <button
              onClick={() => setMenuOpen(o => !o)}
              style={{ background: 'none', border: 'none', padding: '6px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'center', justifyContent: 'center' }}
              aria-label="Menu"
            >
              <div style={{ width: 22, height: 2, background: 'var(--subtext)', borderRadius: 2, transform: menuOpen ? 'rotate(45deg) translateY(7px)' : 'none' }} />
              <div style={{ width: 22, height: 2, background: 'var(--subtext)', borderRadius: 2, opacity: menuOpen ? 0 : 1 }} />
              <div style={{ width: 22, height: 2, background: 'var(--subtext)', borderRadius: 2, transform: menuOpen ? 'rotate(-45deg) translateY(-7px)' : 'none' }} />
            </button>
          )}

          {/* Cart */}
          <Link
            to="/cart"
            style={{ textDecoration: 'none', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 10, color: isActive('/cart') ? 'white' : 'var(--brand)', background: isActive('/cart') ? 'var(--brand)' : 'var(--brand-soft)', border: '2px solid var(--brand)', fontSize: 20 }}
          >
            🛒
            {totalItems > 0 && (
              <span style={{ position: 'absolute', top: -8, left: -8, background: 'var(--brand-dark)', color: 'white', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, boxShadow: '0 2px 6px rgba(208,111,143,0.4)' }}>
                {totalItems > 99 ? '99+' : totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Mobile dropdown */}
      {isMobile && menuOpen && (
        <div style={{ background: 'var(--nav-bg)', borderTop: '1px solid var(--border)', borderBottom: '2px solid var(--brand)', padding: '12px 20px 16px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
          <Link to="/" style={{ display: 'block', padding: '12px 0', fontWeight: 700, fontSize: 16, color: isActive('/') ? 'var(--brand)' : 'var(--text)', textDecoration: 'none', borderBottom: '1px solid var(--border)' }}>
            {t('footerHome')}
          </Link>
          <Link to="/store" style={{ display: 'block', padding: '12px 0', fontWeight: 700, fontSize: 16, color: isActive('/store') ? 'var(--brand)' : 'var(--text)', textDecoration: 'none', borderBottom: '1px solid var(--border)' }}>
            {t('navStore')}
          </Link>
          {user ? (
            <>
              <Link to="/account" style={{ display: 'block', padding: '12px 0', fontWeight: 700, fontSize: 16, color: isActive('/account') ? 'var(--brand)' : 'var(--text)', textDecoration: 'none', borderBottom: '1px solid var(--border)' }}>
                👤 {user.name}
              </Link>
              <button onClick={() => { logout(); navigate('/'); }} style={{ display: 'block', width: '100%', textAlign: 'start', padding: '12px 0', fontWeight: 700, fontSize: 16, color: 'var(--subtext)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>
                {t('signOut')}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={{ display: 'block', padding: '12px 0', fontWeight: 700, fontSize: 16, color: isActive('/login') ? 'var(--brand)' : 'var(--text)', textDecoration: 'none', borderBottom: '1px solid var(--border)' }}>
                {t('signIn')}
              </Link>
              <Link to="/signup" style={{ display: 'block', padding: '12px 0', fontWeight: 700, fontSize: 16, color: isActive('/signup') ? 'var(--brand)' : 'var(--text)', textDecoration: 'none' }}>
                {t('signUp')}
              </Link>
            </>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 12, maxWidth: '50%' }}>
            <button onClick={toggleDark} style={{ ...iconBtnStyle, flex: 1, fontSize: 13, textAlign: 'center', padding: '8px 6px', whiteSpace: 'nowrap' }}>
              {dark ? '☀️ Light' : '🌙 Dark'}
            </button>
            <div style={{ position: 'relative', flex: 1 }}>
              <button
                onClick={e => { e.stopPropagation(); setLangOpen(o => !o); }}
                style={{ ...iconBtnStyle, width: '100%', textAlign: 'center', padding: '8px 6px', whiteSpace: 'nowrap' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand)'; e.currentTarget.style.color = 'var(--brand)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--subtext)'; }}
              >
                {currentLangLabel} ▾
              </button>
              {langOpen && (
                <div style={{ position: 'absolute', bottom: '110%', right: 0, background: 'var(--card)', border: '2px solid var(--border)', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden', zIndex: 100, minWidth: 120 }}>
                  {LANGS.map(l => (
                    <button
                      key={l.code}
                      onClick={() => { setLang(l.code); setLangOpen(false); }}
                      style={{ display: 'block', width: '100%', padding: '10px 16px', border: 'none', background: lang === l.code ? 'var(--brand-soft)' : 'transparent', color: lang === l.code ? 'var(--brand)' : 'var(--text)', fontFamily: 'Cairo, sans-serif', fontWeight: lang === l.code ? 800 : 600, fontSize: 14, cursor: 'pointer', textAlign: 'start' }}
                      onMouseEnter={e => { if (lang !== l.code) e.currentTarget.style.background = 'var(--muted-bg)'; }}
                      onMouseLeave={e => { if (lang !== l.code) e.currentTarget.style.background = 'transparent'; }}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
