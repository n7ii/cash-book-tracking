import React, { useMemo, useState } from 'react';
import { Edit2, Trash, Eye, EyeOff } from 'lucide-react';

// use mock data
import { User, Role } from '../utils/mockUsers';
// use context
import { useUsers } from '../contexts/UsersContext'; 

const ManageUsers: React.FC = () => {
  const { users, addUser, updateUser, removeUser } = useUsers();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPwd, setShowPwd] = useState(false);

  // start with role 'collector'
  const [form, setForm] = useState<Partial<User> & { password?: string }>({
    role: 'collector',
  });

  // ------- Validation -------
  const usernameTaken = useMemo(() => {
    if (!form.username) return false;
    const lower = form.username.trim().toLowerCase();
    return users.some(
      (u) => u.username.toLowerCase() === lower && u.id !== editingId
    );
  }, [form.username, users, editingId]);

  const emailInvalid = useMemo(() => {
    if (!form.email) return false;
    // very light check
    return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
  }, [form.email]);

  const canSubmit = useMemo(() => {
    if (!form.firstName?.trim()) return false;
    if (!form.lastName?.trim()) return false;
    if (!form.role) return false;
    if (!form.username?.trim()) return false;
    if (usernameTaken) return false;
    if (emailInvalid) return false;
    // create: require password; edit: optional
    if (!editingId && !form.password?.trim()) return false;
    return true;
  }, [form, editingId, usernameTaken, emailInvalid]);

  // ------- Handlers -------
  function resetForm() {
    setForm({ role: 'collector' });
    setEditingId(null);
    setShowPwd(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    if (editingId) {
      updateUser(editingId, {
        firstName: form.firstName!.trim(),
        lastName: form.lastName!.trim(),
        role: form.role as Role, // 'admin' | 'collector'
        phone: form.phone?.trim() || undefined,
        email: form.email?.trim() || undefined,
        username: form.username!.trim(),
        ...(form.password?.trim() ? { password: form.password.trim() } : {}),
        address: form.address?.trim() || undefined,
      });
    } else {
      addUser({
        firstName: form.firstName!.trim(),
        lastName: form.lastName!.trim(),
        role: form.role as Role,
        phone: form.phone?.trim() || undefined,
        email: form.email?.trim() || undefined,
        username: form.username!.trim(),
        password: form.password!.trim(),
        address: form.address?.trim() || undefined,
      });
    }
    resetForm();
  }

  function handleEdit(u: User) {
    setEditingId(u.id);
    setForm({
      firstName: u.firstName,
      lastName: u.lastName,
      role: u.role,
      phone: u.phone,
      email: u.email,
      username: u.username,
      password: '',
      address: u.address,
    });
    setShowPwd(false);
  }

  function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    removeUser(id);
    if (editingId === id) resetForm();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
        <p className="text-gray-500">Insert/Delete/Update Employees (Demo)</p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First name *
            </label>
            <input
              className="w-full border rounded-lg p-2"
              value={form.firstName ?? ''}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last name *
            </label>
            <input
              className="w-full border rounded-lg p-2"
              value={form.lastName ?? ''}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role *
            </label>
            <select
              className="w-full border rounded-lg p-2"
              value={(form.role as Role) ?? 'collector'}
              onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
              required
            >
              <option value="admin">Admin</option>
              <option value="collector">Collector</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              className="w-full border rounded-lg p-2"
              value={form.phone ?? ''}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="020..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              className={`w-full border rounded-lg p-2 ${emailInvalid ? 'border-red-500' : ''}`}
              value={form.email ?? ''}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="name@example.com"
            />
            {emailInvalid && (
              <p className="text-sm text-red-600 mt-1">Invalid email format</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username *
            </label>
            <input
              className={`w-full border rounded-lg p-2 ${usernameTaken ? 'border-red-500' : ''}`}
              value={form.username ?? ''}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="username"
              required
            />
            {usernameTaken && (
              <p className="text-sm text-red-600 mt-1">Username is taken</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {editingId ? 'Password (if changing)' : 'Password *'}
            </label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                className="w-full border rounded-lg p-2 pr-10"
                value={form.password ?? ''}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={editingId ? 'Enter when changing password' : 'At least 6 characters'}
                required={!editingId}
                minLength={editingId ? 0 : 6}
              />
              <button
                type="button"
                onClick={() => setShowPwd((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500"
                tabIndex={-1}
              >
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <textarea
              rows={2}
              className="w-full border rounded-lg p-2"
              value={form.address ?? ''}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Village / City / District ..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          {editingId && (
            <button type="button" onClick={resetForm} className="px-4 py-2 border rounded-lg">
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={!canSubmit}
            className="px-4 py-2 rounded-lg text-white disabled:opacity-50 bg-blue-600 hover:bg-blue-700"
          >
            {editingId ? 'Save Changes' : 'Add User'}
          </button>
        </div>
      </form>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-left">
          <thead className="border-b text-gray-700">
            <tr>
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Username</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Phone</th>
              <th className="px-3 py-2">Address</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b hover:bg-gray-50">
                <td className="px-3 py-2 font-mono text-sm">{u.id}</td>
                <td className="px-3 py-2">{u.firstName} {u.lastName}</td>
                <td className="px-3 py-2 capitalize">{u.role}</td>
                <td className="px-3 py-2">{u.username}</td>
                <td className="px-3 py-2">{u.email || '-'}</td>
                <td className="px-3 py-2">{u.phone || '-'}</td>
                <td className="px-3 py-2">
                  <span className="line-clamp-1 max-w-[220px] block">
                    {u.address || '-'}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(u)}
                      className="inline-flex items-center px-3 py-1 border rounded-lg text-sm"
                    >
                      <Edit2 className="h-4 w-4 mr-1" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(u.id)}
                      className="inline-flex items-center px-3 py-1 border rounded-lg text-sm text-red-600"
                    >
                      <Trash className="h-4 w-4 mr-1" />
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={8} className="p-6 text-center text-gray-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageUsers;
