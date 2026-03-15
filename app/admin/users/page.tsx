'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import type { UserRole } from '@/lib/types';

interface UserInfo {
  id: number;
  username: string;
  display_name: string;
  role: string;
  created_at: string;
}

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Create form
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('user');
  const [createLoading, setCreateLoading] = useState(false);
  
  // Edit state
  const [editingUser, setEditingUser] = useState<UserInfo | null>(null);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('user');
  const [editNewPassword, setEditNewPassword] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Backup
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupResult, setBackupResult] = useState<string | null>(null);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-200">Chỉ Admin</h2>
        <p className="text-slate-500 mt-2">Bạn không có quyền truy cập trang này.</p>
      </div>
    );
  }

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          displayName: newDisplayName || newUsername,
          role: newRole,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showMsg('success', `✅ Đã tạo user "${newUsername}"`);
        setNewUsername('');
        setNewPassword('');
        setNewDisplayName('');
        setNewRole('user');
        setShowCreateForm(false);
        loadUsers();
      } else {
        showMsg('error', data.error || 'Tạo user thất bại');
      }
    } catch {
      showMsg('error', 'Lỗi kết nối server');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditLoading(true);
    try {
      const body: Record<string, unknown> = {
        userId: editingUser.id,
        display_name: editDisplayName,
        role: editRole,
      };
      if (editNewPassword) body.new_password = editNewPassword;

      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        showMsg('success', `✅ Đã cập nhật user "${editingUser.username}"`);
        setEditingUser(null);
        setEditNewPassword('');
        loadUsers();
      } else {
        showMsg('error', data.error || 'Cập nhật thất bại');
      }
    } catch {
      showMsg('error', 'Lỗi kết nối server');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (u: UserInfo) => {
    if (!confirm(`Xác nhận xóa user "${u.username}"? Hành động này không thể hoàn tác.`)) return;
    try {
      const res = await fetch(`/api/admin/users?userId=${u.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        showMsg('success', `🗑 Đã xóa user "${u.username}"`);
        loadUsers();
      } else {
        showMsg('error', data.error || 'Xóa thất bại');
      }
    } catch {
      showMsg('error', 'Lỗi kết nối server');
    }
  };

  const openEdit = (u: UserInfo) => {
    setEditingUser(u);
    setEditDisplayName(u.display_name);
    setEditRole(u.role as UserRole);
    setEditNewPassword('');
  };

  const handleBackup = async () => {
    setBackupLoading(true);
    setBackupResult(null);
    try {
      const res = await fetch('/api/admin/backup');
      const data = await res.json();
      if (res.ok) {
        setBackupResult(`✅ ${data.message} | 📊 ${data.stats.questions} câu hỏi, ${data.stats.users} users`);
      } else {
        setBackupResult(`❌ ${data.error}`);
      }
    } catch {
      setBackupResult('❌ Lỗi kết nối server');
    } finally {
      setBackupLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': return <span className="badge bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">👑 Admin</span>;
      case 'collaborator': return <span className="badge bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">🤝 Collaborator</span>;
      default: return <span className="badge bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">👤 User</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 page-enter">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">👤 Quản lý Users</h1>
          <p className="text-slate-500 dark:text-slate-400">{users.length} tài khoản</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleBackup}
            disabled={backupLoading}
            className="btn-secondary text-sm !px-3 !py-2"
          >
            {backupLoading ? '⏳' : '💾'} Backup
          </button>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="btn-primary text-sm !px-3 !py-2"
          >
            ➕ Tạo user
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-4 px-4 py-2 rounded-lg text-sm animate-fade-in ${
          message.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
            : 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Backup result */}
      {backupResult && (
        <div className="mb-4 px-4 py-2 rounded-lg text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 animate-fade-in">
          {backupResult}
        </div>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <div className="card mb-6 animate-slide-up">
          <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4">➕ Tạo tài khoản mới</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={newUsername}
              onChange={e => setNewUsername(e.target.value)}
              className="input"
              placeholder="Tên đăng nhập *"
              required
              minLength={3}
            />
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="input"
              placeholder="Mật khẩu *"
              required
              minLength={4}
            />
            <input
              type="text"
              value={newDisplayName}
              onChange={e => setNewDisplayName(e.target.value)}
              className="input"
              placeholder="Tên hiển thị"
            />
            <select
              value={newRole}
              onChange={e => setNewRole(e.target.value as UserRole)}
              className="input"
            >
              <option value="user">👤 User</option>
              <option value="collaborator">🤝 Collaborator</option>
              <option value="admin">👑 Admin</option>
            </select>
            <div className="sm:col-span-2 flex gap-2">
              <button type="submit" disabled={createLoading} className="btn-primary text-sm !px-4 !py-2">
                {createLoading ? '⏳ Đang tạo...' : '✨ Tạo'}
              </button>
              <button type="button" onClick={() => setShowCreateForm(false)} className="btn-secondary text-sm !px-4 !py-2">
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setEditingUser(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-slate-800 dark:text-slate-100">✏️ Sửa user: {editingUser.username}</h3>
            </div>
            <form onSubmit={handleEdit} className="p-5 space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tên hiển thị</label>
                <input
                  type="text"
                  value={editDisplayName}
                  onChange={e => setEditDisplayName(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Vai trò</label>
                <select
                  value={editRole}
                  onChange={e => setEditRole(e.target.value as UserRole)}
                  className="input"
                >
                  <option value="user">👤 User</option>
                  <option value="collaborator">🤝 Collaborator</option>
                  <option value="admin">👑 Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Mật khẩu mới <span className="text-slate-400">(bỏ trống = giữ nguyên)</span>
                </label>
                <input
                  type="password"
                  value={editNewPassword}
                  onChange={e => setEditNewPassword(e.target.value)}
                  className="input"
                  placeholder="Nhập mật khẩu mới..."
                  minLength={4}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={editLoading} className="btn-primary text-sm !px-4 !py-2 flex-1">
                  {editLoading ? '⏳' : '💾'} Lưu
                </button>
                <button type="button" onClick={() => setEditingUser(null)} className="btn-secondary text-sm !px-4 !py-2">
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users List */}
      {loading ? (
        <div className="text-center py-12 animate-pulse">
          <p className="text-slate-500">Đang tải...</p>
        </div>
      ) : (
        <div className="space-y-2">
          {users.map(u => (
            <div key={u.id} className="card !p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold text-sm shrink-0">
                {u.display_name?.[0]?.toUpperCase() || u.username[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{u.display_name || u.username}</span>
                  {getRoleBadge(u.role)}
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500">
                  @{u.username} • {new Date(u.created_at).toLocaleDateString('vi-VN')}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => openEdit(u)}
                  className="p-2 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                  title="Sửa"
                >
                  ✏️
                </button>
                {u.id !== user.id && (
                  <button
                    onClick={() => handleDelete(u)}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                    title="Xóa"
                  >
                    🗑
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Role explanation */}
      <div className="mt-6 card bg-slate-50 dark:bg-slate-800/50">
        <h3 className="font-medium text-slate-700 dark:text-slate-300 mb-2">💡 Vai trò</h3>
        <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
          <li>• <strong>User</strong>: Học, làm quiz, xem tiến độ</li>
          <li>• <strong>Collaborator</strong>: Thêm quyền import data JSON</li>
          <li>• <strong>Admin</strong>: Toàn quyền, quản lý users, backup data</li>
        </ul>
      </div>
    </div>
  );
}
