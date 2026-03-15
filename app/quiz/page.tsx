'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function QuizSelectionContent() {
  const searchParams = useSearchParams();
  const isRandom = searchParams.get('random') === 'true';
  const [counts, setCounts] = useState<{ total: number; bySection: Record<string, number>; byLevel: Record<string, number> } | null>(null);

  useEffect(() => {
    fetch('/api/questions?count=true')
      .then(res => res.json())
      .then(data => setCounts(data))
      .catch(console.error);
  }, []);

  // If random mode, redirect to quiz with random
  if (isRandom) {
    return <QuizRedirect section="all" random />;
  }

  const sections = [
    {
      key: 'MOJI',
      icon: '🔤',
      title: 'MOJI (文字)',
      desc: 'Câu hỏi về Kanji, cách đọc chữ Hán',
      color: 'rose',
      count: counts?.bySection?.MOJI || 0,
    },
    {
      key: 'GOI',
      icon: '📚',
      title: 'GOI (語彙)',
      desc: 'Câu hỏi về từ vựng, cách sử dụng từ',
      color: 'amber',
      count: counts?.bySection?.GOI || 0,
    },
    {
      key: 'BUNPO',
      icon: '📐',
      title: 'BUNPO (文法)',
      desc: 'Câu hỏi về ngữ pháp, cấu trúc câu',
      color: 'emerald',
      count: counts?.bySection?.BUNPO || 0,
    },
  ];

  const levels = ['N4-N5', 'N3', 'N2', 'N1'];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 page-enter">
      <h1 className="text-3xl font-bold text-slate-800 mb-2">📝 Chọn bài quiz</h1>
      <p className="text-slate-500 mb-8">Chọn kỹ năng và cấp độ để bắt đầu</p>

      {/* By Section */}
      <h2 className="text-lg font-bold text-slate-700 mb-4">Theo kỹ năng</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {sections.map(section => (
          <Link key={section.key} href={`/quiz/${section.key.toLowerCase()}`}>
            <div className="card hover:shadow-lg transition-all cursor-pointer group">
              <div className="text-4xl mb-3">{section.icon}</div>
              <h3 className="font-bold text-lg text-slate-700 group-hover:text-primary-700">
                {section.title}
              </h3>
              <p className="text-sm text-slate-500 mt-1">{section.desc}</p>
              <div className="mt-3">
                <span className={`badge ${
                  section.color === 'rose' ? 'badge-moji' :
                  section.color === 'amber' ? 'badge-goi' : 'badge-bunpo'
                }`}>
                  {section.count} câu
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* By Level */}
      <h2 className="text-lg font-bold text-slate-700 mb-4">Theo cấp độ JLPT</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {levels.map(level => (
          <Link key={level} href={`/quiz/all?level=${level}`}>
            <div className="card text-center hover:shadow-lg transition-all cursor-pointer group">
              <div className="text-2xl font-bold text-primary-600 group-hover:text-primary-700">
                {level}
              </div>
              <p className="text-sm text-slate-500 mt-1">
                {counts?.byLevel?.[level] || 0} câu
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Special modes */}
      <h2 className="text-lg font-bold text-slate-700 mb-4">Chế độ đặc biệt</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/quiz/all?random=true">
          <div className="card hover:shadow-lg transition-all cursor-pointer group">
            <div className="text-3xl mb-2">🎲</div>
            <h3 className="font-bold text-slate-700 group-hover:text-primary-700">Random All</h3>
            <p className="text-sm text-slate-500">Ngẫu nhiên tất cả câu hỏi</p>
          </div>
        </Link>
        <Link href="/quiz/all?starred=true">
          <div className="card hover:shadow-lg transition-all cursor-pointer group">
            <div className="text-3xl mb-2">⭐</div>
            <h3 className="font-bold text-slate-700 group-hover:text-amber-700">Câu đã đánh sao</h3>
            <p className="text-sm text-slate-500">Ôn lại các câu quan trọng</p>
          </div>
        </Link>
        <Link href="/quiz/all?wrong=true">
          <div className="card hover:shadow-lg transition-all cursor-pointer group">
            <div className="text-3xl mb-2">❌</div>
            <h3 className="font-bold text-slate-700 group-hover:text-rose-700">Câu hay sai</h3>
            <p className="text-sm text-slate-500">Luyện lại những câu đã trả lời sai</p>
          </div>
        </Link>
      </div>

      {counts && counts.total === 0 && (
        <div className="mt-8 card text-center bg-amber-50 border-amber-200">
          <p className="text-amber-700">
            ⚠️ Chưa có câu hỏi nào trong hệ thống.{' '}
            <Link href="/import" className="font-medium underline">Import data</Link> để bắt đầu!
          </p>
        </div>
      )}
    </div>
  );
}

function QuizRedirect({ section, random }: { section: string; random?: boolean }) {
  useEffect(() => {
    window.location.href = `/quiz/${section}${random ? '?random=true' : ''}`;
  }, [section, random]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-pulse text-center">
        <div className="text-4xl mb-2">📝</div>
        <p className="text-slate-500">Đang chuẩn bị quiz...</p>
      </div>
    </div>
  );
}

export default function QuizSelectionPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-center">
          <div className="text-4xl mb-2">📝</div>
          <p className="text-slate-500">Đang tải...</p>
        </div>
      </div>
    }>
      <QuizSelectionContent />
    </Suspense>
  );
}
