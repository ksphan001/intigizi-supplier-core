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
    if (path.includes('/dashboard/admin')) return 'Dashboard Consolidation Super Admin';
    if (path.includes('/dashboard/supplier-dashboard')) return 'Dasbor Finansial & Analitik Toko';
    if (path.includes('/dashboard/verification')) return 'Manajemen Daftar Supplier';
    if (path.includes('/dashboard/admin-products')) return 'Katalog Produk Global';
    if (path.includes('/dashboard/connections')) return 'Koneksi Dapur Terhubung';
    if (path.includes('/dashboard/commission-settings')) return 'Pengaturan Komisi Platform';
    if (path.includes('/dashboard/supplier-map')) return 'Peta Sebaran & Jangkauan Logistik Supplier';
    if (path.includes('/dashboard/admin-users')) return 'Manajemen Akun User Supplier';
    if (path.includes('/dashboard/katalog')) return 'Manajemen Katalog Bahan Baku';
    if (path.includes('/dashboard/orders')) return 'Pesanan Masuk (B2B)';
    if (path.includes('/dashboard/profile')) return 'Profil Supplier';
    return 'Portal B2B Supplier';
  };

  const navLinkClass = ({ isActive }) =>
    `w-full flex items-center justify-start text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
      isActive
        ? 'bg-green-50 text-green-700 border border-green-200/50 shadow-sm'
        : 'text-gray-650 hover:bg-gray-55 hover:text-green-700'
    }`;

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
              <NavLink to="/dashboard/admin" className={navLinkClass}>
                <LayoutDashboard size={18} className="mr-3 flex-shrink-0" />
                <span>Dashboard Admin</span>
              </NavLink>
              <NavLink to="/dashboard/verification" className={navLinkClass}>
                <ShieldCheck size={18} className="mr-3 flex-shrink-0" />
                <span>Daftar Supplier</span>
              </NavLink>
              <NavLink to="/dashboard/admin-products" className={navLinkClass}>
                <Layers size={18} className="mr-3 flex-shrink-0" />
                <span>Katalog Produk Global</span>
              </NavLink>
              <NavLink to="/dashboard/connections" className={navLinkClass}>
                <Link2 size={18} className="mr-3 flex-shrink-0" />
                <span>Koneksi Dapur Terhubung</span>
              </NavLink>
              <NavLink to="/dashboard/commission-settings" className={navLinkClass}>
                <Percent size={18} className="mr-3 flex-shrink-0" />
                <span>Komisi Platform</span>
              </NavLink>
              <NavLink to="/dashboard/supplier-map" className={navLinkClass}>
                <MapPin size={18} className="mr-3 flex-shrink-0" />
                <span>Peta Sebaran Supplier</span>
              </NavLink>
              <NavLink to="/dashboard/admin-users" className={navLinkClass}>
                <Users size={18} className="mr-3 flex-shrink-0" />
                <span>User Supplier</span>
              </NavLink>
            </>
          ) : (
            <>
              <NavLink to="/dashboard/supplier-dashboard" className={navLinkClass}>
                <LayoutDashboard size={18} className="mr-3 flex-shrink-0" />
                <span>Dasbor Toko</span>
              </NavLink>
              <NavLink to="/dashboard/katalog" className={navLinkClass}>
                <Store size={18} className="mr-3 flex-shrink-0" />
                <span>Katalog Saya</span>
              </NavLink>
              <NavLink to="/dashboard/orders" className={navLinkClass}>
                <ClipboardList size={18} className="mr-3 flex-shrink-0" />
                <span>Pesanan Masuk</span>
              </NavLink>
              <NavLink to="/dashboard/profile" className={navLinkClass}>
                <User size={18} className="mr-3 flex-shrink-0" />
                <span>Profil Supplier</span>
              </NavLink>
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
                  <NavLink
                    to="/dashboard/profile"
                    onClick={() => setShowProfileMenu(false)}
                    className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
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
          
          {/* Supplier Sub-routes */}
          <Route path="supplier-dashboard" element={<SupplierDashboardView />} />
          <Route path="katalog" element={<CatalogView />} />
          <Route path="orders" element={<OrdersView />} />
          <Route path="profile" element={<ProfileView />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
