'use client';

import { useState, useRef } from 'react';
import type { ImportResult } from '@/lib/types';

export default function ImportForm() {
  const [jsonText, setJsonText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'file' | 'text'>('file');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = async (data: string) => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      // Validate JSON
      let parsed;
      try {
        parsed = JSON.parse(data);
      } catch {
        setError('JSON không hợp lệ. Vui lòng kiểm tra lại cú pháp.');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });

      const responseData = await res.json();

      if (res.ok) {
        setResult(responseData);
        if (responseData.imported > 0) {
          setJsonText('');
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      } else {
        setError(responseData.error || 'Đã xảy ra lỗi khi import');
      }
    } catch {
      setError('Lỗi kết nối server. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setError('Vui lòng chọn file .json');
      return;
    }

    const text = await file.text();
    setJsonText(text);
    handleImport(text);
  };

  const handleTextSubmit = () => {
    if (!jsonText.trim()) {
      setError('Vui lòng nhập dữ liệu JSON');
      return;
    }
    handleImport(jsonText);
  };

  return (
    <div className="space-y-6">
      {/* Tab switcher */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('file')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'file'
              ? 'bg-primary-100 text-primary-700 border border-primary-200'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          📁 Upload File JSON
        </button>
        <button
          onClick={() => setActiveTab('text')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'text'
              ? 'bg-primary-100 text-primary-700 border border-primary-200'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          📝 Paste JSON
        </button>
      </div>

      {/* File upload */}
      {activeTab === 'file' && (
        <div className="card">
          <div
            className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-primary-400 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="text-4xl mb-3">📂</div>
            <p className="text-slate-600 font-medium">Nhấn để chọn file JSON hoặc kéo thả vào đây</p>
            <p className="text-sm text-slate-400 mt-1">Chấp nhận file .json</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>
      )}

      {/* Text input */}
      {activeTab === 'text' && (
        <div className="card">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Paste JSON data vào đây:
          </label>
          <textarea
            value={jsonText}
            onChange={e => setJsonText(e.target.value)}
            className="input font-mono text-sm h-64 resize-y"
            placeholder={`[
  {
    "id": "q_n1_001",
    "book_level": "N1",
    "chapter": { "week": "第1週", "day": "1日目", "section": "MOJI" },
    "question": {
      "number": 1,
      "type": "kanji_reading",
      "content": {
        "original": "税金を納めるのは...",
        "with_ruby": "<ruby>税金<rt>ぜいきん</rt></ruby>..."
      }
    },
    "options": [...],
    "correct_answer_id": 4,
    "explanation": {...},
    "metadata": {...}
  }
]`}
          />
          <button
            onClick={handleTextSubmit}
            disabled={loading || !jsonText.trim()}
            className="btn-primary mt-4"
          >
            {loading ? '⏳ Đang import...' : '📥 Import Data'}
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-4 animate-fade-in">
          <div className="flex items-center gap-2">
            <span>❌</span>
            <span className="font-medium">Lỗi</span>
          </div>
          <p className="mt-1 text-sm">{error}</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className={`border rounded-xl p-4 animate-fade-in ${
          result.imported > 0
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : 'bg-amber-50 border-amber-200 text-amber-700'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <span>{result.imported > 0 ? '✅' : '⚠️'}</span>
            <span className="font-medium">Kết quả Import</span>
          </div>
          <div className="text-sm space-y-1">
            <p>📥 Đã import: <strong>{result.imported}</strong> câu hỏi</p>
            {result.skipped > 0 && <p>⏭ Bỏ qua: {result.skipped}</p>}
            {result.filename && <p>💾 Backup: data/imported/{result.filename}</p>}
            {result.errors?.length > 0 && (
              <div className="mt-2">
                <p className="font-medium">Lỗi chi tiết:</p>
                <ul className="list-disc list-inside text-xs">
                  {result.errors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Help */}
      <div className="card bg-slate-50">
        <h4 className="font-medium text-slate-700 mb-2">💡 Hướng dẫn Import</h4>
        <ul className="text-sm text-slate-600 space-y-1">
          <li>• JSON có thể là mảng các câu hỏi hoặc object chứa key <code className="bg-slate-200 px-1 rounded">moji_data</code>, <code className="bg-slate-200 px-1 rounded">goi_data</code>, <code className="bg-slate-200 px-1 rounded">bunpo_data</code></li>
          <li>• Hoặc mixed array (giống file Input.json mẫu)</li>
          <li>• Mỗi câu hỏi cần có: id, question.content.original, options, correct_answer_id</li>
          <li>• Data sẽ tự động được lưu backup vào <code className="bg-slate-200 px-1 rounded">data/imported/</code></li>
          <li>• Nếu câu hỏi có cùng ID sẽ được cập nhật (không bị trùng)</li>
        </ul>
      </div>
    </div>
  );
}
