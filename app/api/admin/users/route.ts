import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers, updateUser, updateUserPassword, deleteUser, getUserById } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import type { UserRole } from '@/lib/types';

// GET: List all users
export async function GET(request: NextRequest) {
  try {
    const userRole = request.headers.get('x-user-role');
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const users = getAllUsers();
    return NextResponse.json({
      users: users.map(u => ({
        id: u.id,
        username: u.username,
        display_name: u.display_name,
        role: u.role,
        created_at: u.created_at,
      })),
    });
  } catch (error) {
    console.error('List users error:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}

// PUT: Update user (role, display_name, reset password)
export async function PUT(request: NextRequest) {
  try {
    const userRole = request.headers.get('x-user-role');
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId, display_name, role, new_password } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId là bắt buộc' }, { status: 400 });
    }

    const existingUser = getUserById(userId);
    if (!existingUser) {
      return NextResponse.json({ error: 'User không tồn tại' }, { status: 404 });
    }

    // Validate role
    if (role) {
      const validRoles: UserRole[] = ['admin', 'collaborator', 'user'];
      if (!validRoles.includes(role)) {
        return NextResponse.json({ error: 'Role không hợp lệ' }, { status: 400 });
      }
    }

    // Update fields
    const updates: { display_name?: string; role?: string } = {};
    if (display_name !== undefined) updates.display_name = display_name;
    if (role !== undefined) updates.role = role;

    if (Object.keys(updates).length > 0) {
      updateUser(userId, updates);
    }

    // Reset password if provided
    if (new_password) {
      if (new_password.length < 4) {
        return NextResponse.json({ error: 'Mật khẩu mới phải có ít nhất 4 ký tự' }, { status: 400 });
      }
      const hash = hashPassword(new_password);
      updateUserPassword(userId, hash);
    }

    return NextResponse.json({ success: true, message: 'Cập nhật thành công' });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}

// DELETE: Delete user
export async function DELETE(request: NextRequest) {
  try {
    const userRole = request.headers.get('x-user-role');
    const currentUserId = parseInt(request.headers.get('x-user-id') || '0');
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = parseInt(searchParams.get('userId') || '0');

    if (!userId) {
      return NextResponse.json({ error: 'userId là bắt buộc' }, { status: 400 });
    }

    // Prevent self-deletion
    if (userId === currentUserId) {
      return NextResponse.json({ error: 'Không thể xóa chính mình' }, { status: 400 });
    }

    const existingUser = getUserById(userId);
    if (!existingUser) {
      return NextResponse.json({ error: 'User không tồn tại' }, { status: 404 });
    }

    deleteUser(userId);
    return NextResponse.json({ success: true, message: `Đã xóa user "${existingUser.username}"` });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
