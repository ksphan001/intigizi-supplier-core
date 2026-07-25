import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import { Plus, Edit2, Trash2, Loader2, Save, X } from 'lucide-react';

function CatalogView() {
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form states for adding/editing
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    ingredient_name: '',
    base_price: '',
    daily_capacity: '',
    unit_symbol: 'kg',
    tier_qty: '',
    tier_price: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchCatalog = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.get('/supplier_ingredients.php');
      setCatalog(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError('Gagal memuat katalog bahan baku.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      ingredient_name: '',
      base_price: '',
      daily_capacity: '',
      unit_symbol: 'kg',
      tier_qty: '',
      tier_price: ''
    });
    setShowForm(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      ingredient_name: item.ingredient_name || '',
      base_price: item.base_price || '',
      daily_capacity: item.daily_capacity || '',
      unit_symbol: item.unit_symbol || 'kg',
      tier_qty: item.tier_qty || '',
      tier_price: item.tier_price || ''
    });
    setShowForm(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        ...formData,
        id: editingItem ? editingItem.id : undefined
      };
      await apiClient.post('/supplier_ingredients.php', payload);
      setShowForm(false);
      fetchCatalog();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan bahan baku.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus bahan baku ini dari katalog?')) return;
    try {
      await apiClient.delete('/supplier_ingredients.php', { data: { id } });
      fetchCatalog();
    } catch (err) {
      setError('Gagal menghapus bahan baku.');
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl text-sm font-semibold border bg-red-50 border-red-200 text-red-700">
          {error}
        </div>
      )}

      {/* Header and Add Button */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-800">Daftar Bahan Baku Tersedia</h3>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <Plus size={16} />
          <span>Tambah Bahan Baku</span>
        </button>
      </div>

      {/* Form Card Overlay/Panel */}
      {showForm && (
        <div className="bg-gray-50 border border-gray-200 p-6 rounded-2xl relative shadow-sm mb-6 space-y-4">
          <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
          <h4 className="font-bold text-gray-800 text-sm">{editingItem ? 'Edit Bahan Baku' : 'Tambah Bahan Baku Baru'}</h4>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Nama Bahan</label>
                <input
                  type="text"
                  name="ingredient_name"
                  value={formData.ingredient_name}
                  onChange={handleChange}
                  className="input-style w-full bg-white text-sm"
                  placeholder="Cth: Telur Ayam"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Harga Dasar (Rp)</label>
                <input
                  type="number"
                  name="base_price"
                  value={formData.base_price}
                  onChange={handleChange}
                  className="input-style w-full bg-white text-sm"
                  placeholder="Cth: 24000"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Kapasitas Harian</label>
                <div className="relative">
                  <input
                    type="number"
                    name="daily_capacity"
                    value={formData.daily_capacity}
                    onChange={handleChange}
                    className="input-style w-full bg-white text-sm pr-12"
                    placeholder="Cth: 100"
                    required
                  />
                  <select
                    name="unit_symbol"
                    value={formData.unit_symbol}
                    onChange={handleChange}
                    className="absolute right-1 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500 bg-transparent border-0 focus:ring-0 focus:outline-none"
                  >
                    <option value="kg">kg</option>
                    <option value="butir">butir</option>
                    <option value="pcs">pcs</option>
                    <option value="liter">liter</option>
                    <option value="ikat">ikat</option>
                    <option value="buah">buah</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end border-t pt-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Minimal Grosir (Opsional)</label>
                <input
                  type="number"
                  name="tier_qty"
                  value={formData.tier_qty}
                  onChange={handleChange}
                  className="input-style w-full bg-white text-sm"
                  placeholder="Cth: 50"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Harga Grosir (Rp)</label>
                <input
                  type="number"
                  name="tier_price"
                  value={formData.tier_price}
                  onChange={handleChange}
                  className="input-style w-full bg-white text-sm"
                  placeholder="Cth: 22000"
                />
              </div>
              <div className="md:col-span-2 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="py-2 px-6 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? <Loader2 className="animate-spin" size={16} /> : <><Save size={14} /><span>Simpan Bahan</span></>}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Catalog Table list */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-green-600" size={32} /></div>
      ) : catalog.length === 0 ? (
        <div className="bg-white border rounded-2xl p-12 text-center text-gray-400 italic">
          Katalog Anda kosong. Mulai tambahkan bahan makanan yang sanggup Anda supply.
        </div>
      ) : (
        <div className="overflow-x-auto bg-white border border-gray-150 rounded-2xl">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4">Nama Bahan</th>
                <th className="px-6 py-4">Harga Dasar</th>
                <th className="px-6 py-4">Diskon Grosir (Tier)</th>
                <th className="px-6 py-4">Kapasitas Pasokan Harian</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {catalog.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-800">{item.ingredient_name}</td>
                  <td className="px-6 py-4 font-semibold text-gray-750">{formatCurrency(item.base_price)} / {item.unit_symbol}</td>
                  <td className="px-6 py-4 text-xs font-semibold text-emerald-700">
                    {parseFloat(item.tier_qty) > 0 ? (
                      <span>{formatCurrency(item.tier_price)} / {item.unit_symbol} <span className="text-[10px] text-gray-400 font-bold block">(Min. {parseFloat(item.tier_qty).toLocaleString('id-ID')} {item.unit_symbol})</span></span>
                    ) : (
                      <span className="text-gray-400 italic font-normal">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600 font-medium">
                    {parseFloat(item.daily_capacity).toLocaleString('id-ID')} {item.unit_symbol} / Hari
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                    >
                      <Trash2 size={15} />
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

export default CatalogView;
