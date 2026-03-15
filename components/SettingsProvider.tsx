'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { AppSettings } from '@/lib/types';
import { DEFAULT_SETTINGS } from '@/lib/types';

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
  root.style.setProperty('--app-global-scale', `${settings.globalScale}`);

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

  // Prevent flash of wrong settings
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

// --- Settings Modal Component (triggered by Header button) ---
export function SettingsModal() {
  const { settings, updateSettings, resetSettings, isSettingsOpen, closeSettings } = useSettings();

  if (!isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={closeSettings}>
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">⚙️ Cài đặt</h2>
          <button
            onClick={closeSettings}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Global Scale */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">🔍 Zoom tổng thể</h3>
              <span className="text-xs text-primary-600 font-mono">{Math.round(settings.globalScale * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.7"
              max="1.5"
              step="0.05"
              value={settings.globalScale}
              onChange={e => updateSettings({ globalScale: parseFloat(e.target.value) })}
              className="w-full accent-primary-600"
            />
            <p className="text-xs text-slate-400 mt-1">Tăng/giảm kích thước toàn app (iPad, tablet...)</p>
          </div>

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

          {/* Pen Width */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">✍️ Độ rộng ngòi bút</h3>
              <span className="text-xs text-primary-600 font-mono">{settings.penWidth}px</span>
            </div>
            <input
              type="range"
              min="2"
              max="20"
              step="1"
              value={settings.penWidth}
              onChange={e => updateSettings({ penWidth: parseInt(e.target.value) })}
              className="w-full accent-primary-600"
            />
            <p className="text-xs text-slate-400 mt-1">Chỉnh độ rộng nét viết Kanji</p>
          </div>

          {/* Keyboard Shortcuts */}
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">⌨️ Phím tắt Quiz</h3>
                <p className="text-xs text-slate-500">1,2,3,4: chọn đáp án • Space: bật/tắt furigana</p>
              </div>
              <button
                onClick={() => updateSettings({ keyboardShortcuts: !settings.keyboardShortcuts })}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.keyboardShortcuts ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  settings.keyboardShortcuts ? 'translate-x-6' : ''
                }`} />
              </button>
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
  );
}
