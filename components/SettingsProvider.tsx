'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { AppSettings, ThemeMode, CustomColors } from '@/lib/types';
import { DEFAULT_SETTINGS, DEFAULT_CUSTOM_COLORS } from '@/lib/types';

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;
  resetSettings: () => void;
  isSettingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: DEFAULT_SETTINGS,
  updateSettings: () => {},
  resetSettings: () => {},
  isSettingsOpen: false,
  openSettings: () => {},
  closeSettings: () => {},
});

const STORAGE_KEY = 'nihongo_settings';

// Theme presets
const THEME_PRESETS: Record<string, { bg: string; cardBg: string; text: string; accent: string; furigana: string; isDark: boolean }> = {
  light: { bg: '#f8fafc', cardBg: '#ffffff', text: '#1e293b', accent: '#4f46e5', furigana: '#6366f1', isDark: false },
  dark: { bg: '#0f172a', cardBg: '#1e293b', text: '#e2e8f0', accent: '#818cf8', furigana: '#a5b4fc', isDark: true },
  dracula: { bg: '#282a36', cardBg: '#44475a', text: '#f8f8f2', accent: '#bd93f9', furigana: '#ff79c6', isDark: true },
  'dark-plus': { bg: '#1e1e1e', cardBg: '#252526', text: '#d4d4d4', accent: '#569cd6', furigana: '#9cdcfe', isDark: true },
  nord: { bg: '#2e3440', cardBg: '#3b4252', text: '#eceff4', accent: '#88c0d0', furigana: '#81a1c1', isDark: true },
  'solarized-dark': { bg: '#002b36', cardBg: '#073642', text: '#839496', accent: '#268bd2', furigana: '#2aa198', isDark: true },
};

function loadSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        customColors: { ...DEFAULT_CUSTOM_COLORS, ...(parsed.customColors || {}) },
      };
    }
  } catch { /* ignore */ }
  return DEFAULT_SETTINGS;
}

function applySettingsToDOM(settings: AppSettings) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  root.style.setProperty('--furigana-question-size', `${settings.furiganaQuestionSize}rem`);
  root.style.setProperty('--furigana-explanation-size', `${settings.furiganaExplanationSize}rem`);
  root.style.setProperty('--app-font-size', `${settings.fontSize}px`);
  root.style.setProperty('--app-font-family', settings.fontFamily);
  root.style.setProperty('--app-global-scale', `${settings.globalScale}`);

  if (settings.textColor) {
    root.style.setProperty('--app-text-color', settings.textColor);
  } else {
    root.style.removeProperty('--app-text-color');
  }

  // Theme handling
  const themeMode = settings.themeMode || (settings.darkMode ? 'dark' : 'light');
  const preset = THEME_PRESETS[themeMode];

  if (themeMode === 'custom') {
    const cc = settings.customColors || DEFAULT_CUSTOM_COLORS;
    if (cc.background) root.style.setProperty('--theme-bg', cc.background);
    else root.style.removeProperty('--theme-bg');
    if (cc.cardBg) root.style.setProperty('--theme-card-bg', cc.cardBg);
    else root.style.removeProperty('--theme-card-bg');
    if (cc.questionText) root.style.setProperty('--theme-question-text', cc.questionText);
    else root.style.removeProperty('--theme-question-text');
    if (cc.explanationBg) root.style.setProperty('--theme-explanation-bg', cc.explanationBg);
    else root.style.removeProperty('--theme-explanation-bg');
    if (cc.furiganaColor) root.style.setProperty('--theme-furigana', cc.furiganaColor);
    else root.style.removeProperty('--theme-furigana');
    if (cc.accentColor) root.style.setProperty('--theme-accent', cc.accentColor);
    else root.style.removeProperty('--theme-accent');
    root.classList.add('dark');
    root.setAttribute('data-theme', 'custom');
  } else if (preset) {
    root.style.setProperty('--theme-bg', preset.bg);
    root.style.setProperty('--theme-card-bg', preset.cardBg);
    root.style.setProperty('--theme-question-text', preset.text);
    root.style.setProperty('--theme-furigana', preset.furigana);
    root.style.setProperty('--theme-accent', preset.accent);
    root.style.removeProperty('--theme-explanation-bg');
    root.setAttribute('data-theme', themeMode);

    if (preset.isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [mounted, setMounted] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    const loaded = loadSettings();
    setSettings(loaded);
    applySettingsToDOM(loaded);
    setMounted(true);
  }, []);

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...partial };
      if (partial.themeMode !== undefined) {
        const p = THEME_PRESETS[partial.themeMode];
        next.darkMode = p ? p.isDark : true;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      applySettingsToDOM(next);
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSettings(DEFAULT_SETTINGS);
    applySettingsToDOM(DEFAULT_SETTINGS);
  }, []);

  const openSettings = useCallback(() => setIsSettingsOpen(true), []);
  const closeSettings = useCallback(() => setIsSettingsOpen(false), []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings, isSettingsOpen, openSettings, closeSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}

