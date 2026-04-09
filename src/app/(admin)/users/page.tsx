'use client'

import { useEffect, useState } from 'react'
import type { StaffUser } from '@/types'

interface UserFormData {
  username: string
  password: string
  role: 'admin' | 'staff'
}

const EMPTY_FORM: UserFormData = { username: '', password: '', role: 'staff' }

export default function UsersPage() {
  const [users, setUsers] = useState<StaffUser[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<UserFormData>(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function fetchUsers() {
    setLoading(true)
    const res = await fetch('/api/users')
    const json = await res.json()
    setUsers(json.data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [])

  function openCreate() {
    setEditId(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setShowModal(true)
  }

  function openEdit(user: StaffUser) {
    setEditId(user.id)
    setForm({ username: user.username, password: '', role: user.role })
    setFormError('')
    setShowModal(true)
  }

  async function handleSubmit() {
    setFormError('')
    if (!form.username) { setFormError('Username is required'); return }
    if (!editId && !form.password) { setFormError('Password is required'); return }

    setSubmitting(true)
    const body: Record<string, unknown> = { username: form.username, role: form.role }
    if (form.password) body.password = form.password

    const res = await fetch(editId ? `/api/users/${editId}` : '/api/users', {
      method: editId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json()
    setSubmitting(false)

    if (!res.ok) { setFormError(json.error ?? 'Failed'); return }

    setShowModal(false)
    fetchUsers()
  }

  async function handleDeactivate(id: string, is_active: boolean) {
    const action = is_active ? 'deactivate' : 'activate'
    if (!confirm(`${action} this user?`)) return
    await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !is_active }),
    })
    fetchUsers()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Staff Users</h1>
        <button
          onClick={openCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition font-medium"
        >
          + New User
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-800">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Username</th>
              <th className="px-4 py-3 text-left font-semibold">Role</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Created</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Loading…</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No users found</td></tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-t border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold text-gray-900">{user.username}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {new Date(user.created_at).toLocaleDateString('th-TH')}
                  </td>
                  <td className="px-4 py-3 text-right space-x-3">
                    <button onClick={() => openEdit(user)} className="text-blue-500 hover:text-blue-700 text-xs font-medium">
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeactivate(user.id, user.is_active)}
                      className={`text-xs font-medium ${user.is_active ? 'text-yellow-600 hover:text-yellow-800' : 'text-green-600 hover:text-green-800'}`}
                    >
                      {user.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              {editId ? 'Edit User' : 'New User'}
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Username</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="w-full border border-gray-400 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  Password {editId && <span className="text-gray-500">(leave blank to keep)</span>}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full border border-gray-400 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as 'admin' | 'staff' })}
                  className="w-full border border-gray-400 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            {formError && (
              <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{formError}</p>
            )}

            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setShowModal(false)}
                className="text-sm px-4 py-2 rounded-lg border border-gray-400 text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="text-sm px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {submitting ? 'Saving…' : editId ? 'Save Changes' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
