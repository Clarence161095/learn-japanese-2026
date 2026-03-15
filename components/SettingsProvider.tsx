'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { AppSettings } from '@/lib/types';
import { DEFAULT_SETTINGS } from '@/lib/types';

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: DEFAULT_SETTINGS,
  updateSettings: () => {},
  resetSettings: () => {},
});

const STORAGE_KEY = 'nihongo_settings';

function loadSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch { /* ignore */ }
  return DEFAULT_SETTINGS;
}

function applySettingsToDOM(settings: AppSettings) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  // CSS variables for furigana sizes
  root.style.setProperty('--furigana-question-size', `${settings.furiganaQuestionSize}rem`);
  root.style.setProperty('--furigana-explanation-size', `${settings.furiganaExplanationSize}rem`);
  root.style.setProperty('--app-font-size', `${settings.fontSize}px`);
  root.style.setProperty('--app-font-family', settings.fontFamily);

  if (settings.textColor) {
    root.style.setProperty('--app-text-color', settings.textColor);
  } else {
    root.style.removeProperty('--app-text-color');
  }

  // Dark mode
  if (settings.darkMode) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const loaded = loadSettings();
    setSettings(loaded);
    applySettingsToDOM(loaded);
    setMounted(true);
  }, []);

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...partial };
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

  // Prevent flash of wrong settings
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}

// --- Settings Popup Component ---
export function SettingsBubble() {
  const [open, setOpen] = useState(false);
  const { settings, updateSettings, resetSettings } = useSettings();

  return (
    <>
      {/* Floating bubble button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-20 right-4 z-40 w-12 h-12 rounded-full bg-primary-600 dark:bg-primary-500 text-white shadow-lg hover:shadow-xl hover:scale-110 transition-all flex items-center justify-center text-xl"
        title="Cài đặt"
      >
        ⚙️
      </button>

      {/* Modal overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setOpen(false)}>
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">⚙️ Cài đặt</h2>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-6">
              {/* Furigana sizes */}
              <div>
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">📏 Kích thước Furigana</h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm text-slate-600 dark:text-slate-400">Câu hỏi (lớn)</label>
                      <span className="text-xs text-primary-600 font-mono">{settings.furiganaQuestionSize}rem</span>
                    </div>
                    <input
                      type="range"
                      min="0.3"
                      max="1.2"
                      step="0.05"
                      value={settings.furiganaQuestionSize}
                      onChange={e => updateSettings({ furiganaQuestionSize: parseFloat(e.target.value) })}
                      className="w-full accent-primary-600"
                    />
                    <div className="mt-1 text-center">
                      <ruby className="text-xl">
                        漢字<rt style={{ fontSize: `${settings.furiganaQuestionSize}rem` }}>かんじ</rt>
                      </ruby>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm text-slate-600 dark:text-slate-400">Giải thích (nhỏ)</label>
                      <span className="text-xs text-primary-600 font-mono">{settings.furiganaExplanationSize}rem</span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="1"
                      step="0.05"
                      value={settings.furiganaExplanationSize}
                      onChange={e => updateSettings({ furiganaExplanationSize: parseFloat(e.target.value) })}
                      className="w-full accent-primary-600"
                    />
                    <div className="mt-1 text-center">
                      <ruby className="text-sm">
                        漢字<rt style={{ fontSize: `${settings.furiganaExplanationSize}rem` }}>かんじ</rt>
                      </ruby>
                    </div>
                  </div>
                </div>
              </div>

              {/* IPA Toggle */}
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">🔤 IPA (English)</h3>
                    <p className="text-xs text-slate-500">Hiển thị phiên âm IPA cho tiếng Anh</p>
                  </div>
                  <button
                    onClick={() => updateSettings({ showIPA: !settings.showIPA })}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      settings.showIPA ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      settings.showIPA ? 'translate-x-6' : ''
                    }`} />
                  </button>
                </div>
              </div>

              {/* Dark Mode */}
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">🌙 Dark Mode</h3>
                    <p className="text-xs text-slate-500">Chế độ tối</p>
                  </div>
                  <button
                    onClick={() => updateSettings({ darkMode: !settings.darkMode })}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      settings.darkMode ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      settings.darkMode ? 'translate-x-6' : ''
                    }`} />
                  </button>
                </div>
              </div>

              {/* Font Size */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">🔠 Kích thước chữ</h3>
                  <span className="text-xs text-primary-600 font-mono">{settings.fontSize}px</span>
                </div>
                <input
                  type="range"
                  min="12"
                  max="24"
                  step="1"
                  value={settings.fontSize}
                  onChange={e => updateSettings({ fontSize: parseInt(e.target.value) })}
                  className="w-full accent-primary-600"
                />
              </div>

              {/* Font Family */}
              <div>
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">🅰️ Font chữ</h3>
                <select
                  value={settings.fontFamily}
                  onChange={e => updateSettings({ fontFamily: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-sm"
                >
                  <option value={'"Noto Sans JP", sans-serif'}>Noto Sans JP (mặc định)</option>
                  <option value={'"Hiragino Kaku Gothic Pro", sans-serif'}>Hiragino Kaku Gothic</option>
                  <option value={'"Yu Gothic", sans-serif'}>Yu Gothic</option>
                  <option value={'sans-serif'}>System Sans-serif</option>
                  <option value={'serif'}>Serif</option>
                  <option value={'monospace'}>Monospace</option>
                </select>
              </div>

              {/* Text Color */}
              <div>
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">🎨 Màu chữ</h3>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={settings.textColor || '#1e293b'}
                    onChange={e => updateSettings({ textColor: e.target.value })}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  {settings.textColor && (
                    <button
                      onClick={() => updateSettings({ textColor: '' })}
                      className="text-xs text-primary-600 hover:underline"
                    >
                      Dùng mặc định
                    </button>
                  )}
                </div>
              </div>

              {/* Reset */}
              <button
                onClick={resetSettings}
                className="w-full py-2 rounded-xl border-2 border-rose-200 text-rose-600 text-sm font-medium hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-900/20 transition-colors"
              >
                🔄 Khôi phục mặc định
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
