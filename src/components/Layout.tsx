import { useEffect } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Icon, type IconName } from '@/components/Icon'
import { useEffectiveDark, useProgressStore } from '@/lib/progress'

const THEME_ORDER = ['system', 'light', 'dark'] as const

export function Layout() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { settings, setSettings } = useProgressStore()
  const recordActivity = useProgressStore((s) => s.recordActivity)
  const effectiveDark = useEffectiveDark()

  // Apply data-theme + data-jpfont + data-cardstyle to <html> root.
  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', effectiveDark ? 'dark' : 'light')
    root.setAttribute('data-jpfont', settings.jpFont)
    root.setAttribute('data-cardstyle', settings.cardStyle)
  }, [effectiveDark, settings.jpFont, settings.cardStyle])

  // Opening the app counts as an activity day.
  useEffect(() => {
    recordActivity()
  }, [recordActivity])

  const cycleTheme = () => {
    const i = THEME_ORDER.indexOf(settings.theme)
    setSettings({ theme: THEME_ORDER[(i + 1) % THEME_ORDER.length] })
  }

  const tab = pathname.startsWith('/cards')
    ? 'cards'
    : pathname.startsWith('/tests')
      ? 'tests'
      : pathname.startsWith('/game')
        ? 'game'
        : pathname === '/' || pathname.startsWith('/profile')
          ? pathname.startsWith('/profile')
            ? ''
            : 'home'
          : ''

  const tabs: { id: string; to: string; label: string; icon: IconName }[] = [
    { id: 'home', to: '/', label: 'Home', icon: 'home' },
    { id: 'cards', to: '/cards', label: 'Cards', icon: 'layers' },
    { id: 'tests', to: '/tests', label: 'Tests', icon: 'cap' },
    { id: 'game', to: '/game', label: 'Game', icon: 'zap' },
  ]

  const themeIcon: IconName =
    settings.theme === 'dark' ? 'moon' : settings.theme === 'light' ? 'sun' : 'sysdot'

  return (
    <div className="app-root">
      <header className="appbar">
        <h1>
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 8,
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            <span className="brand-jp jp">漢字</span>
            Kanji
          </Link>
        </h1>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button
            type="button"
            onClick={cycleTheme}
            title={`Theme: ${settings.theme} (click to cycle)`}
            aria-label="Cycle theme"
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--ink-2)',
            }}
          >
            <Icon name={themeIcon} size={15} stroke={1.7} />
          </button>
          <button
            type="button"
            onClick={() => navigate('/profile')}
            title="Settings"
            aria-label="Settings"
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--ink-2)',
            }}
          >
            <Icon name="sliders" size={15} stroke={1.7} />
          </button>
        </div>
      </header>

      <main className="screen">
        <Outlet />
      </main>

      <nav className="tabbar">
        {tabs.map((t) => (
          <Link key={t.id} to={t.to} className={tab === t.id ? 'active' : ''}>
            <span className="ico">
              <Icon name={t.icon} size={20} />
            </span>
            <span>{t.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
