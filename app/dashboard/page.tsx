'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import ProgressStats from '@/components/ProgressStats';
import type { UserStats } from '@/lib/types';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const quickActions = [
    {
      href: '/quiz/moji',
      icon: '🔤',
      title: 'MOJI',
      subtitle: '文字 - Kanji & Chữ',
      color: 'from-rose-500 to-pink-600',
    },
    {
      href: '/quiz/goi',
      icon: '📚',
      title: 'GOI',
      subtitle: '語彙 - Từ vựng',
      color: 'from-amber-500 to-orange-600',
    },
    {
      href: '/quiz/bunpo',
      icon: '📐',
      title: 'BUNPO',
      subtitle: '文法 - Ngữ pháp',
      color: 'from-emerald-500 to-teal-600',
    },
    {
      href: '/quiz?random=true',
      icon: '🎲',
      title: 'Random',
      subtitle: 'Tất cả câu hỏi',
      color: 'from-primary-500 to-indigo-600',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 page-enter">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
          ようこそ、{user?.display_name || user?.username}さん！👋
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Hôm nay bạn muốn học gì?</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {quickActions.map(action => (
          <Link key={action.href} href={action.href}>
            <div className={`bg-gradient-to-br ${action.color} rounded-2xl p-5 text-white 
                            hover:scale-105 transition-transform duration-200 cursor-pointer shadow-lg`}>
              <div className="text-3xl mb-2">{action.icon}</div>
              <h3 className="font-bold text-lg">{action.title}</h3>
              <p className="text-white/80 text-sm">{action.subtitle}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* More Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link href="/moji-practice">
          <div className="card hover:border-primary-200 dark:hover:border-primary-700 cursor-pointer group">
            <div className="flex items-center gap-3">
              <span className="text-3xl">✍️</span>
              <div>
                <h3 className="font-bold text-slate-700 dark:text-slate-200 group-hover:text-primary-700 dark:group-hover:text-primary-300">Tập viết Kanji</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Luyện viết chữ Hán với animation</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/review">
          <div className="card hover:border-amber-200 dark:hover:border-amber-700 cursor-pointer group">
            <div className="flex items-center gap-3">
              <span className="text-3xl">⭐</span>
              <div>
                <h3 className="font-bold text-slate-700 dark:text-slate-200 group-hover:text-amber-700 dark:group-hover:text-amber-300">Ôn tập</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Xem lại câu đánh dấu & câu sai</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/import">
          <div className="card hover:border-emerald-200 dark:hover:border-emerald-700 cursor-pointer group">
            <div className="flex items-center gap-3">
              <span className="text-3xl">📥</span>
              <div>
                <h3 className="font-bold text-slate-700 dark:text-slate-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-300">Import Data</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Thêm câu hỏi mới từ JSON</p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Statistics */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-4xl animate-pulse mb-2">📊</div>
          <p className="text-slate-500">Đang tải thống kê...</p>
        </div>
      ) : stats ? (
        <ProgressStats stats={stats} />
      ) : (
        <div className="card text-center py-12">
          <div className="text-4xl mb-3">📝</div>
          <h3 className="text-lg font-medium text-slate-700 dark:text-slate-200">Chưa có câu hỏi nào</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-1 mb-4">Hãy import data từ JSON để bắt đầu học!</p>
          <Link href="/import" className="btn-primary inline-block">
            📥 Import Data ngay
          </Link>
        </div>
      )}
    </div>
  );
}
