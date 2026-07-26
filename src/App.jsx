import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation, useNavigate, NavLink } from 'react-router-dom';

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
import AdminFinanceView from './pages/AdminFinanceView';
import SupplierFinanceView from './pages/SupplierFinanceView';

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
  Users,
  DollarSign
} from 'lucide-react';

function DashboardIndex() {
  const user = JSON.parse(localStorage.getItem('supplierUser') || '{}');
  const isAdmin = parseInt(user.role_id) === 8;
  return <Navigate to={isAdmin ? "/dashboard/admin" : "/dashboard/supplier-dashboard"} replace />;
}

// Wrapper for SupplierVerificationView to read location state passed during navigation
function SupplierVerificationViewWrapper() {
  const location = useLocation();
  const navigate = useNavigate();
  const preselectedSupplierName = location.state?.supplierName || null;

  const handleClearPreselected = () => {
    // Clear state in history to prevent re-expanding on refreshes
    navigate(location.pathname, { replace: true, state: {} });
  };

  return (
    <SupplierVerificationView
      preselectedSupplierName={preselectedSupplierName}
      onClearPreselected={handleClearPreselected}
    />
  );
}

// Wrapper for AllProductsView to handle navigation callback using useNavigate
function AllProductsViewWrapper() {
  const navigate = useNavigate();
  return (
    <AllProductsView
      onNavigateToSupplier={(supplierName) => {
        navigate('/dashboard/verification', { state: { supplierName } });
      }}
    />
  );
}

