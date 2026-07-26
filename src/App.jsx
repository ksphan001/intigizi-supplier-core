import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Import CSS
import './index.css';

import Login from './pages/Login';
import Register from './pages/Register';
import CatalogView from './pages/CatalogView';
import OrdersView from './pages/OrdersView';
import ProfileView from './pages/ProfileView';
import AdminSummaryView from './pages/AdminSummaryView';
import SupplierVerificationView from './pages/SupplierVerificationView';
import AllProductsView from './pages/AllProductsView';
import ConnectedKitchensView from './pages/ConnectedKitchensView';
import SupplierDashboardView from './pages/SupplierDashboardView';
import CommissionSettingsView from './pages/CommissionSettingsView';
import SupplierMapView from './pages/SupplierMapView';
import AdminUsersView from './pages/AdminUsersView';

import {
  LayoutDashboard,
  ShieldCheck,
  Layers,
  Link2,
  Store,
  ClipboardList,
  User,
  LogOut,
  ChevronDown,
  Percent,
  MapPin,
  Users
} from 'lucide-react';

function Dashboard() {
  const user = JSON.parse(localStorage.getItem('supplierUser') || '{}');
  const isAdmin = parseInt(user.role_id) === 8;

  const [activeTab, setActiveTab] = useState(isAdmin ? 'admin-dashboard' : 'supplier-dashboard');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [selectedAdminSupplier, setSelectedAdminSupplier] = useState(null);

  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'admin-dashboard':
        return 'Dashboard Consolidation Super Admin';
      case 'supplier-dashboard':
        return 'Dasbor Finansial & Analitik Toko';
      case 'verification':
        return 'Manajemen Daftar Supplier';
      case 'admin-products':
        return 'Katalog Produk Global';
      case 'connections':
        return 'Koneksi Dapur Terhubung';
      case 'commission-settings':
        return 'Pengaturan Komisi Platform';
      case 'supplier-map':
        return 'Peta Sebaran & Jangkauan Logistik Supplier';
      case 'admin-users':
        return 'Manajemen Akun User Supplier';
      case 'katalog':
        return 'Manajemen Katalog Bahan Baku';
      case 'orders':
        return 'Pesanan Masuk (B2B)';
      case 'profile':
        return 'Profil Supplier';
      default:
        return 'Portal B2B Supplier';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 p-6 flex-shrink-0">
        <h1 className="text-xl font-bold text-green-755 mb-8 flex items-center gap-2">
          <span className="text-green-700">Supplier Portal</span>
          <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full uppercase">B2B</span>
        </h1>
        <nav className="space-y-1">
          {isAdmin ? (
            <>
              <button
                onClick={() => setActiveTab('admin-dashboard')}
                className={`w-full flex items-center justify-start text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'admin-dashboard'
                    ? 'bg-green-50 text-green-700 border border-green-200/50 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-55 hover:text-green-700'
                }`}
              >
                <LayoutDashboard size={18} className="mr-3 flex-shrink-0" />
                <span>Dashboard Admin</span>
              </button>
              <button
                onClick={() => setActiveTab('verification')}
                className={`w-full flex items-center justify-start text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'verification'
                    ? 'bg-green-50 text-green-700 border border-green-200/50 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-55 hover:text-green-700'
                }`}
              >
                <ShieldCheck size={18} className="mr-3 flex-shrink-0" />
                <span>Daftar Supplier</span>
              </button>
              <button
                onClick={() => setActiveTab('admin-products')}
                className={`w-full flex items-center justify-start text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'admin-products'
                    ? 'bg-green-50 text-green-700 border border-green-200/50 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-55 hover:text-green-700'
                }`}
              >
                <Layers size={18} className="mr-3 flex-shrink-0" />
                <span>Katalog Produk Global</span>
              </button>
              <button
                onClick={() => setActiveTab('connections')}
                className={`w-full flex items-center justify-start text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'connections'
                    ? 'bg-green-50 text-green-700 border border-green-200/50 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-55 hover:text-green-700'
                }`}
              >
                <Link2 size={18} className="mr-3 flex-shrink-0" />
                <span>Koneksi Dapur Terhubung</span>
              </button>
              <button
                onClick={() => setActiveTab('commission-settings')}
                className={`w-full flex items-center justify-start text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'commission-settings'
                    ? 'bg-green-50 text-green-700 border border-green-200/50 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-55 hover:text-green-700'
                }`}
              >
                <Percent size={18} className="mr-3 flex-shrink-0" />
                <span>Komisi Platform</span>
              </button>
              <button
                onClick={() => setActiveTab('supplier-map')}
                className={`w-full flex items-center justify-start text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'supplier-map'
                    ? 'bg-green-50 text-green-700 border border-green-200/50 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-55 hover:text-green-700'
                }`}
              >
                <MapPin size={18} className="mr-3 flex-shrink-0" />
                <span>Peta Sebaran Supplier</span>
              </button>
              <button
                onClick={() => setActiveTab('admin-users')}
                className={`w-full flex items-center justify-start text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'admin-users'
                    ? 'bg-green-50 text-green-700 border border-green-200/50 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-55 hover:text-green-700'
                }`}
              >
                <Users size={18} className="mr-3 flex-shrink-0" />
                <span>User Supplier</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setActiveTab('supplier-dashboard')}
                className={`w-full flex items-center justify-start text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'supplier-dashboard'
                    ? 'bg-green-50 text-green-700 border border-green-200/50 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-55 hover:text-green-700'
                }`}
              >
                <LayoutDashboard size={18} className="mr-3 flex-shrink-0" />
                <span>Dasbor Toko</span>
              </button>
              <button
                onClick={() => setActiveTab('katalog')}
                className={`w-full flex items-center justify-start text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'katalog'
                    ? 'bg-green-50 text-green-700 border border-green-200/50 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-55 hover:text-green-700'
                }`}
              >
                <Store size={18} className="mr-3 flex-shrink-0" />
                <span>Katalog Saya</span>
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`w-full flex items-center justify-start text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'orders'
                    ? 'bg-green-50 text-green-700 border border-green-200/50 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-55 hover:text-green-700'
                }`}
              >
                <ClipboardList size={18} className="mr-3 flex-shrink-0" />
                <span>Pesanan Masuk</span>
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center justify-start text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'profile'
                    ? 'bg-green-50 text-green-700 border border-green-200/50 shadow-sm'
                    : 'text-gray-650 hover:bg-gray-55 hover:text-green-700'
                }`}
              >
                <User size={18} className="mr-3 flex-shrink-0" />
                <span>Profil Supplier</span>
              </button>
            </>
          )}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8 pb-4 border-b border-gray-200 relative">
          <h2 className="text-2xl font-bold text-gray-800">{getHeaderTitle()}</h2>
          
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer border border-gray-200"
            >
              <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-black text-sm">
                {user.supplier_name ? user.supplier_name.charAt(0).toUpperCase() : 'A'}
              </div>
              <ChevronDown size={14} className="text-gray-550" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-150 rounded-2xl shadow-xl py-2 z-50 animate-fade-in">
                <div className="px-4 py-2 border-b">
                  <p className="text-xs font-black text-gray-800 truncate">{user.supplier_name || 'Administrator'}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">{user.username || 'admin'}</p>
                </div>
                
                {!isAdmin && (
                  <button
                    onClick={() => {
                      setActiveTab('profile');
                      setShowProfileMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                  >
                    <User size={14} className="text-gray-400" />
                    <span>Profil Supplier</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    localStorage.clear();
                    window.location.href = '/login';
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 border-t cursor-pointer"
                >
                  <LogOut size={14} />
                  <span>Keluar Portal</span>
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          {activeTab === 'admin-dashboard' && <AdminSummaryView />}
          {activeTab === 'supplier-dashboard' && <SupplierDashboardView />}
          {activeTab === 'verification' && (
            <SupplierVerificationView
              preselectedSupplierName={selectedAdminSupplier}
              onClearPreselected={() => setSelectedAdminSupplier(null)}
            />
          )}
          {activeTab === 'admin-products' && (
            <AllProductsView
              onNavigateToSupplier={(supplierName) => {
                setSelectedAdminSupplier(supplierName);
                setActiveTab('verification');
              }}
            />
          )}
          {activeTab === 'connections' && <ConnectedKitchensView />}
          {activeTab === 'commission-settings' && <CommissionSettingsView />}
          {activeTab === 'supplier-map' && <SupplierMapView />}
          {activeTab === 'admin-users' && <AdminUsersView />}
          {activeTab === 'katalog' && <CatalogView />}
          {activeTab === 'orders' && <OrdersView />}
          {activeTab === 'profile' && <ProfileView />}
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
