'use client';

import type { UserStats, MasteryBreakdown } from '@/lib/types';

interface ProgressStatsProps {
  stats: UserStats;
}

function MasteryBar({ mastery, total }: { mastery: MasteryBreakdown; total: number }) {
  if (total === 0) return null;
  const pct = (n: number) => Math.round((n / total) * 100);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-slate-500 dark:text-slate-400">Mức độ thành thạo</span>
      </div>
      <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-600 flex overflow-hidden">
        {mastery.mastered > 0 && (
          <div className="bg-emerald-500 h-full transition-all" style={{ width: `${pct(mastery.mastered)}%` }} title={`Thành thạo: ${mastery.mastered}`} />
        )}
        {mastery.learning > 0 && (
          <div className="bg-blue-500 h-full transition-all" style={{ width: `${pct(mastery.learning)}%` }} title={`Đang học: ${mastery.learning}`} />
        )}
        {mastery.weak > 0 && (
          <div className="bg-rose-500 h-full transition-all" style={{ width: `${pct(mastery.weak)}%` }} title={`Yếu: ${mastery.weak}`} />
        )}
        {mastery.not_studied > 0 && (
          <div className="bg-slate-300 dark:bg-slate-500 h-full transition-all" style={{ width: `${pct(mastery.not_studied)}%` }} title={`Chưa học: ${mastery.not_studied}`} />
        )}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Thành thạo ({mastery.mastered})</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> Đang học ({mastery.learning})</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Yếu ({mastery.weak})</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-500 inline-block" /> Chưa học ({mastery.not_studied})</span>
      </div>
    </div>
  );
}

export default function ProgressStats({ stats }: ProgressStatsProps) {
  const sections = [
    { key: 'MOJI', label: 'MOJI (文字)', icon: '🔤', color: 'rose', data: stats.by_section.MOJI },
    { key: 'GOI', label: 'GOI (語彙)', icon: '📚', color: 'amber', data: stats.by_section.GOI },
    { key: 'BUNPO', label: 'BUNPO (文法)', icon: '📐', color: 'emerald', data: stats.by_section.BUNPO },
  ];

  return (
    <div className="space-y-6">
      {/* Overview cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="text-3xl font-bold text-primary-600">{stats.total_questions}</div>
          <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Tổng câu hỏi</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-emerald-600">{stats.answered_questions}</div>
          <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Đã trả lời</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-amber-600">{stats.accuracy_rate}%</div>
          <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Độ chính xác</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-rose-600">{stats.starred_questions}</div>
          <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">⭐ Đánh dấu</div>
        </div>
      </div>

      {/* Global mastery */}
      {stats.mastery && (
        <div className="card">
          <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-3">🎯 Tổng quan Mastery</h3>
          <MasteryBar mastery={stats.mastery} total={stats.total_questions} />
        </div>
      )}

      {/* Section breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sections.map(section => (
          <div key={section.key} className="card">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{section.icon}</span>
              <h3 className="font-bold text-slate-700 dark:text-slate-200">{section.label}</h3>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-500 dark:text-slate-400">Tiến độ</span>
                  <span className="font-medium">
                    {section.data.answered}/{section.data.total}
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${
                      section.color === 'rose' ? 'bg-rose-500' :
                      section.color === 'amber' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{
                      width: `${section.data.total > 0 ? (section.data.answered / section.data.total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-500 dark:text-slate-400">Độ chính xác</span>
                  <span className="font-medium">{section.data.accuracy}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2.5">
                  <div
                    className="bg-primary-500 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${section.data.accuracy}%` }}
                  />
                </div>
              </div>

              {/* Per-section mastery bar */}
              {section.data.mastery && (
                <MasteryBar mastery={section.data.mastery} total={section.data.total} />
              )}

              <div className="text-xs text-slate-400 dark:text-slate-500">
                ✓ {section.data.correct} đúng / {section.data.answered} đã làm
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Level breakdown */}
      {Object.keys(stats.by_level).length > 0 && (
        <div className="card">
          <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4">📊 Theo cấp độ JLPT</h3>
          <div className="space-y-3">
            {Object.entries(stats.by_level)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([level, data]) => (
                <div key={level} className="flex items-center gap-4">
                  <span className="badge-level w-16 text-center">{level}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-500 dark:text-slate-400">
                        {data.answered}/{data.total} câu
                      </span>
                      <span className="font-medium">
                        {data.answered > 0
                          ? Math.round((data.correct / data.answered) * 100)
                          : 0}
                        % đúng
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                      <div
                        className="bg-primary-500 h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${data.total > 0 ? (data.answered / data.total) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
