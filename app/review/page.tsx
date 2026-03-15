'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import FuriganaText from '@/components/FuriganaText';
import type { Question } from '@/lib/types';

type ReviewTab = 'starred' | 'wrong' | 'mastered' | 'learning' | 'weak' | 'not_studied';

export default function ReviewPage() {
  const [activeTab, setActiveTab] = useState<ReviewTab>('starred');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<Record<string, { is_starred: boolean; is_correct: boolean; attempts: number; weight: number; consecutive_correct: number }>>({});

  useEffect(() => {
    // Load all progress
    fetch('/api/progress')
      .then(res => res.json())
      .then(data => {
        const progressMap: typeof progress = {};
        data.progress?.forEach((p: { question_id: string; is_starred: boolean; is_correct: boolean; attempts: number; weight: number; consecutive_correct: number }) => {
          progressMap[p.question_id] = p;
        });
        setProgress(progressMap);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeTab === 'starred') params.set('starred', 'true');
    else if (activeTab === 'wrong') params.set('wrong', 'true');
    else if (['mastered', 'learning', 'weak', 'not_studied'].includes(activeTab)) {
      params.set('mastery', activeTab);
    }

    fetch(`/api/questions?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        setQuestions(data.questions || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [activeTab]);

  const handleToggleStar = async (questionId: string) => {
    const current = progress[questionId]?.is_starred || false;
    setProgress(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], is_starred: !current },
    }));

    await fetch('/api/progress', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId, is_starred: !current }),
    });

    if (activeTab === 'starred' && current) {
      setQuestions(prev => prev.filter(q => q.id !== questionId));
    }
  };

  const getMasteryBadge = (weight: number) => {
    if (weight >= 3) return <span className="badge-mastered">✅ Thành thạo</span>;
    if (weight >= 1) return <span className="badge-learning">📖 Đang học</span>;
    if (weight === -1) return <span className="badge-weak">⚠️ Yếu</span>;
    return <span className="badge-not-studied">— Chưa học</span>;
  };

  const tabs: { key: ReviewTab; label: string; icon: string }[] = [
    { key: 'starred', label: 'Đánh dấu sao', icon: '⭐' },
    { key: 'wrong', label: 'Câu hay sai', icon: '❌' },
    { key: 'mastered', label: 'Thành thạo', icon: '✅' },
    { key: 'learning', label: 'Đang học', icon: '📖' },
    { key: 'weak', label: 'Yếu', icon: '⚠️' },
    { key: 'not_studied', label: 'Chưa học', icon: '📝' },
  ];

  const getSectionBadge = (section: string) => {
    switch (section) {
      case 'MOJI': return <span className="badge-moji">MOJI</span>;
      case 'GOI': return <span className="badge-goi">GOI</span>;
      case 'BUNPO': return <span className="badge-bunpo">BUNPO</span>;
      default: return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 page-enter">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">📖 Ôn tập</h1>
      <p className="text-slate-500 dark:text-slate-400 mb-6">Xem lại câu hỏi theo mức độ thành thạo</p>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-700'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Quiz mode link */}
      {questions.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-3">
          <Link
            href={`/quiz/all?${activeTab === 'starred' ? 'starred=true' : activeTab === 'wrong' ? 'wrong=true' : `mastery=${activeTab}`}`}
            className="btn-primary inline-block"
          >
            📝 Luyện tập {questions.length} câu
          </Link>
          <Link
            href={`/quiz/all?${activeTab === 'starred' ? 'starred=true' : activeTab === 'wrong' ? 'wrong=true' : `mastery=${activeTab}`}&random=true`}
            className="btn-secondary inline-block"
          >
            🎲 Random {questions.length} câu
          </Link>
        </div>
      )}

      {/* Questions list */}
      {loading ? (
        <div className="text-center py-12 animate-pulse">
          <p className="text-slate-500 dark:text-slate-400">Đang tải...</p>
        </div>
      ) : questions.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-3">
            {activeTab === 'starred' ? '⭐' : activeTab === 'mastered' ? '🎉' : activeTab === 'not_studied' ? '📝' : '✅'}
          </div>
          <h3 className="text-lg font-medium text-slate-700 dark:text-slate-200">
            {activeTab === 'starred' && 'Chưa có câu nào được đánh dấu sao'}
            {activeTab === 'wrong' && 'Tuyệt vời! Không có câu nào bạn trả lời sai'}
            {activeTab === 'mastered' && 'Chưa có câu nào thành thạo. Hãy tiếp tục luyện tập!'}
            {activeTab === 'learning' && 'Chưa có câu nào đang trong quá trình học'}
            {activeTab === 'weak' && 'Không có câu yếu. Tốt lắm!'}
            {activeTab === 'not_studied' && 'Bạn đã học hết tất cả câu hỏi! 🎉'}
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {activeTab === 'starred' && 'Nhấn ☆ trong khi làm quiz để đánh dấu câu quan trọng'}
            {activeTab === 'not_studied' && 'Import thêm data để có câu hỏi mới'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q, idx) => {
            const qProgress = progress[q.id];
            return (
              <div key={q.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <span className="text-sm text-slate-400 mt-1 w-8">{idx + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {getSectionBadge(q.chapter?.section || q.metadata?.section_type)}
                      <span className="badge-level">{q.book_level}</span>
                      {qProgress && getMasteryBadge(qProgress.weight)}
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        {q.chapter?.week} {q.chapter?.day}
                      </span>
                    </div>
                    <div className="text-lg">
                      <FuriganaText
                        original={q.question.content.original}
                        withRuby={q.question.content.with_red_highlight || q.question.content.with_ruby}
                      />
                    </div>
                    <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                      Đáp án: {q.options.find(o => o.is_correct)?.text}
                      {qProgress && qProgress.attempts > 0 && (
                        <span className="ml-3">
                          | 🔥 Streak: {qProgress.consecutive_correct} | Lần thử: {qProgress.attempts}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleStar(q.id)}
                    className={`text-2xl transition-all ${
                      progress[q.id]?.is_starred ? 'text-amber-400' : 'text-slate-300 hover:text-amber-300'
                    }`}
                  >
                    {progress[q.id]?.is_starred ? '★' : '☆'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
