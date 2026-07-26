import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import { Users, Plus, Edit2, Trash2, Key, Loader2, Save, X, Link } from 'lucide-react';

function AdminUsersView() {
  const [users, setUsers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal form states
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    email: '',
    password: '',
    supplier_id: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchUsersAndSuppliers = async () => {
    setLoading(true);
    setError('');
    try {
      const [resUsers, resSuppliers] = await Promise.all([
        apiClient.get('/admin_users.php'),
        apiClient.get('/admin_suppliers.php')
      ]);
      setUsers(Array.isArray(resUsers.data) ? resUsers.data : []);
      setSuppliers(Array.isArray(resSuppliers.data) ? resSuppliers.data : []);
    } catch (err) {
      setError('Gagal memuat daftar user & supplier.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndSuppliers();
  }, []);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      full_name: '',
      username: '',
      email: '',
      password: '',
      supplier_id: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setFormData({
      full_name: user.full_name || '',
      username: user.username || '',
      email: user.email || '',
      password: '', // Kosongkan, hanya diisi jika ingin mereset password
      supplier_id: user.supplier_id || ''
    });
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      if (editingUser) {
        // Edit Mode
        const payload = {
          id: editingUser.id,
          full_name: formData.full_name,
          username: formData.username,
          email: formData.email,
          supplier_id: formData.supplier_id || null
        };
        if (formData.password) {
          payload.password = formData.password;
        }
        await apiClient.put('/admin_users.php', payload);
        setSuccess('Kredensial akun supplier berhasil diperbarui.');
      } else {
        // Add Mode
        await apiClient.post('/admin_users.php', formData);
        setSuccess('Akun user supplier baru berhasil dibuat.');
      }
      setShowModal(false);
      fetchUsersAndSuppliers();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan akun user.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus akun user login ini?')) return;
    setError('');
    setSuccess('');
    try {
      await apiClient.delete('/admin_users.php', { data: { id } });
      setSuccess('Akun user supplier berhasil dihapus.');
      fetchUsersAndSuppliers();
    } catch (err) {
      setError('Gagal menghapus user supplier.');
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl text-sm font-semibold border bg-red-50 border-red-200 text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl text-sm font-semibold border bg-green-50 border-green-200 text-green-700">
          {success}
        </div>
      )}

      {/* Header and Add Button */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-800">Daftar Akun Kredensial Supplier</h3>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          <Plus size={16} />
          <span>Tambah Akun User</span>
        </button>
      </div>

      {/* OVERLAY MODAL FORM */}
      {showModal && (
        <div className="fixed top-0 left-0 right-0 bottom-0 w-screen h-screen m-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white border rounded-3xl p-6 shadow-2xl max-w-md w-full relative animate-scale-in">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X size={20} />
            </button>
            
            <h4 className="font-extrabold text-gray-800 text-base mb-6 flex items-center gap-2">
              <Users className="text-green-600" size={20} />
              <span>{editingUser ? 'Edit Akun Supplier' : 'Buat Akun Supplier Baru'}</span>
            </h4>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Nama Lengkap / Kontak</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="input-style w-full"
                  placeholder="Cth: Andi Pemasok"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 font-mono">Tautkan Perusahaan Supplier Terdaftar</label>
                <select
                  name="supplier_id"
                  value={formData.supplier_id}
                  onChange={handleChange}
                  className="input-style w-full text-xs py-2 bg-white"
                >
                  <option value="">-- Buat Profil Perusahaan Baru Otomatis --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.supplier_name} (ID: {s.id})</option>
                  ))}
                </select>
                <p className="text-[9px] text-gray-400 mt-1">Gunakan dropdown ini jika perusahaan supplier sudah ada dalam sistem.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="input-style w-full font-mono"
                  placeholder="Cth: andiprimasup"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Alamat Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input-style w-full"
                  placeholder="Cth: andi@supplier.com"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  {editingUser ? 'Reset Password (Opsional)' : 'Kata Sandi'}
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-style w-full font-mono"
                  placeholder={editingUser ? 'Kosongkan jika tidak ingin diubah' : 'Min. 6 karakter'}
                  required={!editingUser}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {submitting ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    <>
                      <Save size={14} />
                      <span>Simpan User</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Table List */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-green-600" size={32} /></div>
      ) : users.length === 0 ? (
        <div className="bg-white border rounded-2xl p-12 text-center text-gray-400 italic">
          Belum ada akun user supplier terdaftar.
        </div>
      ) : (
        <div className="overflow-x-auto bg-white border border-gray-150 rounded-2xl">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4">Nama Lengkap</th>
                <th className="px-6 py-4">Perusahaan Terkait</th>
                <th className="px-6 py-4">Username</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Tanggal Registrasi</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-55 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-800">{u.full_name}</td>
                  <td className="px-6 py-4 text-xs font-semibold text-gray-700">
                    {u.supplier_name ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 text-green-800 border border-green-200">
                        <Link size={10} />
                        {u.supplier_name}
                      </span>
                    ) : (
                      <span className="text-red-500 italic">Belum Tertaut</span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs font-semibold text-gray-600">{u.username}</td>
                  <td className="px-6 py-4 font-medium text-gray-700">{u.email}</td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(u.created_at).toLocaleDateString('id-ID', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    <button
                      onClick={() => handleOpenEdit(u)}
                      title="Edit / Reset Password"
                      className="p-1.5 text-blue-650 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100 cursor-pointer flex items-center gap-1"
                    >
                      <Edit2 size={13} />
                      <Key size={13} className="text-gray-400" />
                    </button>
                    <button
                      onClick={() => handleDelete(u.id)}
                      title="Hapus Akun User"
                      className="p-1.5 text-red-650 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100 cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminUsersView;
