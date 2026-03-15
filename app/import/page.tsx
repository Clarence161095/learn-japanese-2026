'use client';

import ImportForm from '@/components/ImportForm';

export default function ImportPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 page-enter">
      <h1 className="text-3xl font-bold text-slate-800 mb-2">📥 Import Data</h1>
      <p className="text-slate-500 mb-8">
        Import câu hỏi trắc nghiệm từ file JSON hoặc paste dữ liệu trực tiếp
      </p>
      <ImportForm />
    </div>
  );
}
