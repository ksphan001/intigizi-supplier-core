import React, { useState, useEffect, useCallback, useMemo } from 'react';
import apiClient from '../services/api';
import { Inbox, CheckCircle2, Truck, Timer, ClipboardList, Loader2, MapPin } from 'lucide-react';
import SupplierTrackingMap from '../components/SupplierTrackingMap.jsx';

function OrdersView() {
  const [orders, setOrders] = useState([]);
  const [supplierProfile, setSupplierProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const response = await apiClient.get('/marketplace_orders.php');
      setOrders(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Gagal memuat pesanan", err);
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const response = await apiClient.get('/supplier_profile.php');
      setSupplierProfile(response.data);
    } catch (err) {
      console.error("Gagal memuat profil supplier", err);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchOrders(), fetchProfile()]);
      setLoading(false);
    };
    loadData();
  }, [fetchOrders, fetchProfile]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    setActionLoading(true);
    try {
      const response = await apiClient.post('/marketplace_orders.php', {
        action: 'update_status',
        order_id: orderId,
        status: newStatus
      });
      // Refresh orders
      await fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || "Gagal memperbarui status pesanan.");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200"><Timer size={12} className="mr-1" /> Pending</span>;
      case 'processing':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200"><ClipboardList size={12} className="mr-1" /> Diproses</span>;
      case 'shipped':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200"><Truck size={12} className="mr-1" /> Dikirim</span>;
      case 'delivered':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200"><CheckCircle2 size={12} className="mr-1" /> Selesai</span>;
      default:
        return null;
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val);
  };

  // Titik koordinat gudang supplier
  const supplierCoords = useMemo(() => {
    if (supplierProfile?.latitude && supplierProfile?.longitude) {
      return {
        lat: parseFloat(supplierProfile.latitude),
        lng: parseFloat(supplierProfile.longitude)
      };
    }
    return null;
  }, [supplierProfile]);

  // Hitung jumlah order aktif yang belum selesai diantar
  const activeOrders = useMemo(() => {
    return orders.filter(o => ['pending', 'processing', 'shipped'].includes(o.status));
  }, [orders]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 className="animate-spin text-green-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-extrabold text-gray-800">Daftar Pesanan Masuk (B2B)</h3>
          <p className="text-xs text-gray-400 mt-1 font-semibold">Kelola pengadaan bahan makanan dapur mitra gizi secara profesional</p>
        </div>
        <span className="text-xs bg-green-50 text-green-700 px-3 py-1 rounded-full font-bold uppercase border border-green-200">
          Total: {orders.length} Order
        </span>
      </div>

      {/* PETA NAVIGASI MULTI-DROP SUPPLIER */}
      {supplierCoords && activeOrders.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin size={14} className="text-emerald-500" />
              Peta Rute Distribusi Multi-Dapur Kurir
            </h4>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
              {activeOrders.length} Dapur Penerima
            </span>
          </div>
          <div className="h-96 w-full rounded-2xl overflow-hidden border border-gray-200 relative shadow-inner">
            <SupplierTrackingMap supplierCoords={supplierCoords} orders={activeOrders} />
          </div>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="bg-white border rounded-2xl p-16 text-center shadow-sm">
          <Inbox size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-400 italic font-semibold">Belum ada pesanan masuk dari unit dapur.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-4 mb-4 gap-2">
                <div>
                  <h4 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                    <span>{order.po_code}</span>
                    {getStatusBadge(order.status)}
                  </h4>
                  <p className="text-xs text-gray-400 font-semibold mt-0.5">Dapur: <span className="text-gray-700 font-bold">{order.kitchen_name}</span> | Tgl: {new Date(order.created_at).toLocaleString('id-ID')}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 font-bold uppercase">Total Tagihan</p>
                  <p className="text-xl font-extrabold text-green-700">{formatCurrency(order.total_amount)}</p>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2 mb-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Item Belanja</p>
                <div className="divide-y divide-gray-200/50">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="py-1.5 flex justify-between text-xs">
                      <span className="font-semibold text-gray-700">{item.name}</span>
                      <span className="text-gray-500 font-bold">
                        {item.qty} {item.unit} x {formatCurrency(item.price)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Address */}
              <div className="text-xs text-gray-600 mb-6 bg-emerald-50/30 p-3 rounded-xl border border-emerald-100/50">
                <span className="font-bold text-gray-700">Alamat Pengiriman Dapur: </span>
                <span>{order.kitchen_address || "-"}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 border-t pt-4">
                {order.status === 'pending' && (
                  <button
                    onClick={() => handleUpdateStatus(order.id, 'processing')}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Terima & Proses Pesanan
                  </button>
                )}
                {order.status === 'processing' && (
                  <button
                    onClick={() => handleUpdateStatus(order.id, 'shipped')}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Kirim Pesanan
                  </button>
                )}
                {order.status === 'shipped' && (
                  <button
                    onClick={() => handleUpdateStatus(order.id, 'delivered')}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Selesaikan Pesanan
                  </button>
                )}
                {order.status === 'delivered' && (
                  <span className="text-xs font-bold text-gray-400 italic">Pesanan selesai diantar</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default OrdersView;
