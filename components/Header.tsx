'use client';

import { useState, createContext, useContext, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';

// Furigana context
interface FuriganaContextType {
  showFurigana: boolean;
  toggleFurigana: () => void;
}

const FuriganaContext = createContext<FuriganaContextType>({
  showFurigana: true,
  toggleFurigana: () => {},
});

export function FuriganaProvider({ children }: { children: ReactNode }) {
  const [showFurigana, setShowFurigana] = useState(true);
  const toggleFurigana = () => setShowFurigana(prev => !prev);
  return (
    <FuriganaContext.Provider value={{ showFurigana, toggleFurigana }}>
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
  { href: '/import', label: 'Import', icon: '📥' },
  { href: '/review', label: 'Review', icon: '⭐' },
];

export default function Header() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const { showFurigana, toggleFurigana } = useFurigana();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return null;

  return (
    <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-2xl">🇯🇵</span>
            <span className="font-bold text-lg text-primary-700 dark:text-primary-300 hidden sm:block">
              日本語マスター
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => (
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
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Furigana Toggle */}
            <button
              onClick={toggleFurigana}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                showFurigana
                  ? 'bg-primary-50 border-primary-200 text-primary-700'
                  : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}
              title={showFurigana ? 'Furigana: BẬT' : 'Furigana: TẮT'}
            >
              <ruby>
                漢<rt className={showFurigana ? '' : '!invisible'}>{showFurigana ? 'かん' : ''}</rt>
              </ruby>
              {showFurigana ? ' ON' : ' OFF'}
            </button>

            {/* User */}
            <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <span>👤</span>
              <span>{user.display_name || user.username}</span>
            </div>

            <button
              onClick={logout}
              className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              Đăng xuất
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
          <nav className="md:hidden py-3 border-t border-slate-100 dark:border-slate-700">
            {navItems.map(item => (
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
          </nav>
        )}
      </div>
    </header>
  );
}
