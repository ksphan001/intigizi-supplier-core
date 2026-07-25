import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import { Store, ShieldCheck, ShieldAlert, Layers, Loader2 } from 'lucide-react';

function AdminSummaryView() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiClient.get('/admin_summary.php');
        setStats(response.data);
      } catch (err) {
        console.error("Gagal memuat statistik admin", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loader2 className="animate-spin text-green-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-150 p-6 rounded-2xl">
        <h3 className="text-lg font-bold text-green-800">Selamat datang, Super Admin B2B!</h3>
        <p className="text-xs text-green-700 mt-1 leading-relaxed">
          Di halaman konsolidasi ini, Anda dapat memantau jaringan supplier nasional, melakukan verifikasi akun supplier baru agar layak dipesan dapur, dan memantau katalog produk.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Card 1: Total Supplier */}
        <div className="bg-white border rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500">
            <Store size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase">Total Supplier</p>
            <p className="text-2xl font-extrabold text-gray-800">{stats?.total_suppliers || 0}</p>
          </div>
        </div>

        {/* Card 2: Verified Supplier */}
        <div className="bg-white border rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase">Terverifikasi</p>
            <p className="text-2xl font-extrabold text-green-700">{stats?.verified_suppliers || 0}</p>
          </div>
        </div>

        {/* Card 3: Pending Verification */}
        <div className="bg-white border rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <ShieldAlert size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase">Belum Verifikasi</p>
            <p className="text-2xl font-extrabold text-amber-700">{stats?.unverified_suppliers || 0}</p>
          </div>
        </div>

        {/* Card 4: Total Products */}
        <div className="bg-white border rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Layers size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase">Total Produk</p>
            <p className="text-2xl font-extrabold text-blue-700">{stats?.total_products || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminSummaryView;
