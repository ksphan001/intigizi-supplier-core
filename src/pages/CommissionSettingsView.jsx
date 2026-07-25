import React, { useState, useEffect } from 'react';
import { Save, Loader2, Settings, Percent } from 'lucide-react';

function CommissionSettingsView() {
  const [commissions, setCommissions] = useState({
    'Lauk Protein': 5,
    'Makanan Pokok': 2,
    'Sayuran & Lauk Nabati': 3,
    'Buah & Minuman': 4,
    'Lain-lain': 2
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('platformCommissions');
    if (saved) {
      try {
        setCommissions(JSON.parse(saved));
      } catch (err) {
        console.error("Gagal memuat data komisi", err);
      }
    }
  }, []);

  const handleChange = (cat, val) => {
    setCommissions(prev => ({
      ...prev,
      [cat]: Math.min(100, Math.max(0, parseInt(val) || 0))
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    
    setTimeout(() => {
      localStorage.setItem('platformCommissions', JSON.stringify(commissions));
      setMessage('Pengaturan komisi platform berhasil disimpan!');
      setSaving(false);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className="p-4 rounded-xl text-sm font-semibold border bg-green-50 border-green-200 text-green-700">
          {message}
        </div>
      )}

      <div className="bg-green-50 border border-green-150 p-6 rounded-2xl">
        <h3 className="text-lg font-bold text-green-800 flex items-center gap-2">
          <Settings size={20} />
          <span>Pengaturan Komisi Transaksi Marketplace</span>
        </h3>
        <p className="text-xs text-green-700 mt-1 leading-relaxed">
          Tentukan persentase potongan biaya komisi platform yang dikenakan untuk setiap transaksi pengadaan bahan makanan berdasarkan kategori pangan. Potongan komisi akan langsung memengaruhi nominal bersih (*net payout*) yang diterima supplier.
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-white border border-gray-150 p-6 rounded-2xl shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.keys(commissions).map((cat) => (
            <div key={cat} className="space-y-2 border p-4 rounded-xl bg-gray-50/50">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">{cat}</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={commissions[cat]}
                  onChange={(e) => handleChange(cat, e.target.value)}
                  className="input-style w-full pl-9 pr-12 font-bold"
                  required
                />
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">FEE</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <>
                <Save size={16} />
                <span>Simpan Pengaturan Komisi</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CommissionSettingsView;
