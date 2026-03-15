'use client';

import { useState, useEffect } from 'react';
import KanjiWriter from '@/components/KanjiWriter';
import FuriganaText from '@/components/FuriganaText';
import { useLevel } from '@/components/LevelProvider';
import type { Question, MojiExplanation, KanjiFocus, RelatedWord } from '@/lib/types';

/** Merge two KanjiFocus entries with the same kanji, deduplicating related_words */
function mergeKanjiFocus(existing: KanjiFocus, incoming: KanjiFocus): KanjiFocus {
  const mergedWords = [...existing.related_words];
  const existingWordKeys = new Set(mergedWords.map(w => `${w.word}|${w.reading}`));

  for (const word of incoming.related_words) {
    const key = `${word.word}|${word.reading}`;
    if (!existingWordKeys.has(key)) {
      mergedWords.push(word);
      existingWordKeys.add(key);
    }
  }

  return {
    ...existing,
    related_words: mergedWords,
    // Merge readings (deduplicate)
    readings: {
      onyomi: Array.from(new Set([...(existing.readings?.onyomi || []), ...(incoming.readings?.onyomi || [])])),
      kunyomi: Array.from(new Set([...(existing.readings?.kunyomi || []), ...(incoming.readings?.kunyomi || [])])),
    },
  };
}

export default function MojiPracticePage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [allKanji, setAllKanji] = useState<KanjiFocus[]>([]);
  const [selectedKanji, setSelectedKanji] = useState<KanjiFocus | null>(null);
  const [loading, setLoading] = useState(true);
  const [practiceIndex, setPracticeIndex] = useState(0);
  const { level } = useLevel();

  useEffect(() => {
    const params = new URLSearchParams({ section: 'MOJI' });
    if (level && level !== 'ALL') params.set('level', level);

    fetch(`/api/questions?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        const qs = data.questions || [];
        setQuestions(qs);

        // Extract all kanji from questions, merging duplicates
        const kanjiMap = new Map<string, KanjiFocus>();
        qs.forEach((q: Question) => {
          const explanation = q.explanation as MojiExplanation;
          if (explanation.kanji_focus) {
            explanation.kanji_focus.forEach((kf: KanjiFocus) => {
              const existing = kanjiMap.get(kf.kanji);
              if (existing) {
                kanjiMap.set(kf.kanji, mergeKanjiFocus(existing, kf));
              } else {
                kanjiMap.set(kf.kanji, { ...kf });
              }
            });
          }
        });

        const kanjiList = Array.from(kanjiMap.values());
        setAllKanji(kanjiList);
        if (kanjiList.length > 0) {
          setSelectedKanji(kanjiList[0]);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [level]);

  const handleKanjiSelect = (kanji: KanjiFocus) => {
    setSelectedKanji(kanji);
    setPracticeIndex(allKanji.indexOf(kanji));
  };

  const handleNext = () => {
    const nextIdx = (practiceIndex + 1) % allKanji.length;
    setPracticeIndex(nextIdx);
    setSelectedKanji(allKanji[nextIdx]);
  };

  const handlePrev = () => {
    const prevIdx = (practiceIndex - 1 + allKanji.length) % allKanji.length;
    setPracticeIndex(prevIdx);
    setSelectedKanji(allKanji[prevIdx]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-center">
          <div className="text-5xl mb-3">✍️</div>
          <p className="text-slate-500">Đang tải Kanji...</p>
        </div>
      </div>
    );
  }

  if (allKanji.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="text-5xl mb-4">✍️</div>
        <h2 className="text-2xl font-bold text-slate-700 mb-2">Chưa có Kanji để luyện tập</h2>
        <p className="text-slate-500 mb-6">Import data MOJI để có Kanji tập viết.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 page-enter">
      <h1 className="text-3xl font-bold text-slate-800 mb-2">✍️ Luyện viết Kanji</h1>
      <p className="text-slate-500 mb-8">Tập viết chữ Hán theo thứ tự nét chuẩn</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Kanji list sidebar */}
        <div className="lg:col-span-1">
          <div className="card sticky top-20">
            <h3 className="font-bold text-slate-700 mb-3">
              📋 Danh sách Kanji ({allKanji.length})
            </h3>
            <div className="grid grid-cols-5 gap-2 max-h-96 overflow-y-auto">
              {allKanji.map((kanji, idx) => (
                <button
                  key={kanji.kanji}
                  onClick={() => handleKanjiSelect(kanji)}
                  className={`p-2 rounded-lg text-2xl font-bold transition-all ${
                    selectedKanji?.kanji === kanji.kanji
                      ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-300'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  {kanji.kanji}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main practice area */}
        <div className="lg:col-span-2">
          {selectedKanji && (
            <div className="space-y-6">
              {/* Navigation */}
              <div className="flex items-center justify-between">
                <button onClick={handlePrev} className="btn-ghost">
                  ← Trước
                </button>
                <span className="text-sm text-slate-500">
                  {practiceIndex + 1} / {allKanji.length}
                </span>
                <button onClick={handleNext} className="btn-ghost">
                  Sau →
                </button>
              </div>

              {/* Writer */}
              <div className="card flex justify-center">
                <KanjiWriter
                  key={selectedKanji.kanji}
                  character={selectedKanji.kanji}
                  size={280}
                  onComplete={handleNext}
                />
              </div>

              {/* Kanji info */}
              <div className="card">
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-5xl font-bold text-primary-700">{selectedKanji.kanji}</span>
                  <div>
                    {selectedKanji.sino_vietnamese && (
                      <div className="text-lg font-bold text-rose-600">[{selectedKanji.sino_vietnamese}]</div>
                    )}
                    <div className="text-slate-600">{selectedKanji.meanings?.vietnamese}</div>
                    <div className="text-sm text-slate-500">{selectedKanji.meanings?.english}</div>
                  </div>
                </div>

                {/* Readings */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedKanji.readings?.onyomi?.map((r, i) => (
                    <span key={`on-${i}`} className="px-3 py-1 bg-red-50 text-red-700 rounded-lg text-sm font-medium">
                      音読み: {r}
                    </span>
                  ))}
                  {selectedKanji.readings?.kunyomi?.map((r, i) => (
                    <span key={`kun-${i}`} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                      訓読み: {r}
                    </span>
                  ))}
                </div>

                {/* Related words */}
                {selectedKanji.related_words?.length > 0 && (
                  <div>
                    <h4 className="font-medium text-slate-700 mb-2">📝 Từ liên quan:</h4>
                    <div className="space-y-2">
                      {selectedKanji.related_words.map((word, idx) => (
                        <div key={idx} className="bg-slate-50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-primary-700">{word.word}</span>
                            <span className="text-sm text-slate-500">({word.reading})</span>
                            <span className="text-sm text-slate-600">- {word.meaning_vi}</span>
                          </div>
                          {word.examples_for_it_context?.slice(0, 1).map((ex, eIdx) => (
                            <div key={eIdx} className="pl-3 border-l-2 border-primary-200 text-sm mt-1">
                              <FuriganaText original={ex.original} withRuby={ex.with_ruby} />
                              <p className="text-slate-500 text-xs mt-0.5">{ex.vietnamese}</p>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
