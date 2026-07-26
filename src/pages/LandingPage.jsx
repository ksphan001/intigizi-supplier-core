import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Store, 
  ShieldCheck, 
  ArrowRight, 
  ChevronDown, 
  CheckCircle, 
  Users, 
  Leaf, 
  DollarSign, 
  Truck, 
  Star,
  MapPin,
  HelpCircle,
  Menu,
  X,
  Loader2
} from 'lucide-react';

function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);
  
  // Local stats state (could fetch from API eventually)
  const [stats, setStats] = useState({
    empoweredUMKM: 124,
    distributedTons: 382,
    kitchenPartners: 18,
    economicTurnover: 750000000
  });

  const [suppliers, setSuppliers] = useState([]);
  const [suppliersLoading, setSuppliersLoading] = useState(false);

  const fetchSuppliers = async () => {
    setSuppliersLoading(true);
    try {
      const res = await fetch('http://intigizi-supplier-api.test/app/marketplace_suppliers.php');
      const data = await res.json();
      setSuppliers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Gagal memuat daftar supplier", err);
    } finally {
      setSuppliersLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const faqs = [
    {
      q: "Siapa saja yang bisa mendaftar sebagai supplier di Sentra IntiGizi?",
      a: "Seluruh pelaku UMKM pangan, koperasi unit desa, peternak rakyat, kelompok tani lokal, hingga distributor bahan baku yang berlokasi di wilayah operasional Dapur Gizi Mitra."
    },
    {
      q: "Apakah pendaftaran mitra supplier dipungut biaya?",
      a: "Pendaftaran 100% Gratis. Sentra IntiGizi hanya menetapkan persentase fee platform yang sangat kecil dan transparan dari transaksi pemesanan yang sukses untuk keberlanjutan layanan."
    },
    {
      q: "Dokumen apa saja yang diperlukan untuk pendaftaran?",
      a: "Untuk mendaftar, Anda memerlukan KTP pemilik usaha, informasi nomor rekening bank aktif untuk transfer dana, dan jika ada, dokumen legalitas usaha seperti NIB (Nomor Induk Berusaha) atau Sertifikat Halal untuk status Verified."
    },
    {
      q: "Bagaimana mekanisme penentuan harga bahan pangan?",
      a: "Supplier bebas memasukkan harga jual acuan pada katalog produk mereka. Dapur Gizi akan mengajukan Purchase Order (PO) sesuai kebutuhan, dan negosiasi harga dapat dilakukan secara transparan langsung di portal sebelum PO disetujui."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans selection:bg-green-100 selection:text-green-800">
      
      {/* NAVBAR */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-150 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-green-50 shadow-sm border border-green-100 flex-shrink-0 relative">
              <span className="text-green-600 font-black text-sm absolute -translate-x-1 -translate-y-1">S</span>
              <span className="text-orange-500 font-black text-sm absolute translate-x-1.5 translate-y-1">G</span>
              <div className="absolute top-1 left-4.5 w-1 h-1 rounded-full bg-green-500" />
            </div>
            <span className="text-lg font-black tracking-tight text-gray-800">
              <span>Sentra</span>
              <span className="text-green-600 ml-1">IntiGizi</span>
            </span>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-gray-650">
            <a href="#fitur" className="hover:text-green-600 transition-colors">Keunggulan</a>
            <a href="#alur" className="hover:text-green-600 transition-colors">Cara Kerja</a>
            <a href="#dampak" className="hover:text-green-600 transition-colors">Dampak Sosial</a>
            <a href="#faq" className="hover:text-green-600 transition-colors">FAQ</a>
          </nav>

          {/* Nav Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="px-5 py-2.5 text-xs font-black text-gray-700 hover:text-green-600 hover:bg-gray-100/50 rounded-xl transition-all">
              Masuk Portal
            </Link>
            <Link to="/register" className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-green-600/10">
              Daftar Mitra Supplier
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-gray-150 p-6 space-y-4 animate-fadeIn">
            <nav className="flex flex-col gap-3.5 text-sm font-bold text-gray-650">
              <a href="#fitur" onClick={() => setMobileMenuOpen(false)} className="hover:text-green-600 transition-colors">Keunggulan</a>
              <a href="#alur" onClick={() => setMobileMenuOpen(false)} className="hover:text-green-600 transition-colors">Cara Kerja</a>
              <a href="#dampak" onClick={() => setMobileMenuOpen(false)} className="hover:text-green-600 transition-colors">Dampak Sosial</a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="hover:text-green-600 transition-colors">FAQ</a>
            </nav>
            <div className="border-t border-gray-100 pt-4 flex flex-col gap-2">
              <Link to="/login" className="w-full text-center py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 rounded-xl">
                Masuk Portal
              </Link>
              <Link to="/register" className="w-full text-center py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold transition-all">
                Daftar Mitra Supplier
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden py-20 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-xs font-extrabold rounded-full border border-green-200">
              <Leaf size={12} />
              <span>Ekosistem Pangan Gotong Royong Nusantara</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-800 tracking-tight leading-[1.1]">
              Menghubungkan Hasil Bumi Rakyat dengan <span className="text-green-600">Dapur Gizi</span>
            </h1>
            <p className="text-base sm:text-lg text-gray-500 font-semibold max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Sentra IntiGizi memberdayakan petani lokal, peternak rakyat, dan UMKM penyedia bahan baku untuk mendistribusikan pasokan segar secara langsung dengan harga yang adil.
            </p>
            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-3.5 pt-2">
              <Link to="/register" className="px-7 py-3.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-extrabold transition-all shadow-lg shadow-green-600/20 flex items-center justify-center gap-2">
                <span>Bergabung Sebagai Mitra</span>
                <ArrowRight size={16} />
              </Link>
              <a href="#alur" className="px-7 py-3.5 bg-gray-50 hover:bg-gray-150/80 text-gray-700 rounded-xl text-sm font-extrabold transition-all border border-gray-200 flex items-center justify-center">
                Pelajari Cara Kerja
              </a>
            </div>
          </div>
          <div className="lg:col-span-5 relative flex justify-center">
            {/* Visual Decorative Box mimicking modern dashboard concept */}
            <div className="w-full max-w-[400px] aspect-square rounded-3xl bg-gradient-to-br from-green-500 to-emerald-600 p-8 text-white flex flex-col justify-between shadow-2xl relative">
              <div className="absolute -top-4 -left-4 bg-orange-500 text-white text-xs font-black px-3 py-1.5 rounded-xl shadow-md border border-orange-400 rotate-[-6deg]">
                Pemberdayaan UMKM Pangan
              </div>
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/10">
                  <Store size={24} />
                </div>
                <h3 className="text-xl font-black leading-tight">Sentra Supplier Mandiri Nusantara</h3>
                <p className="text-xs text-white/80 leading-relaxed font-medium">Membangun kedaulatan pangan lokal dengan mendistribusikan hasil panen sehat ke unit-unit pelayanan gizi.</p>
              </div>
              <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs text-white/70 font-semibold">Tumbuh Bersama</span>
                <span className="text-xs font-black px-2.5 py-1 bg-white text-green-700 rounded-lg">Perekonomian Rakyat</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VALUE PROPOSITIONS */}
      <section id="fitur" className="py-20 bg-gray-50 border-t border-gray-150">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-4 mb-16">
          <h2 className="text-3xl font-black text-gray-800">Keunggulan Bermitra dengan Sentra IntiGizi</h2>
          <p className="text-sm text-gray-400 font-bold max-w-xl mx-auto uppercase tracking-widest">Kolaborasi untuk kemakmuran bersama</p>
        </div>

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white border border-gray-150 p-8 rounded-2xl shadow-sm hover:shadow-md transition-all space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Store size={22} />
            </div>
            <h3 className="text-lg font-extrabold text-gray-800">Akses Pasar Kepastian</h3>
            <p className="text-xs text-gray-500 leading-relaxed font-semibold">
              Tidak perlu khawatir mencari pembeli. Dapur Gizi Mitra akan secara berkala memesan bahan baku pangan segar langsung dari katalog Sentra supplier terdekat.
            </p>
          </div>

          <div className="bg-white border border-gray-150 p-8 rounded-2xl shadow-sm hover:shadow-md transition-all space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <DollarSign size={22} />
            </div>
            <h3 className="text-lg font-extrabold text-gray-800">Harga Transparan & Adil</h3>
            <p className="text-xs text-gray-500 leading-relaxed font-semibold">
              Anda memegang kendali penuh atas harga jual produk. Proses tawar-menawar terdokumentasi rapi demi kesepakatan yang saling menguntungkan.
            </p>
          </div>

          <div className="bg-white border border-gray-150 p-8 rounded-2xl shadow-sm hover:shadow-md transition-all space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShieldCheck size={22} />
            </div>
            <h3 className="text-lg font-extrabold text-gray-800">Verifikasi & Reputasi</h3>
            <p className="text-xs text-gray-500 leading-relaxed font-semibold">
              Dapatkan badge *Verified Sentra* dan kumpulkan ulasan bintang lima dari dapur gizi untuk meningkatkan visibilitas dan kredibilitas usaha UMKM Anda.
            </p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="alur" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-4 mb-16">
          <h2 className="text-3xl font-black text-gray-800">Alur Gotong Royong Ekosistem</h2>
          <p className="text-sm text-gray-400 font-bold max-w-xl mx-auto uppercase tracking-widest">Sederhana, transparan, dan terarah</p>
        </div>

        <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8 relative">
          <div className="text-center space-y-3 relative z-10">
            <div className="w-10 h-10 rounded-full bg-green-600 text-white font-extrabold text-sm flex items-center justify-center mx-auto shadow-md">1</div>
            <h4 className="font-extrabold text-gray-800 text-sm">Daftar Mitra</h4>
            <p className="text-[11px] text-gray-500 leading-relaxed font-semibold">Petani, peternak, atau UMKM mengisi profil usaha dan wilayah kirim.</p>
          </div>
          <div className="text-center space-y-3 relative z-10">
            <div className="w-10 h-10 rounded-full bg-green-600 text-white font-extrabold text-sm flex items-center justify-center mx-auto shadow-md">2</div>
            <h4 className="font-extrabold text-gray-800 text-sm">Input Katalog</h4>
            <p className="text-[11px] text-gray-500 leading-relaxed font-semibold">Masukkan jenis komoditas hasil bumi, kapasitas harian, dan harga jual.</p>
          </div>
          <div className="text-center space-y-3 relative z-10">
            <div className="w-10 h-10 rounded-full bg-green-600 text-white font-extrabold text-sm flex items-center justify-center mx-auto shadow-md">3</div>
            <h4 className="font-extrabold text-gray-800 text-sm">Terima & Nego PO</h4>
            <p className="text-[11px] text-gray-500 leading-relaxed font-semibold">Terima orderan PO dari dapur gizi, sepakati harga, lalu antarkan bahan.</p>
          </div>
          <div className="text-center space-y-3 relative z-10">
            <div className="w-10 h-10 rounded-full bg-green-600 text-white font-extrabold text-sm flex items-center justify-center mx-auto shadow-md">4</div>
            <h4 className="font-extrabold text-gray-800 text-sm">Terima Payout</h4>
            <p className="text-[11px] text-gray-500 leading-relaxed font-semibold">Dana PO ditransfer dengan aman, peroleh rating ulasan reputasi mitra.</p>
          </div>
        </div>
      </section>

      {/* SOCIAL IMPACT COUNTER */}
      <section id="dampak" className="py-20 bg-green-700 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 text-white text-xs font-extrabold rounded-full border border-white/20 backdrop-blur-md">
              <Users size={12} />
              <span>Dampak Ekonomi Kerakyatan</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">Mendorong Kemakmuran UMKM & Petani di Setiap Daerah</h2>
            <p className="text-white/80 font-medium leading-relaxed text-sm">
              Kami berkomitmen memprioritaskan penyediaan bahan makanan pokok langsung dari masyarakat lokal. Melalui platform ini, dana operasional gizi dialirkan kembali ke kantong masyarakat daerah untuk meningkatkan kesejahteraan peternak, petani, dan UMKM lokal.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-6 rounded-2xl text-center">
              <p className="text-3xl font-black">{stats.empoweredUMKM}+</p>
              <p className="text-[10px] text-white/70 font-bold uppercase tracking-wider mt-1">Mitra UMKM & Petani</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-6 rounded-2xl text-center">
              <p className="text-3xl font-black">{stats.distributedTons} Ton</p>
              <p className="text-[10px] text-white/70 font-bold uppercase tracking-wider mt-1">Bahan Pangan Tersalur</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-6 rounded-2xl text-center">
              <p className="text-3xl font-black">{stats.kitchenPartners} Unit</p>
              <p className="text-[10px] text-white/70 font-bold uppercase tracking-wider mt-1">Dapur Gizi Terhubung</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-6 rounded-2xl text-center">
              <p className="text-3xl font-black">Rp {(stats.economicTurnover / 1000000).toLocaleString('id-ID')} Jt</p>
              <p className="text-[10px] text-white/70 font-bold uppercase tracking-wider mt-1">Perputaran Kas UMKM</p>
            </div>
          </div>
        </div>
      </section>

      {/* REGISTERED SUPPLIERS SECTION */}
      <section className="py-20 bg-gray-50 border-t border-b border-gray-150">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-black text-gray-800">Mitra Supplier Terdaftar</h2>
            <p className="text-sm text-gray-400 font-bold max-w-xl mx-auto uppercase tracking-widest">
              UMKM Pangan & Kelompok Tani Lokal yang siap melayani kebutuhan dapur gizi
            </p>
          </div>

          {suppliersLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="animate-spin text-green-600" size={32} />
            </div>
          ) : suppliers.length === 0 ? (
            <p className="text-center py-12 text-gray-450 italic font-semibold">Belum ada supplier yang mendaftar secara publik.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {suppliers.map((sup) => (
                <div key={sup.id} className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-base font-extrabold text-gray-800 truncate">{sup.supplier_name}</h4>
                      {!!sup.is_verified && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-green-50 text-green-700 border border-green-200 shrink-0">
                          Verified
                        </span>
                      )}
                    </div>



                    <div className="flex items-center gap-1.5 text-xs text-gray-500 font-semibold">
                      <Truck size={14} className="text-gray-400 shrink-0" />
                      <span>Radius Pengiriman: {sup.coverage_radius_km || 15} km</span>
                    </div>

                    {/* Stats badges */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-50 border border-gray-200 text-gray-650">
                        ⭐️ {parseFloat(sup.average_rating || 0).toFixed(2)} ({sup.review_count} Ulasan)
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 border border-emerald-150 text-emerald-700">
                        SLA: {parseFloat(sup.sla_score || 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* List of ingredients */}
                  {sup.matching_ingredients && sup.matching_ingredients.length > 0 && (
                    <div className="border-t border-dashed border-gray-150 pt-3 flex flex-wrap gap-1">
                      {sup.matching_ingredients.slice(0, 3).map((ing, idx) => (
                        <span key={idx} className="inline-flex items-center px-1.5 py-0.5 rounded bg-gray-50 text-gray-600 text-[10px] font-bold border border-gray-150">
                          {ing.ingredient_name}
                        </span>
                      ))}
                      {sup.matching_ingredients.length > 3 && (
                        <span className="text-[10px] text-gray-400 font-bold self-center">+{sup.matching_ingredients.length - 3} lainnya</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-20 bg-white border-b border-gray-150">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-black text-gray-800">Pertanyaan yang Sering Diajukan</h2>
            <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Temukan jawaban cepat seputar kemitraan Sentra</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden transition-all"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex justify-between items-center p-6 text-left font-extrabold text-sm text-gray-800 hover:text-green-600 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown 
                    size={16} 
                    className={`text-gray-400 transition-transform ${activeFaq === index ? 'rotate-185 text-green-600' : ''}`} 
                  />
                </button>
                {activeFaq === index && (
                  <div className="px-6 pb-6 pt-1 text-xs text-gray-500 leading-relaxed font-semibold border-t border-gray-150 animate-fadeIn">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="py-20 bg-gray-50 text-center space-y-6">
        <h2 className="text-3xl sm:text-4xl font-black text-gray-800 tracking-tight">Siap Memasok Hasil Bumi Terbaik Anda?</h2>
        <p className="text-sm text-gray-500 font-semibold max-w-md mx-auto leading-relaxed">
          Mari bergotong royong membangun ketahanan gizi generasi penerus dan memajukan perekonomian pangan lokal bersama Sentra IntiGizi.
        </p>
        <div>
          <Link to="/register" className="inline-flex items-center gap-2 px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-extrabold transition-all shadow-lg shadow-green-600/20">
            <span>Daftar Sebagai Mitra Sekarang</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-white border-t border-gray-150 py-12 text-center text-xs text-gray-400 font-semibold">
        <div className="max-w-7xl mx-auto px-6 space-y-4">
          <div className="flex items-center justify-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-green-50 shadow-sm border border-green-100 flex-shrink-0 relative">
              <span className="text-green-600 font-black text-xs absolute -translate-x-0.5 -translate-y-0.5">S</span>
              <span className="text-orange-500 font-black text-xs absolute translate-x-1 translate-y-0.5">G</span>
            </div>
            <span className="text-sm font-black tracking-tight text-gray-700">Sentra IntiGizi</span>
          </div>
          <p>© {new Date().getFullYear()} Sentra IntiGizi. Semua Hak Cipta Dilindungi. Pemberdayaan Ekonomi Rakyat berkelanjutan.</p>
        </div>
      </footer>

    </div>
  );
}

export default LandingPage;
