'use client';

import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-primary-50 to-sakura-50 dark:from-slate-900 dark:to-slate-800">
      <div className="card w-full max-w-md animate-bounce-in text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
          Đăng ký đã bị khoá
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mb-6">
          Việc đăng ký tài khoản mới chỉ được thực hiện bởi Admin.
          <br />
          Liên hệ Admin để được tạo tài khoản.
        </p>
        <Link href="/login" className="btn-primary inline-block">
          ← Quay lại Đăng nhập
        </Link>
      </div>
    </div>
  );
}