// Font options
const FONT_OPTIONS = [
  { value: '"Noto Sans JP", sans-serif', label: 'Noto Sans JP (mặc định)' },
  { value: '"Hiragino Kaku Gothic Pro", "Hiragino Sans", sans-serif', label: 'Hiragino (macOS/iOS)' },
  { value: '"Yu Gothic", "YuGothic", sans-serif', label: 'Yu Gothic (Windows)' },
  { value: '"Hiragino Mincho ProN", "Yu Mincho", serif', label: 'Hiragino Mincho (macOS)' },
  { value: '"Courier New", "Courier", monospace', label: 'Courier New' },
  { value: '"Times New Roman", "Times", serif', label: 'Times New Roman' },
  { value: '"Georgia", serif', label: 'Georgia' },
  { value: '"SF Pro Text", -apple-system, system-ui, sans-serif', label: 'San Francisco (Apple)' },
  { value: 'system-ui, -apple-system, sans-serif', label: 'System UI' },
  { value: 'sans-serif', label: 'Sans-serif' },
  { value: 'serif', label: 'Serif' },
  { value: 'monospace', label: 'Monospace' },
];

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: string }[] = [
  { value: 'light', label: 'Light', icon: '☀️' },
  { value: 'dark', label: 'Dark', icon: '🌙' },
  { value: 'dracula', label: 'Dracula', icon: '🧛' },
  { value: 'dark-plus', label: 'Dark+', icon: '🖥️' },
  { value: 'nord', label: 'Nord', icon: '❄️' },
  { value: 'solarized-dark', label: 'Solarized Dark', icon: '🌅' },
  { value: 'custom', label: 'Tuỳ chỉnh', icon: '🎨' },
];

