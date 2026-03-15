'use client';

import { useState, createContext, useContext, ReactNode, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { useLevel, type LevelFilter } from './LevelProvider';
import { useSettings } from './SettingsProvider';

// Furigana context
interface FuriganaContextType {
  showFurigana: boolean;
  toggleFurigana: () => void;
  setShowFurigana: (value: boolean) => void;
}

const FuriganaContext = createContext<FuriganaContextType>({
  showFurigana: true,
  toggleFurigana: () => {},
  setShowFurigana: () => {},
});

export function FuriganaProvider({ children }: { children: ReactNode }) {
  const [showFurigana, setShowFurigana] = useState(true);
  const toggleFurigana = useCallback(() => setShowFurigana(prev => !prev), []);
  return (
    <FuriganaContext.Provider value={{ showFurigana, toggleFurigana, setShowFurigana }}>
      {children}
    </FuriganaContext.Provider>
  );
}

export function useFurigana() {
  return useContext(FuriganaContext);
}

// Navigation items
const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/quiz', label: 'Quiz', icon: '📝' },
  { href: '/moji-practice', label: 'Kanji', icon: '✍️' },
  { href: '/review', label: 'Review', icon: '⭐' },
];

const levels: { key: LevelFilter; label: string }[] = [
  { key: 'ALL', label: '📚 Tất cả' },
  { key: 'N4-N5', label: '🟢 N4-N5' },
  { key: 'N3', label: '🔵 N3' },
  { key: 'N2', label: '🟣 N2' },
  { key: 'N1', label: '🔴 N1' },
];

export default function Header() {
  const { user } = useAuth();
  const pathname = usePathname();
  const { showFurigana, toggleFurigana } = useFurigana();
  const { level, setLevel } = useLevel();
  const { openSettings } = useSettings();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return null;

  const canImport = user.role === 'admin' || user.role === 'collaborator';
  const allNavItems = canImport
    ? [...navItems.slice(0, 3), { href: '/import', label: 'Import', icon: '📥' }, ...navItems.slice(3)]
    : navItems;

  return (
    <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
            <span className="text-2xl">🇯🇵</span>
            <span className="font-bold text-lg text-primary-700 dark:text-primary-300 hidden sm:block">
              日本語マスター
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {allNavItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith(item.href)
                    ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <span className="mr-1.5">{item.icon}</span>
                {item.label}
              </Link>
            ))}
            {user.role === 'admin' && (
              <Link
                href="/admin/users"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith('/admin')
                    ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <span className="mr-1.5">👤</span>
                Users
              </Link>
            )}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Level Selector (select box) */}
            <select
              value={level}
              onChange={e => setLevel(e.target.value as LevelFilter)}
              className="px-2 py-1 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer focus:ring-2 focus:ring-primary-300 focus:outline-none transition-all"
            >
              {levels.map(l => (
                <option key={l.key} value={l.key}>{l.label}</option>
              ))}
            </select>

            {/* Furigana Toggle */}
            <button
              onClick={toggleFurigana}
              className={`px-2 py-1 rounded-lg text-xs font-medium border transition-all ${
                showFurigana
                  ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-200 dark:border-primary-700 text-primary-700 dark:text-primary-300'
                  : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400'
              }`}
              title={showFurigana ? 'Furigana: BẬT' : 'Furigana: TẮT'}
            >
              <ruby>
                漢<rt className={showFurigana ? '' : '!invisible'}>{showFurigana ? 'かん' : ''}</rt>
              </ruby>
              {showFurigana ? ' ON' : ' OFF'}
            </button>

            {/* User info */}
            <div className="hidden sm:flex items-center gap-1 text-sm text-slate-600 dark:text-slate-300">
              <span>👤</span>
              <span className="max-w-[80px] truncate">{user.display_name || user.username}</span>
            </div>

            {/* Settings button */}
            <button
              onClick={openSettings}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              title="Cài đặt"
            >
              ⚙️
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-3 border-t border-slate-100 dark:border-slate-700 space-y-1">
            {allNavItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                  pathname.startsWith(item.href)
                    ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </Link>
            ))}
            {user.role === 'admin' && (
              <Link
                href="/admin/users"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <span className="mr-2">👤</span>
                Quản lý Users
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
