'use client';

import { useEffect, useRef, useState } from 'react';

interface KanjiWriterProps {
  character: string;
  size?: number;
  onComplete?: () => void;
}

declare global {
  interface Window {
    HanziWriter: {
      create: (el: HTMLElement | string, char: string, options: Record<string, unknown>) => HanziWriterInstance;
    };
  }
}

interface HanziWriterInstance {
  quiz: (options?: Record<string, unknown>) => void;
  animateCharacter: (options?: Record<string, unknown>) => void;
  hideCharacter: () => void;
  showCharacter: () => void;
  showOutline: () => void;
  hideOutline: () => void;
  cancelQuiz: () => void;
  setCharacter: (char: string) => Promise<void>;
}

export default function KanjiWriter({ character, size = 250, onComplete }: KanjiWriterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const writerRef = useRef<HanziWriterInstance | null>(null);
  const [mode, setMode] = useState<'view' | 'animate' | 'quiz'>('view');
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load HanziWriter from CDN
    if (typeof window !== 'undefined' && !window.HanziWriter) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/hanzi-writer@3.5/dist/hanzi-writer.min.js';
      script.onload = () => setLoaded(true);
      script.onerror = () => setError('Không thể tải thư viện HanziWriter');
      document.head.appendChild(script);
    } else {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded || !containerRef.current || !window.HanziWriter) return;

    // Clear previous
    containerRef.current.innerHTML = '';
    writerRef.current = null;

    try {
      const writer = window.HanziWriter.create(containerRef.current, character, {
        width: size,
        height: size,
        padding: 10,
        showOutline: true,
        showCharacter: true,
        strokeAnimationSpeed: 1.5,
        delayBetweenStrokes: 200,
        strokeColor: '#4338ca',
        outlineColor: '#ddd6fe',
        drawingColor: '#6366f1',
        highlightColor: '#a5b4fc',
        radicalColor: '#818cf8',
        drawingWidth: 6,
        showHintAfterMisses: 3,
      });

      writerRef.current = writer;
      setMode('view');
      setError(null);
    } catch {
      setError(`Không thể hiển thị chữ「${character}」`);
    }
  }, [character, size, loaded]);

  const handleAnimate = () => {
    if (!writerRef.current) return;
    writerRef.current.hideCharacter();
    writerRef.current.animateCharacter({
      onComplete: () => {
        setMode('animate');
      },
    });
    setMode('animate');
  };

  const handleQuiz = () => {
    if (!writerRef.current) return;
    writerRef.current.hideCharacter();
    writerRef.current.quiz({
      onComplete: () => {
        setMode('view');
        writerRef.current?.showCharacter();
        onComplete?.();
      },
    });
    setMode('quiz');
  };

  const handleReset = () => {
    if (!writerRef.current) return;
    writerRef.current.cancelQuiz();
    writerRef.current.showCharacter();
    writerRef.current.showOutline();
    setMode('view');
  };

  if (error) {
    return (
      <div className="text-center p-4">
        <div className="text-6xl mb-2">{character}</div>
        <p className="text-sm text-rose-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Character display */}
      <div className="text-center">
        <div className="text-5xl font-bold text-primary-700 mb-1">{character}</div>
      </div>

      {/* Writer container */}
      <div
        ref={containerRef}
        className="kanji-writer-container bg-white rounded-2xl shadow-sm"
        style={{ width: size, height: size }}
      />

      {/* Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleAnimate}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            mode === 'animate'
              ? 'bg-primary-100 text-primary-700 border border-primary-200'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          ▶ Xem cách viết
        </button>
        <button
          onClick={handleQuiz}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            mode === 'quiz'
              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          ✍️ Tập viết
        </button>
        <button
          onClick={handleReset}
          className="px-4 py-2 rounded-xl text-sm font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
        >
          🔄 Reset
        </button>
      </div>

      {mode === 'quiz' && (
        <p className="text-sm text-primary-600 animate-pulse">
          ✍️ Hãy viết chữ theo thứ tự nét! Sai 3 lần sẽ có gợi ý.
        </p>
      )}
    </div>
  );
}
