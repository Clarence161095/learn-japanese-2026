'use client';

import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import type { UserRole } from '@/lib/types';

export default function AdminCreateUserPage() {
  const { user } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; error?: string; message?: string } | null>(null);

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-200">Chỉ Admin</h2>
        <p className="text-slate-500 mt-2">Bạn không có quyền truy cập trang này.</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          displayName: displayName || username,
          role,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ success: true, message: `✅ Đã tạo user "${username}" (${role})` });
        setUsername('');
        setPassword('');
        setDisplayName('');
        setRole('user');
      } else {
        setResult({ error: data.error || 'Tạo user thất bại' });
      }
    } catch {
      setResult({ error: 'Lỗi kết nối server' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8 page-enter">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">👤 Quản lý Users</h1>
      <p className="text-slate-500 dark:text-slate-400 mb-8">Tạo tài khoản mới cho người dùng</p>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Tên đăng nhập *
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="input"
              placeholder="Ít nhất 3 ký tự"
              required
              minLength={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Mật khẩu *
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="input"
              placeholder="Ít nhất 4 ký tự"
              required
              minLength={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Tên hiển thị
            </label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="input"
              placeholder="Tuỳ chọn"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Vai trò *
            </label>
            <select
              value={role}
              onChange={e => setRole(e.target.value as UserRole)}
              className="input"
            >
              <option value="user">👤 User - Chỉ học và làm quiz</option>
              <option value="collaborator">🤝 Collaborator - Được import data</option>
              <option value="admin">👑 Admin - Toàn quyền</option>
            </select>
          </div>

          {result && (
            <div className={`px-4 py-2 rounded-lg text-sm ${
              result.success
                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                : 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400'
            }`}>
              {result.message || result.error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? '⏳ Đang tạo...' : '✨ Tạo tài khoản'}
          </button>
        </form>
      </div>

      <div className="mt-6 card bg-slate-50 dark:bg-slate-800/50">
        <h3 className="font-medium text-slate-700 dark:text-slate-300 mb-2">💡 Vai trò</h3>
        <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
          <li>• <strong>User</strong>: Học, làm quiz, xem tiến độ</li>
          <li>• <strong>Collaborator</strong>: Thêm quyền import data JSON</li>
          <li>• <strong>Admin</strong>: Toàn quyền, quản lý users</li>
        </ul>
      </div>
    </div>
  );
}