// --- Settings Modal Component ---
export function SettingsModal() {
  const { settings, updateSettings, resetSettings, isSettingsOpen, closeSettings } = useSettings();
  const [activeTab, setActiveTab] = useState<'general' | 'theme' | 'advanced'>('general');

  if (!isSettingsOpen) return null;

  const updateCustomColor = (key: keyof CustomColors, value: string) => {
    updateSettings({
      customColors: { ...(settings.customColors || DEFAULT_CUSTOM_COLORS), [key]: value },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={closeSettings}>
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">⚙️ Cài đặt</h2>
          <button onClick={closeSettings} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          {[
            { key: 'general' as const, label: '⚡ Chung' },
            { key: 'theme' as const, label: '🎨 Theme' },
            { key: 'advanced' as const, label: '🔧 Khác' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'text-primary-700 dark:text-primary-300 border-b-2 border-primary-500'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-5">
          {/* ====== GENERAL TAB ====== */}
          {activeTab === 'general' && (
            <>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">🔍 Zoom tổng thể</h3>
                  <span className="text-xs text-primary-600 dark:text-primary-400 font-mono">{Math.round(settings.globalScale * 100)}%</span>
                </div>
                <input type="range" min="0.7" max="1.5" step="0.05" value={settings.globalScale}
                  onChange={e => updateSettings({ globalScale: parseFloat(e.target.value) })} className="w-full accent-primary-600" />
                <p className="text-xs text-slate-400 mt-1">Tăng/giảm kích thước toàn app</p>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">📏 Furigana</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs text-slate-600 dark:text-slate-400">Câu hỏi</label>
                      <span className="text-xs text-primary-600 dark:text-primary-400 font-mono">{settings.furiganaQuestionSize}rem</span>
                    </div>
                    <input type="range" min="0.3" max="1.2" step="0.05" value={settings.furiganaQuestionSize}
                      onChange={e => updateSettings({ furiganaQuestionSize: parseFloat(e.target.value) })} className="w-full accent-primary-600" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs text-slate-600 dark:text-slate-400">Giải thích</label>
                      <span className="text-xs text-primary-600 dark:text-primary-400 font-mono">{settings.furiganaExplanationSize}rem</span>
                    </div>
                    <input type="range" min="0.2" max="1" step="0.05" value={settings.furiganaExplanationSize}
                      onChange={e => updateSettings({ furiganaExplanationSize: parseFloat(e.target.value) })} className="w-full accent-primary-600" />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">✍️ Độ rộng ngòi bút</h3>
                  <span className="text-xs text-primary-600 dark:text-primary-400 font-mono">{settings.penWidth}px</span>
                </div>
                <input type="range" min="2" max="20" step="1" value={settings.penWidth}
                  onChange={e => updateSettings({ penWidth: parseInt(e.target.value) })} className="w-full accent-primary-600" />
              </div>

              {[
                { key: 'keyboardShortcuts' as const, label: '⌨️ Phím tắt Quiz', desc: '1-4 chọn đáp án • Space furigana' },
                { key: 'showIPA' as const, label: '🔤 IPA (English)', desc: 'Phiên âm IPA cho tiếng Anh' },
              ].map(toggle => (
                <div key={toggle.key} className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">{toggle.label}</h3>
                    <p className="text-xs text-slate-500">{toggle.desc}</p>
                  </div>
                  <button
                    onClick={() => updateSettings({ [toggle.key]: !settings[toggle.key] })}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      settings[toggle.key] ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      settings[toggle.key] ? 'translate-x-5' : ''
                    }`} />
                  </button>
                </div>
              ))}
            </>
          )}

          {/* ====== THEME TAB ====== */}
          {activeTab === 'theme' && (
            <>
              <div>
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">🎨 Theme</h3>
                <div className="grid grid-cols-2 gap-2">
                  {THEME_OPTIONS.map(theme => (
                    <button
                      key={theme.value}
                      onClick={() => updateSettings({ themeMode: theme.value })}
                      className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all text-left ${
                        settings.themeMode === theme.value
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                          : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-primary-300'
                      }`}
                    >
                      {theme.icon} {theme.label}
                    </button>
                  ))}
                </div>
              </div>

              {settings.themeMode === 'custom' && (
                <div>
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">🎨 Tuỳ chỉnh</h3>
                  <div className="space-y-3">
                    {[
                      { key: 'background' as keyof CustomColors, label: '🖼 Nền trang' },
                      { key: 'cardBg' as keyof CustomColors, label: '📦 Nền card' },
                      { key: 'questionText' as keyof CustomColors, label: '❓ Chữ câu hỏi' },
                      { key: 'explanationBg' as keyof CustomColors, label: '💡 Nền giải thích' },
                      { key: 'furiganaColor' as keyof CustomColors, label: '📖 Furigana' },
                      { key: 'accentColor' as keyof CustomColors, label: '💜 Accent' },
                    ].map(c => (
                      <div key={c.key} className="flex items-center justify-between">
                        <label className="text-sm text-slate-600 dark:text-slate-400">{c.label}</label>
                        <div className="flex items-center gap-2">
                          <input type="color" value={settings.customColors?.[c.key] || '#ffffff'}
                            onChange={e => updateCustomColor(c.key, e.target.value)}
                            className="w-8 h-8 rounded cursor-pointer border border-slate-300 dark:border-slate-600" />
                          {settings.customColors?.[c.key] && (
                            <button onClick={() => updateCustomColor(c.key, '')}
                              className="text-xs text-slate-400 hover:text-rose-500" title="Reset">✕</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">🅰️ Font chữ</h3>
                <select value={settings.fontFamily} onChange={e => updateSettings({ fontFamily: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-sm">
                  {FONT_OPTIONS.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">🔠 Kích thước chữ</h3>
                  <span className="text-xs text-primary-600 dark:text-primary-400 font-mono">{settings.fontSize}px</span>
                </div>
                <input type="range" min="12" max="24" step="1" value={settings.fontSize}
                  onChange={e => updateSettings({ fontSize: parseInt(e.target.value) })} className="w-full accent-primary-600" />
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">🎨 Màu chữ chung</h3>
                <div className="flex items-center gap-3">
                  <input type="color" value={settings.textColor || '#1e293b'}
                    onChange={e => updateSettings({ textColor: e.target.value })} className="w-10 h-10 rounded cursor-pointer" />
                  {settings.textColor && (
                    <button onClick={() => updateSettings({ textColor: '' })} className="text-xs text-primary-600 hover:underline">Mặc định</button>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ====== ADVANCED TAB ====== */}
          {activeTab === 'advanced' && (
            <>
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-400 mb-2">Xem trước:</p>
                <div className="text-xl" style={{ fontFamily: settings.fontFamily }}>
                  <ruby>漢字<rt style={{ fontSize: `${settings.furiganaQuestionSize}rem` }}>かんじ</rt></ruby>
                  を
                  <ruby>勉強<rt style={{ fontSize: `${settings.furiganaQuestionSize}rem` }}>べんきょう</rt></ruby>
                  しましょう！
                </div>
              </div>

              <button onClick={resetSettings}
                className="w-full py-2 rounded-xl border-2 border-rose-200 text-rose-600 text-sm font-medium hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-900/20 transition-colors">
                🔄 Khôi phục mặc định
              </button>

              <button
                onClick={async () => {
                  closeSettings();
                  await fetch('/api/auth/logout', { method: 'POST' });
                  window.location.href = '/login';
                }}
                className="w-full py-2 rounded-xl border-2 border-slate-200 text-rose-600 text-sm font-medium hover:bg-rose-50 dark:border-slate-700 dark:text-rose-400 dark:hover:bg-rose-900/20 transition-colors">
                🚪 Đăng xuất
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