function DashboardLayout() {
  const user = JSON.parse(localStorage.getItem('supplierUser') || '{}');
  const isAdmin = parseInt(user.role_id) === 8;
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const location = useLocation();

  const getHeaderTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard/admin') return 'Dashboard';
    if (path === '/dashboard/supplier-dashboard') return 'Dashboard';
    if (path === '/dashboard/verification') return 'Manajemen Daftar Supplier';
    if (path === '/dashboard/admin-products') return 'Katalog Produk Global';
    if (path === '/dashboard/connections') return 'Koneksi Dapur Terhubung';
    if (path === '/dashboard/commission-settings') return 'Pengaturan Komisi Platform';
    if (path === '/dashboard/supplier-map') return 'Peta Sebaran & Jangkauan Logistik Supplier';
    if (path === '/dashboard/admin-users') return 'Manajemen Akun User Supplier';
    if (path === '/dashboard/finance') return 'Laporan Keuangan & Platform Fee Sentra IntiGizi';
    if (path === '/dashboard/katalog') return 'Manajemen Katalog Bahan Baku';
    if (path === '/dashboard/orders') return 'Pesanan Masuk (Sentra IntiGizi)';
    if (path === '/dashboard/supplier-finance') return 'Laporan Keuangan & Penjualan';
    if (path === '/dashboard/profile') return 'Profil Supplier';
    return 'Portal Sentra IntiGizi';
  };

  const navLinkClass = ({ isActive }) =>
    `w-full flex items-center justify-start text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
      isActive
        ? 'bg-gray-50 text-gray-800 border border-gray-150 shadow-sm'
        : 'text-gray-600 hover:bg-gray-50/50 hover:text-gray-800'
    }`;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 p-6 flex-shrink-0 flex flex-col justify-between">
        <div>
          {/* Logo Brand matching Aplikasi Dapur */}
          <div className="flex items-center gap-2 mb-8 pl-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-50 shadow-sm border border-green-100 flex-shrink-0 relative">
              <span className="text-green-600 font-black text-xs absolute -translate-x-1 -translate-y-1">S</span>
              <span className="text-orange-500 font-black text-xs absolute translate-x-1.5 translate-y-1">G</span>
              <div className="absolute top-1 left-4 w-1 h-1 rounded-full bg-green-500" />
            </div>
            <span className="text-base font-black tracking-tight text-gray-700">
              <span>Sentra</span>
              <span className="text-green-600 ml-1">IntiGizi</span>
            </span>
          </div>

          <nav className="space-y-4">
            {isAdmin ? (
              <>
                <div>
                  <NavLink to="/dashboard/admin" className={navLinkClass}>
                    <LayoutDashboard size={18} className="mr-3 flex-shrink-0 text-gray-400" />
                    <span>Dashboard</span>
                  </NavLink>
                </div>

                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-4 py-1.5 flex items-center justify-between">
                    <span>Operasional</span>
                    <ChevronDown size={12} className="text-gray-300" />
                  </div>
                  <div className="space-y-0.5 mt-1">
                    <NavLink to="/dashboard/verification" className={navLinkClass}>
                      <ShieldCheck size={18} className="mr-3 flex-shrink-0 text-gray-400" />
                      <span>Daftar Supplier</span>
                    </NavLink>
                    <NavLink to="/dashboard/admin-products" className={navLinkClass}>
                      <Layers size={18} className="mr-3 flex-shrink-0 text-gray-400" />
                      <span>Katalog Produk Global</span>
                    </NavLink>
                    <NavLink to="/dashboard/connections" className={navLinkClass}>
                      <Link2 size={18} className="mr-3 flex-shrink-0 text-gray-400" />
                      <span>Koneksi Dapur Terhubung</span>
                    </NavLink>
                    <NavLink to="/dashboard/supplier-map" className={navLinkClass}>
                      <MapPin size={18} className="mr-3 flex-shrink-0 text-gray-400" />
                      <span>Peta Sebaran Supplier</span>
                    </NavLink>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-4 py-1.5 flex items-center justify-between">
                    <span>Keuangan</span>
                    <ChevronDown size={12} className="text-gray-300" />
                  </div>
                  <div className="space-y-0.5 mt-1">
                    <NavLink to="/dashboard/commission-settings" className={navLinkClass}>
                      <Percent size={18} className="mr-3 flex-shrink-0 text-gray-400" />
                      <span>Komisi Platform</span>
                    </NavLink>
                    <NavLink to="/dashboard/finance" className={navLinkClass}>
                      <DollarSign size={18} className="mr-3 flex-shrink-0 text-gray-400" />
                      <span>Laporan Keuangan</span>
                    </NavLink>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-4 py-1.5 flex items-center justify-between">
                    <span>Administrasi</span>
                    <ChevronDown size={12} className="text-gray-300" />
                  </div>
                  <div className="space-y-0.5 mt-1">
                    <NavLink to="/dashboard/admin-users" className={navLinkClass}>
                      <Users size={18} className="mr-3 flex-shrink-0 text-gray-400" />
                      <span>User Supplier</span>
                    </NavLink>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <NavLink to="/dashboard/supplier-dashboard" className={navLinkClass}>
                    <LayoutDashboard size={18} className="mr-3 flex-shrink-0 text-gray-400" />
                    <span>Dashboard</span>
                  </NavLink>
                </div>

                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-4 py-1.5 flex items-center justify-between">
                    <span>Operasional</span>
                    <ChevronDown size={12} className="text-gray-300" />
                  </div>
                  <div className="space-y-0.5 mt-1">
                    <NavLink to="/dashboard/katalog" className={navLinkClass}>
                      <Store size={18} className="mr-3 flex-shrink-0 text-gray-400" />
                      <span>Katalog Saya</span>
                    </NavLink>
                    <NavLink to="/dashboard/orders" className={navLinkClass}>
                      <ClipboardList size={18} className="mr-3 flex-shrink-0 text-gray-400" />
                      <span>Pesanan Masuk</span>
                    </NavLink>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-4 py-1.5 flex items-center justify-between">
                    <span>Administrasi</span>
                    <ChevronDown size={12} className="text-gray-300" />
                  </div>
                  <div className="space-y-0.5 mt-1">
                    <NavLink to="/dashboard/profile" className={navLinkClass}>
                      <User size={18} className="mr-3 flex-shrink-0 text-gray-400" />
                      <span>Profil Supplier</span>
                    </NavLink>
                    <NavLink to="/dashboard/supplier-finance" className={navLinkClass}>
                      <DollarSign size={18} className="mr-3 flex-shrink-0 text-gray-400" />
                      <span>Laporan Keuangan</span>
                    </NavLink>
                  </div>
                </div>
              </>
            )}
          </nav>
        </div>

        {/* Bottom Profile Quick View */}
        <div className="pt-6 border-t border-gray-150">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-green-50 border border-green-200 text-green-700 flex items-center justify-center font-black text-sm">
              {user.supplier_name ? user.supplier_name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-gray-700 truncate">{user.supplier_name || 'Administrator'}</p>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider truncate mt-0.5">{user.username || 'admin'}</p>
            </div>
          </div>
        </div>
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
              <div className="w-8 h-8 rounded-full bg-green-55 text-green-700 flex items-center justify-center font-black text-sm">
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
                  <NavLink
                    to="/dashboard/profile"
                    onClick={() => setShowProfileMenu(false)}
                    className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-55 flex items-center gap-2 cursor-pointer"
                  >
                    <User size={14} className="text-gray-400" />
                    <span>Profil Supplier</span>
                  </NavLink>
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
          <Outlet />
        </div>
      </main>
    </div>
  );
}

// Protected Route Guard helper
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('supplierAuthToken');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Dashboard Nested Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardIndex />} />
          
          {/* Admin Sub-routes */}
          <Route path="admin" element={<AdminSummaryView />} />
          <Route path="verification" element={<SupplierVerificationViewWrapper />} />
          <Route path="admin-products" element={<AllProductsViewWrapper />} />
          <Route path="connections" element={<ConnectedKitchensView />} />
          <Route path="commission-settings" element={<CommissionSettingsView />} />
          <Route path="supplier-map" element={<SupplierMapView />} />
          <Route path="admin-users" element={<AdminUsersView />} />
          <Route path="finance" element={<AdminFinanceView />} />
          
          {/* Supplier Sub-routes */}
          <Route path="supplier-dashboard" element={<SupplierDashboardView />} />
          <Route path="katalog" element={<CatalogView />} />
          <Route path="orders" element={<OrdersView />} />
          <Route path="supplier-finance" element={<SupplierFinanceView />} />
          <Route path="profile" element={<ProfileView />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
