'use client';

import { useState } from 'react';
import FuriganaText from './FuriganaText';
import KanjiWriter from './KanjiWriter';
import { useSettings } from './SettingsProvider';
import type { MojiExplanation, GoiExplanation, BunpoExplanation, Translations } from '@/lib/types';

interface ExplanationPanelProps {
  explanation: MojiExplanation | GoiExplanation | BunpoExplanation;
  section?: string;
}

/** Render English text with optional IPA ruby tags */
function EnglishText({ text, ipaText }: { text: string; ipaText?: string }) {
  const { settings } = useSettings();
  if (settings.showIPA && ipaText) {
    return (
      <span
        className="ipa-visible"
        dangerouslySetInnerHTML={{ __html: ipaText }}
      />
    );
  }
  return <>{text}</>;
}

export default function ExplanationPanel({ explanation, section }: ExplanationPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['translations']));
  const [kanjiModal, setKanjiModal] = useState<string | null>(null);

  const toggleSection = (key: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const isExpanded = (key: string) => expandedSections.has(key);
  const translations = 'translations' in explanation ? explanation.translations as Translations : null;

  return (
    <div className="explanation-section space-y-4">
      <h3 className="text-lg font-bold text-primary-700 dark:text-primary-300 flex items-center gap-2">
        💡 Giải thích chi tiết
      </h3>

      {/* Translations */}
      {translations && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
          <button
            onClick={() => toggleSection('translations')}
            className="w-full flex items-center justify-between text-left font-medium text-slate-700 dark:text-slate-200"
          >
            <span>🌐 Dịch nghĩa</span>
            <span className="text-xs">{isExpanded('translations') ? '▼' : '▶'}</span>
          </button>
          {isExpanded('translations') && (
            <div className="mt-3 space-y-2 text-sm">
              <p>
                <span className="font-medium text-blue-600">🇬🇧 EN:</span>{' '}
                <EnglishText text={translations.english} ipaText={translations.english_with_ipa} />
              </p>
              <p><span className="font-medium text-emerald-600">🇻🇳 VI:</span> {translations.vietnamese}</p>
            </div>
          )}
        </div>
      )}

      {/* MOJI: Kanji Focus */}
      {section === 'MOJI' && 'kanji_focus' in explanation && (explanation as MojiExplanation).kanji_focus && (
        <div className="space-y-3">
          {(explanation as MojiExplanation).kanji_focus.map((kanji, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
              <button
                onClick={() => toggleSection(`kanji-${idx}`)}
                className="w-full flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-bold text-primary-700 dark:text-primary-300">{kanji.kanji}</span>
                  <div>
                    <div className="font-medium text-slate-700 dark:text-slate-200">
                      {kanji.sino_vietnamese && (
                        <span className="text-rose-600 dark:text-rose-400">[{kanji.sino_vietnamese}]</span>
                      )}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      {kanji.meanings?.vietnamese || kanji.meanings?.english}
                    </div>
                  </div>
                  {/* Inline write practice button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setKanjiModal(kanji.kanji); }}
                    className="ml-2 px-2 py-1 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-medium hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors"
                    title="Tập viết"
                  >
                    ✍️ Viết
                  </button>
                </div>
                <span className="text-xs text-slate-400">{isExpanded(`kanji-${idx}`) ? '▼' : '▶'}</span>
              </button>

              {isExpanded(`kanji-${idx}`) && (
                <div className="mt-4 space-y-3 border-t border-slate-100 dark:border-slate-700 pt-3">
                  {/* Readings */}
                  <div className="flex flex-wrap gap-2">
                    {kanji.readings?.onyomi?.map((r, i) => (
                      <span key={`on-${i}`} className="px-2 py-1 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded text-sm">
                        音: {r}
                      </span>
                    ))}
                    {kanji.readings?.kunyomi?.map((r, i) => (
                      <span key={`kun-${i}`} className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-sm">
                        訓: {r}
                      </span>
                    ))}
                  </div>

                  {/* Related words */}
                  {kanji.related_words?.map((word, wIdx) => (
                    <div key={wIdx} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{word.word}</span>
                        <span className="text-sm text-slate-500 dark:text-slate-400">({word.reading})</span>
                        {word.is_special_reading && (
                          <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1 rounded">特別</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300">{word.meaning_vi}</p>
                      {word.examples_for_it_context?.slice(0, 2).map((ex, eIdx) => (
                        <div key={eIdx} className="mt-2 pl-3 border-l-2 border-primary-200 dark:border-primary-700 text-sm">
                          <FuriganaText original={ex.original} withRuby={ex.with_ruby} className="text-slate-800 dark:text-slate-200" />
                          {ex.english && (
                            <p className="text-blue-600 dark:text-blue-400 text-xs mt-0.5">
                              🇬🇧 <EnglishText text={ex.english} ipaText={ex.english_with_ipa} />
                            </p>
                          )}
                          <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">{ex.vietnamese}</p>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* GOI: Vocabulary Analysis */}
      {section === 'GOI' && (
        <>
          {'grammar_and_usage_context' in explanation && (explanation as GoiExplanation).grammar_and_usage_context && (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
              <h4 className="font-medium text-slate-700 dark:text-slate-200 mb-2">📖 Giải thích cách dùng</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {(explanation as GoiExplanation).grammar_and_usage_context}
              </p>
            </div>
          )}

          {'vocabulary_analysis' in explanation && (explanation as GoiExplanation).vocabulary_analysis?.map((vocab, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
              <button
                onClick={() => toggleSection(`vocab-${idx}`)}
                className="w-full flex items-center justify-between text-left"
              >
                <div>
                  <span className="font-bold text-lg text-primary-700 dark:text-primary-300">{vocab.word}</span>
                  {vocab.kanji_writing && vocab.kanji_writing !== vocab.word && (
                    <span className="ml-2 text-slate-500 dark:text-slate-400">({vocab.kanji_writing})</span>
                  )}
                  <span className="ml-2 text-sm text-slate-600 dark:text-slate-300">{vocab.meaning_vi}</span>
                </div>
                <span className="text-xs text-slate-400">{isExpanded(`vocab-${idx}`) ? '▼' : '▶'}</span>
              </button>

              {isExpanded(`vocab-${idx}`) && (
                <div className="mt-3 space-y-2 border-t border-slate-100 dark:border-slate-700 pt-3">
                  <p className="text-sm text-blue-600 dark:text-blue-400">🇬🇧 {vocab.meaning_en}</p>
                  {vocab.usage_notes && (
                    <p className="text-sm text-slate-600 dark:text-slate-300 bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
                      📝 {vocab.usage_notes}
                    </p>
                  )}

                  {/* Kanji components */}
                  {vocab.kanji_components?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {vocab.kanji_components.map((kc, kcIdx) => (
                        <span key={kcIdx} className="px-2 py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded text-sm inline-flex items-center gap-1">
                          <button
                            onClick={() => setKanjiModal(kc.kanji)}
                            className="hover:scale-110 transition-transform"
                            title={`Tập viết ${kc.kanji}`}
                          >
                            ✍️
                          </button>
                          {kc.kanji} [{kc.sino_vietnamese}] - {kc.meanings}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Antonyms */}
                  {vocab.antonyms?.length > 0 && (
                    <div className="text-sm">
                      <span className="font-medium text-slate-600 dark:text-slate-300">↔ Trái nghĩa: </span>
                      {vocab.antonyms.map((ant, aIdx) => (
                        <span key={aIdx} className="inline-block mr-2 px-2 py-1 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 rounded">
                          {ant.word} ({ant.meaning_vi})
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Examples */}
                  {vocab.examples_for_it_context?.slice(0, 2).map((ex, eIdx) => (
                    <div key={eIdx} className="pl-3 border-l-2 border-primary-200 dark:border-primary-700 text-sm">
                      <FuriganaText original={ex.original} withRuby={ex.with_ruby} className="text-slate-800 dark:text-slate-200" />
                      {ex.english && (
                        <p className="text-blue-600 dark:text-blue-400 text-xs mt-0.5">
                          🇬🇧 <EnglishText text={ex.english} ipaText={ex.english_with_ipa} />
                        </p>
                      )}
                      <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">{ex.vietnamese}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {/* BUNPO: Grammar Breakdown */}
      {section === 'BUNPO' && (
        <>
          {'general_explanation' in explanation && (explanation as BunpoExplanation).general_explanation && (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
              <h4 className="font-medium text-slate-700 dark:text-slate-200 mb-2">📖 Giải thích tổng quan</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {(explanation as BunpoExplanation).general_explanation}
              </p>
            </div>
          )}

          {'grammar_breakdown' in explanation && (explanation as BunpoExplanation).grammar_breakdown?.map((grammar, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
              <button
                onClick={() => toggleSection(`grammar-${idx}`)}
                className="w-full flex items-center justify-between text-left"
              >
                <div>
                  <span className="font-bold text-lg text-emerald-700 dark:text-emerald-400">{grammar.grammar_pattern}</span>
                  <span className="ml-2 text-sm text-slate-600 dark:text-slate-300">{grammar.meaning_vi}</span>
                </div>
                <span className="text-xs text-slate-400">{isExpanded(`grammar-${idx}`) ? '▼' : '▶'}</span>
              </button>

              {isExpanded(`grammar-${idx}`) && (
                <div className="mt-3 space-y-3 border-t border-slate-100 dark:border-slate-700 pt-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                      <span className="font-medium text-blue-600 dark:text-blue-400">🇬🇧 </span>{grammar.meaning_en}
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
                      <span className="font-medium">📐 Cấu tạo: </span>{grammar.formation}
                    </div>
                  </div>

                  {grammar.usage_notes && (
                    <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 p-2 rounded">
                      📝 {grammar.usage_notes}
                    </p>
                  )}

                  {/* Textbook examples */}
                  {grammar.textbook_examples?.length > 0 && (
                    <div>
                      <h5 className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">📚 Ví dụ từ sách:</h5>
                      {grammar.textbook_examples.map((ex, eIdx) => (
                        <div key={eIdx} className="pl-3 border-l-2 border-amber-200 dark:border-amber-700 text-sm mb-2">
                          <FuriganaText original={ex.original} withRuby={ex.with_ruby} className="text-slate-800 dark:text-slate-200" />
                          {ex.english && (
                            <p className="text-blue-600 dark:text-blue-400 text-xs mt-0.5">
                              🇬🇧 <EnglishText text={ex.english} ipaText={ex.english_with_ipa} />
                            </p>
                          )}
                          <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">{ex.vietnamese}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* IT examples */}
                  {grammar.it_context_examples?.length > 0 && (
                    <div>
                      <h5 className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">💻 Ví dụ trong IT:</h5>
                      {grammar.it_context_examples.slice(0, 3).map((ex, eIdx) => (
                        <div key={eIdx} className="pl-3 border-l-2 border-emerald-200 dark:border-emerald-700 text-sm mb-2">
                          <FuriganaText original={ex.original} withRuby={ex.with_ruby} className="text-slate-800 dark:text-slate-200" />
                          {ex.english && (
                            <p className="text-blue-600 dark:text-blue-400 text-xs mt-0.5">
                              🇬🇧 <EnglishText text={ex.english} ipaText={ex.english_with_ipa} />
                            </p>
                          )}
                          <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">{ex.vietnamese}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {/* Kanji Writer Modal */}
      {kanjiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setKanjiModal(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">✍️ Tập viết: {kanjiModal}</h3>
              <button onClick={() => setKanjiModal(null)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500">✕</button>
            </div>
            <KanjiWriter key={kanjiModal} character={kanjiModal} size={250} />
          </div>
        </div>
      )}
    </div>
  );
}
