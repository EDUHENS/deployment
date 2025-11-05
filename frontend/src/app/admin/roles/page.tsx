// src/app/admin/roles/page.tsx
'use client';

// Reason: Minimal admin UI to assign roles using backend APIs.
// - Lists users from backend
// - Toggle roles: admin, teacher, student
// - Protected by backend (email allowlist or admin role)

import { useEffect, useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';
import { assignUserRole, listUsers, removeUserRole } from '@/services/authApi';

type UserRow = {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  picture?: string;
  roles: string[];
};

const ALL_ROLES = ['admin', 'teacher', 'student'] as const;

export default function AdminRolesPage() {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.push('/?returnTo=/admin/roles');
      return;
    }
    (async () => {
      try {
        setLoading(true);
        const res = await listUsers();
        if (!res.ok) throw new Error(res.error || 'Failed to list users');
        setUsers(res.users);
      } catch (e: any) {
        setError(e.message || 'Failed to load users');
      } finally {
        setLoading(false);
      }
    })();
  }, [isLoading, user, router]);

  const toggleRole = async (u: UserRow, role: string, checked: boolean) => {
    try {
      setError(null);
      if (checked) {
        await assignUserRole(u.id, role);
      } else {
        await removeUserRole(u.id, role);
      }
      // refresh list
      const res = await listUsers();
      if (!res.ok) throw new Error(res.error || 'Failed to refresh');
      setUsers(res.users);
    } catch (e: any) {
      setError(e.message || 'Failed to update role');
    }
  };

  if (loading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Role Management</h1>
      <p className="text-sm text-gray-600 mb-6">Assign roles to users. Changes take effect immediately.</p>
      <div className="overflow-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">User</th>
              <th className="px-4 py-2 text-left">Email</th>
              {ALL_ROLES.map((r) => (
                <th key={r} className="px-4 py-2 text-left capitalize">{r}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="px-4 py-2 flex items-center gap-2">
                  {u.picture && <img src={u.picture} alt="" className="w-6 h-6 rounded-full" />}
                  <span>{u.first_name || ''} {u.last_name || ''}</span>
                </td>
                <td className="px-4 py-2">{u.email}</td>
                {ALL_ROLES.map((r) => {
                  const checked = u.roles.includes(r);
                  return (
                    <td key={r} className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => toggleRole(u, r, e.target.checked)}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

