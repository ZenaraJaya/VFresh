'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { isValidPassword, MIN_PASSWORD_LENGTH } from '@/lib/password-rules';

type AdminRow = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
};

const emptyForm = { name: '', email: '', password: '' };

export default function AdminStaffPage() {
  const { data: session } = useSession();
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/admins');
      const data = await res.json();
      setAdmins(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load admins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (admin: AdminRow) => {
    setEditing(admin);
    setForm({
      name: admin.name ?? '',
      email: admin.email,
      password: '',
    });
    setOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editing
        ? `/api/admin/admins/${editing.id}`
        : '/api/admin/admins';
      const body: Record<string, string> = {
        name: form.name,
        email: form.email,
      };
      if (form.password) body.password = form.password;
      if (!editing) body.password = form.password;

      const res = await fetch(url, {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Save failed');
        return;
      }
      toast.success(editing ? 'Admin updated' : 'Admin created');
      setOpen(false);
      load();
    } catch {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (admin: AdminRow) => {
    if (admin.id === session?.user?.id) {
      toast.error('You cannot delete your own account');
      return;
    }
    if (!confirm(`Delete admin ${admin.email}?`)) return;
    const res = await fetch(`/api/admin/admins/${admin.id}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || 'Delete failed');
      return;
    }
    toast.success('Admin deleted');
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Admins</h1>
          <p className="text-sm text-neutral-500">
            Any admin can add or edit other staff accounts. There is no public
            admin signup.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600"
        >
          <Plus className="h-4 w-4" />
          Add admin
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-neutral-200 text-xs uppercase text-neutral-500 dark:border-neutral-800">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin, index) => (
                <tr
                  key={admin.id}
                  className="border-b border-neutral-100 dark:border-neutral-800"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium">
                      {admin.name || '—'}
                      {index === 0 && (
                        <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-700">
                          First
                        </span>
                      )}
                      {admin.id === session?.user?.id && (
                        <span className="ml-2 text-xs text-neutral-400">
                          (you)
                        </span>
                      )}
                    </p>
                  </td>
                  <td className="px-4 py-3">{admin.email}</td>
                  <td className="px-4 py-3 text-neutral-500">
                    {new Date(admin.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(admin)}
                        className="rounded-lg p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(admin)}
                        disabled={admin.id === session?.user?.id}
                        className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-30 dark:hover:bg-red-950"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <form
            onSubmit={save}
            className="w-full max-w-md space-y-3 rounded-2xl bg-white p-6 dark:bg-neutral-900"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {editing ? 'Edit admin' : 'Add admin'}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Name</label>
              <input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                className="w-full rounded-xl border border-neutral-200 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950"
                placeholder="Staff name"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                className="w-full rounded-xl border border-neutral-200 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">
                {editing ? 'New password (optional)' : 'Password'}
              </label>
              <input
                type="password"
                required={!editing}
                minLength={MIN_PASSWORD_LENGTH}
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
                className="w-full rounded-xl border border-neutral-200 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950"
                placeholder={`Min ${MIN_PASSWORD_LENGTH} characters`}
              />
              {form.password.length > 0 &&
                !isValidPassword(form.password) && (
                  <p className="text-xs text-amber-600">
                    Password must be at least {MIN_PASSWORD_LENGTH} characters.
                  </p>
                )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  saving ||
                  !form.email.trim() ||
                  (!editing && !isValidPassword(form.password)) ||
                  Boolean(
                    editing &&
                      form.password.length > 0 &&
                      !isValidPassword(form.password)
                  )
                }
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
                  saving ||
                  !form.email.trim() ||
                  (!editing && !isValidPassword(form.password)) ||
                  (editing &&
                    form.password.length > 0 &&
                    !isValidPassword(form.password))
                    ? 'cursor-not-allowed bg-neutral-200 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500'
                    : 'bg-emerald-500 text-white hover:bg-emerald-600'
                }`}
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
