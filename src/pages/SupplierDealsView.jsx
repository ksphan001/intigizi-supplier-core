import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Save,
  X,
  Percent,
  Handshake,
  ShieldCheck,
  ShieldOff
} from 'lucide-react';

function SupplierDealsView() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editPct, setEditPct] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin_supplier_deals.php');
      setSuppliers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Gagal memuat data kesepakatan supplier', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSuppliers(); }, []);

  const handleSave = async (supplierId) => {
    setSaving(true);
    setSaveMsg(null);
    try {
      const pct = editPct === '' ? null : parseFloat(editPct);
      await apiClient.post('/admin_supplier_deals.php', {
        supplier_id: supplierId,
        custom_flat_fee_pct: pct
      });
      setSaveMsg({
        type: 'success',
        text: pct === null
          ? 'Kesepakatan komisi kustom supplier dihapus. Kembali ke tarif kategori global.'
          : `Flat rate komisi ${pct}% untuk supplier berhasil disimpan.`
      });
      setEditingId(null);
      fetchSuppliers();
    } catch (err) {
      setSaveMsg({ type: 'error', text: 'Gagal menyimpan kesepakatan komisi supplier.' });
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 4000);
    }
  };

  const hasCustom = (s) => s.custom_flat_fee_pct !== null && s.custom_flat_fee_pct !== undefined;

  return (
    <div className="space-y-6">
      {/* Header info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs text-blue-800 flex items-start gap-3">
        <Handshake size={18} className="flex-shrink-0 mt-0.5 text-blue-500" />
        <div>
          <p className="font-bold mb-1">Kesepakatan Komisi Flat Rate Per Supplier (Prioritas 2)</p>
          <p className="text-blue-700">Atur tarif komisi flat khusus untuk supplier tertentu. Tarif ini berlaku untuk <strong>semua item</strong> dari supplier tersebut, kecuali item yang sudah memiliki komisi kustom per-item (Prioritas 1). Biarkan kosong untuk menggunakan tarif kategori global (Prioritas 3).</p>
        </div>
      </div>

      {/* Notifikasi */}
      {saveMsg && (
        <div className={`px-4 py-3 rounded-xl text-sm font-semibold border flex items-center gap-2 ${saveMsg.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
          {saveMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {saveMsg.text}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-green-600" size={32} /></div>
      ) : (
        <div className="overflow-x-auto bg-white border border-gray-150 rounded-2xl">
          <table className="w-full text-sm text-left text-gray-600">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4">Nama Supplier</th>
                <th className="px-6 py-4">Status Verifikasi</th>
                <th className="px-6 py-4">Tarif Komisi Global</th>
                <th className="px-6 py-4">Flat Rate Kustom Supplier</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {suppliers.map((s) => {
                const isEditing = editingId === s.id;
                const customExists = hasCustom(s);

                return (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-800">{s.supplier_name}</td>
                    <td className="px-6 py-4">
                      {parseInt(s.is_verified) === 1 ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                          <ShieldCheck size={12} /> Terverifikasi
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-50 text-gray-500 border border-gray-200">
                          <ShieldOff size={12} /> Belum Diverifikasi
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-gray-500 italic">Berbeda per Kategori Produk</span>
                    </td>
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.5"
                              value={editPct}
                              onChange={(e) => setEditPct(e.target.value)}
                              placeholder="Kosong = hapus"
                              autoFocus
                              className="w-32 text-xs border border-blue-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">%</span>
                          </div>
                          <button
                            onClick={() => handleSave(s.id)}
                            disabled={saving}
                            className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 cursor-pointer transition-all"
                          >
                            {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1.5 rounded-lg bg-gray-50 text-gray-400 hover:bg-gray-100 border border-gray-200 cursor-pointer transition-all"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : customExists ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          <Percent size={10} />
                          {parseFloat(s.custom_flat_fee_pct).toFixed(1)}% Flat Rate Kustom
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Menggunakan tarif kategori global</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {!isEditing && (
                        <button
                          onClick={() => {
                            setEditingId(s.id);
                            setEditPct(customExists ? s.custom_flat_fee_pct : '');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 cursor-pointer transition-all shadow-sm"
                        >
                          <Edit2 size={12} />
                          {customExists ? 'Ubah Kesepakatan' : 'Buat Kesepakatan'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default SupplierDealsView;
