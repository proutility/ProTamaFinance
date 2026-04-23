// ========================================================
// Fungsi Tombol Menu HP (Buka/Tutup Sidebar)
// ========================================================
// Fungsi Mode Fokus (Desktop)
function toggleDesktopSidebar() {
    document.body.classList.toggle('sidebar-collapsed');
}
function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('mobileOverlay');
  if(sidebar && overlay) {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('show');
  }
}

// ========================================================
// KONFIGURASI FIREBASE CLOUD
// ========================================================
const firebaseConfig = {
  apiKey: "AIzaSyCfz1UlF0HD3eZSwridBibwGMqn3-Z8Mu8",
  authDomain: "pratama-finance.firebaseapp.com",
  projectId: "pratama-finance",
  storageBucket: "pratama-finance.firebasestorage.app",
  messagingSenderId: "38799030041",
  appId: "1:38799030041:web:140b04b4f3a7676a547788",
  measurementId: "G-0Y2Q0TD0VE"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ========================================================
// OVERRIDE ALERT BAWAAN JADI SWEETALERT MODERN
// ========================================================
window.alert = function(message) {
  let msgLower = message.toLowerCase();
  let iconType = 'info';
  
  if (msgLower.includes('sukses') || msgLower.includes('berhasil') || msgLower.includes('disimpan')) iconType = 'success';
  else if (msgLower.includes('gagal') || msgLower.includes('cukup') || msgLower.includes('valid') || msgLower.includes('kosong') || msgLower.includes('melebihi')) iconType = 'error';
  else if (msgLower.includes('lengkapi') || msgLower.includes('pilih')) iconType = 'warning';

  Swal.fire({
    text: message,
    icon: iconType,
    confirmButtonColor: '#3b82f6',
    confirmButtonText: 'Siap!',
    background: '#ffffff',
    borderRadius: '12px',
    customClass: { popup: 'swal2-custom-popup' }
  });
};

// ================= VARIABEL GLOBAL =================
let currentUser = null;
let currentUid = null;

let userProfile = { fullname: '', phone: '', city: '', job: '' };

let tempSelectedSources = ['all_liquid'];
let currentSourceMode = 'add';
let editingGoalIndex = -1;

let lastBalance = null; let lastWealth = null; let lastDebt = null;

let transactions = []; let goals = []; let debts = [];
let budgetsData = {}; let assetsData = {};

let weddingData = {
    budget: [], vendors: [], guests: [] 
};

let currentGuestSort = 'newest';

// FITUR BARU: Variabel untuk Sembunyikan Saldo
let isBalanceHidden = false;

let nowDt = new Date();
let defaultYM = nowDt.getFullYear() + "-" + String(nowDt.getMonth() + 1).padStart(2, '0');

function getAssetsFor(ym) { return assetsData[ym] || []; }
function getBudgetsFor(ym) { return budgetsData[ym] || []; }
let assets = [];

// ================= FUNGSI BANTUAN =================
// FITUR BARU: Fungsi mendapatkan ucapan berdasarkan jam
function getGreeting() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return "Selamat Pagi";
    if (hour >= 11 && hour < 15) return "Selamat Siang";
    if (hour >= 15 && hour < 18) return "Selamat Sore";
    return "Selamat Malam";
}
function getGreetingIcon() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return "☕";
    if (hour >= 11 && hour < 15) return "☀️";
    if (hour >= 15 && hour < 18) return "🌇";
    return "🌙";
}

// ================= FUNGSI AUTENTIKASI =================
auth.onAuthStateChanged((user) => {
  if (user) {
    currentUser = user.displayName || user.email.split('@')[0];
    currentUid = user.uid;
    loadDataFromFirebase();
  } else {
    document.getElementById("app").innerHTML = `
      <div class="login-wrap">
        <div class="login-container">
          
          <div class="login-left">
            <img src="logo.png" alt="Logo" style="width: 75px; height: 75px; object-fit: cover; border-radius: 18px; margin-bottom: 25px; box-shadow: 0 4px 10px rgba(0,0,0,0.08);">
            <h1 style="margin: 0 0 10px 0; color: #1e293b; font-size: 2.2rem; line-height: 1.2;">Pro-Tama Finance</h1>
            <p style="color:#64748b; font-size: 1.05rem; margin-bottom: 20px; line-height: 1.5;">Platform manajemen keuangan & aset yang terintegrasi untuk masa depan yang lebih tertata.</p>
            
            <div class="login-features">
                <div class="feature-item"><i class="fas fa-chart-pie"></i> <span>Pantau Cashflow & Aset Real-time</span></div>
                <div class="feature-item"><i class="fas fa-ring" style="color: #ec4899; background: #fdf2f8;"></i> <span>Wedding Planner Terintegrasi</span></div>
                <div class="feature-item"><i class="fas fa-calculator" style="color: #8b5cf6; background: #f5f3ff;"></i> <span>Kalkulator Saham Pintar</span></div>
            </div>
          </div>
          
          <div class="login-right">
            <div style="text-align:center; margin-bottom: 40px;">
                <h2 style="margin:0 0 8px 0; color: #1e293b; font-size: 1.8rem;">Selamat Datang! 👋</h2>
                <p style="color:#64748b; margin:0; font-size: 0.95rem;">Silakan masuk untuk mengakses dashboard.</p>
            </div>
            
            <button class="login-btn-google" onclick="login()">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" style="width:24px;"> 
              Lanjutkan dengan Google
            </button>
            
            <div style="margin-top: 40px; text-align: center; color: #94a3b8; font-size: 0.8rem; display: flex; align-items: center; justify-content: center; gap: 6px;">
                <i class="fas fa-shield-alt"></i> Secured by Google Firebase
            </div>
          </div>

        </div>
      </div>
    `;
  }
});

function login(){
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).catch((error) => alert("Gagal login bro: " + error.message));
}

function logout() { auth.signOut().then(() => location.reload()); }

function loadDataFromFirebase() {
  db.collection("usersData").doc(currentUid).get().then((doc) => {
    if (doc.exists) {
      let data = doc.data();
      transactions = data.transactions || [];
      goals = data.goals || [];
      debts = data.debts || [];
      budgetsData = data.budgetsData || {};
      assetsData = data.assetsData || {};
      if(data.weddingData) weddingData = data.weddingData;
      if(data.userProfile) userProfile = data.userProfile;
    }
    assets = getAssetsFor(defaultYM);
    
    document.getElementById("app").innerHTML = mainApp();
    setTimeout(() => { showPage('dashboard'); update(); }, 100);
  }).catch((error) => {
    alert("Gagal narik data dari server bro!");
  });
}

function save(){
  if(!currentUid) return;
  db.collection("usersData").doc(currentUid).set({
    transactions, goals, debts, budgetsData, assetsData, weddingData, userProfile, 
    lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
}

function mainApp(){
return `
<div class="main-content" style="position: relative; width: 100%; max-width: 100%; margin: 0 auto; padding-bottom: 50px;">

<button class="hide-on-mobile" onclick="logout()" style="position: fixed; bottom: 30px; left: 30px; background: white; color: #ef4444; border: 1px solid #fecaca; padding: 12px 20px; border-radius: 12px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15); z-index: 9999; display: flex; align-items: center; gap: 8px; transition: all 0.2s ease;" onmouseover="this.style.background='#fef2f2'; this.style.transform='translateY(-2px)';" onmouseout="this.style.background='white'; this.style.transform='translateY(0)';">
    <i class="fas fa-sign-out-alt" style="font-size: 1.2rem;"></i> Logout
</button>

<div id="notifPanel" class="notif-panel">
    <div class="notif-header">
        <span><i class="fas fa-bell" style="color:var(--warning);"></i> Notifikasi</span>
        <i class="fas fa-times" style="color:#94a3b8; cursor:pointer;" onclick="toggleNotif()"></i>
    </div>
    <div id="notifBody" class="notif-body">
        </div>
</div>

<div class="mobile-only-header">
   <div style="display:flex; align-items:center; gap:10px;">
      <img src="logo.png" style="width:35px; height:35px; border-radius:8px; object-fit:cover;">
      <strong style="font-size:1.2rem; color:#1e293b;">Pro-Tama Apps</strong>
   </div>
   <i class="fas fa-bell" style="font-size:1.4rem; color:#64748b; cursor:pointer;" onclick="toggleNotif()"></i>
</div>

<div class="desktop-global-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #e2e8f0;">
     
     <div style="display: flex; align-items: center; gap: 15px;">
         <img src="logo.png" style="width: 42px; height: 42px; border-radius: 10px; object-fit: cover; box-shadow: 0 2px 6px rgba(0,0,0,0.08);" alt="Logo">
         
         <div onclick="showPage('profil')" style="display: flex; align-items: center; justify-content: center; width: 42px; height: 42px; background: white; border-radius: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.05); cursor: pointer; border: 1px solid #e2e8f0; transition: 0.2s;" title="Profil Saya" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='white'">
             <i class="fas fa-user-circle" style="font-size:1.5rem; color:var(--primary);"></i>
         </div>

         <h2 id="headerGreeting" class="header-title" style="margin: 0; font-size: 1.4rem; color: #1e293b; display: block;">${getGreeting()}, ${userProfile.fullname || currentUser}! ${getGreetingIcon()}</h2>
     </div>
     
     <div style="display: flex; align-items: center; gap: 12px;">
        
        <button id="globalBackBtn" onclick="showPage('dashboard')" style="display: none; background: #3b82f6; color: white; border: none; padding: 10px 20px; border-radius: 20px; font-weight: 600; cursor: pointer; transition: 0.2s; align-items: center; gap: 8px; font-size: 0.95rem; box-shadow: 0 4px 10px rgba(59, 130, 246, 0.3);" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
            <i class="fas fa-chevron-left" style="font-size: 0.85rem;"></i> Kembali
        </button>

        <div onclick="toggleHideBalance()" style="display: flex; align-items: center; justify-content: center; background: white; padding: 10px 14px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); cursor: pointer; border: 1px solid #e2e8f0; transition: 0.2s;" title="Sembunyikan/Tampilkan Saldo" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='white'">
           <i class="fas fa-eye toggle-eye-icon" style="font-size:1.2rem; color:#94a3b8;"></i>
        </div>
        
        <div class="desktop-bell" onclick="toggleNotif()" style="display: flex; align-items: center; gap: 10px; background: white; padding: 10px 16px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); cursor: pointer; border: 1px solid #e2e8f0; transition: 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='white'">
           <i class="fas fa-bell" style="font-size:1.2rem; color:var(--warning);"></i>
           <span style="font-size: 0.85rem; font-weight: 700; color: #475569;">Notifikasi</span>
        </div>

     </div>
  </div>

<div id="dashboard" class="page">
  <div class="mobile-banner">
     <img src="baner.png" alt="Banner">
  </div>

  <div class="mobile-menu-grid">
     <div class="menu-btn" onclick="showPage('aset')"><div class="icon-box" style="background:#e0f2fe; color:#0284c7;"><i class="fas fa-home"></i></div><span>Asetku</span></div>
     <div class="menu-btn" onclick="showPage('anggaran')"><div class="icon-box" style="background:#dcfce7; color:#16a34a;"><i class="fas fa-file-invoice-dollar"></i></div><span>Anggaran</span></div>
     <div class="menu-btn" onclick="showPage('transaksi')"><div class="icon-box" style="background:#fef9c3; color:#ca8a04;"><i class="fas fa-exchange-alt"></i></div><span>Mutasi</span></div>
     <div class="menu-btn" onclick="showPage('target')"><div class="icon-box" style="background:#f3e8ff; color:#9333ea;"><i class="fas fa-bullseye"></i></div><span>Target</span></div>
     <div class="menu-btn" onclick="showPage('wedding')"><div class="icon-box" style="background:#fce7f3; color:#db2777;"><i class="fas fa-ring"></i></div><span>Wedding</span></div>
     <div class="menu-btn" onclick="showPage('hutang')"><div class="icon-box" style="background:#fee2e2; color:#dc2626;"><i class="fas fa-hand-holding-usd"></i></div><span>Hutang</span></div>
     <div class="menu-btn" onclick="showPage('kalkulator')"><div class="icon-box" style="background:#e0e7ff; color:#7c3aed;"><i class="fas fa-calculator"></i></div><span>Saham</span></div>
     <div class="menu-btn" onclick="showPage('laporan')"><div class="icon-box" style="background:#ccfbf1; color:#0d9488;"><i class="fas fa-chart-line"></i></div><span>Laporan</span></div>
  </div>
  
  <div style="margin-bottom: 15px; display:flex; justify-content:space-between; align-items:center;">
      <h3 style="margin:0; font-size:1.1rem; color:#1e293b;">Ringkasan Keuangan</h3>
      <span style="font-size:0.8rem; color:var(--primary); font-weight:700; cursor:pointer;" onclick="update()">Refresh</span>
  </div>
  
  <div id="debtReminderContainer"></div>
  
  <div class="grid-3">
    <div class="card" style="position: relative;">
      <h3><i class="fas fa-wallet text-primary"></i> Saldo Kas (Liquid)</h3>
      <h2 style="position: relative;">Rp <span id="balance">0</span> <span id="balanceAnim" class="anim-float" style="right: 20px; top: 25px;"></span></h2>
    </div>
    <div class="card" style="position: relative;">
      <h3><i class="fas fa-gem text-success"></i> Total Kekayaan Bersih</h3>
      <h2 style="position: relative;">Rp <span id="wealth">0</span> <span id="wealthAnim" class="anim-float" style="right: 20px; top: 25px;"></span></h2>
    </div>
    <div class="card" style="position: relative;">
      <h3><i class="fas fa-file-invoice-dollar text-danger"></i> Total Hutang</h3>
      <h2 style="position: relative;">Rp <span id="totalDebtDisplay">0</span> <span id="debtAnim" class="anim-float" style="right: 20px; top: 25px;"></span></h2>
    </div>
  </div>
  <div class="grid-2">
    <div class="card">
      <h3>Arus Kas Bulanan (Pemasukan vs Pengeluaran)</h3>
      <div class="chart-controls">
        <button onclick="renderMonthlyChart(3)">3 Bulan</button>
        <button onclick="renderMonthlyChart(6)">6 Bulan</button>
        <button onclick="renderMonthlyChart(12)" class="active">1 Tahun</button>
      </div>
      <div class="chart-container"><canvas id="barChart"></canvas></div>
    </div>
    <div class="card">
      <h3>Alokasi Semua Aset</h3>
      <div class="chart-container" style="display: flex; justify-content: center;"><canvas id="donutChart"></canvas></div>
    </div>
  </div>
</div>

<div id="profil" class="page" style="display:none;">
  <div class="header-with-picker">
    <h2 class="header-title">Profil Saya</h2>
  </div>
  <div class="card" style="max-width: 600px; margin: 0 auto;">
    <div style="text-align: center; margin-bottom: 30px;">
        <i class="fas fa-user-circle" style="font-size: 5rem; color: #cbd5e1; margin-bottom: 10px;"></i>
        <h3 style="margin:0; color:#1e293b;">${currentUser}</h3>
        <p style="color:#64748b; font-size:0.9rem; margin-top:5px;">Akun Google Tertaut</p>
    </div>
    
    <div class="form-group" style="flex-direction: column; align-items: stretch; gap: 15px;">
        <div style="display:flex; flex-direction:column; gap:5px;">
            <label style="font-size:0.85rem; font-weight:700; color:#475569; text-transform:uppercase;">Nama Lengkap</label>
            <input type="text" id="profName" placeholder="Masukkan nama lengkap..." value="${userProfile.fullname || ''}">
        </div>
        <div style="display:flex; flex-direction:column; gap:5px;">
            <label style="font-size:0.85rem; font-weight:700; color:#475569; text-transform:uppercase;">No. Handphone / WhatsApp</label>
            <input type="text" id="profPhone" placeholder="0812xxxxxx" value="${userProfile.phone || ''}">
        </div>
        <div style="display:flex; flex-direction:column; gap:5px;">
            <label style="font-size:0.85rem; font-weight:700; color:#475569; text-transform:uppercase;">Kota / Domisili</label>
            <input type="text" id="profCity" placeholder="Serang, Bekasi, dll" value="${userProfile.city || ''}">
        </div>
        <div style="display:flex; flex-direction:column; gap:5px;">
            <label style="font-size:0.85rem; font-weight:700; color:#475569; text-transform:uppercase;">Instansi / Satker Kerja</label>
            <input type="text" id="profJob" placeholder="Nama kantor/tempat kerja..." value="${userProfile.job || ''}">
        </div>
        
        <button class="action" style="margin-top: 15px;" onclick="saveProfile()"><i class="fas fa-save"></i> Simpan Profil</button>
    </div>
    
    <hr style="border:none; border-top:1px dashed #e2e8f0; margin: 30px 0;">
    
    <button class="btn-danger" style="width: 100%; padding: 14px; font-size: 1rem; border-radius: 8px;" onclick="logout()"><i class="fas fa-sign-out-alt"></i> Logout</button>
  </div>
</div>

<div id="kalkulator" class="page" style="display:none;">
    <div class="card" style="max-width:800px; margin:0 auto; background: #f8fafc; border: 1px solid #e2e8f0; padding: 25px;">
      <h3 style="color:#0ea5e9; margin-top: 0; margin-bottom: 25px; display: flex; align-items: center; gap: 10px;">
        <i class="fas fa-calculator"></i> Average Down Calculator
      </h3>
      
      <div style="display:flex; gap:30px; flex-wrap:wrap;">
        <div style="flex:1; min-width: 250px; display: flex; flex-direction: column; gap: 15px;">
          <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #cbd5e1;">
              <label style="font-size: 0.8rem; font-weight: 700; color: #64748b;">POSISI AWAL SAAT INI</label>
              <div style="display:flex; gap:10px; margin-top: 10px;">
                  <input type="number" id="calcLot1" placeholder="Jumlah Lot" style="flex: 1; width: 100%;">
                  <input type="number" id="calcPrice1" placeholder="Harga Beli (Rp)" style="flex: 1; width: 100%;">
              </div>
          </div>
          
          <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #cbd5e1;">
              <label style="font-size: 0.8rem; font-weight: 700; color: #64748b;">RENCANA TOP UP</label>
              <div style="display:flex; gap:10px; margin-top: 10px;">
                  <input type="number" id="calcLot2" placeholder="Jumlah Lot" style="flex: 1; width: 100%;">
                  <input type="number" id="calcPrice2" placeholder="Harga Target (Rp)" style="flex: 1; width: 100%;">
              </div>
          </div>
          
          <button class="action" onclick="calculateAvg()" style="width: 100%; justify-content: center; padding: 12px; font-size: 1rem; margin-top: 5px;">
            <i class="fas fa-magic"></i> Hitung Average
          </button>
        </div>
        
        <div style="flex:1; min-width: 250px; background:#ffffff; padding:25px; border-radius:12px; border: 1px solid #cbd5e1; display: flex; flex-direction: column; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
          <span style="font-size: 0.85rem; color:#64748b; font-weight: 700; text-transform: uppercase;">Average Baru Anda</span>
          <h2 id="resAvg" style="color:#0ea5e9; font-size: 2.4rem; margin: 5px 0 25px 0;">Rp 0</h2>
          
          <div style="display: flex; justify-content: space-between; border-top: 1px solid #f1f5f9; padding-top: 15px;">
              <div>
                  <span style="font-size: 0.75rem; color:#64748b; font-weight: 600;">TOTAL LOT</span>
                  <div id="resLot" style="font-weight:bold; font-size: 1.1rem; color: #1e293b; margin-top: 4px;">0 Lot</div>
              </div>
              <div style="text-align: right;">
                  <span style="font-size: 0.75rem; color:#64748b; font-weight: 600;">MODAL TAMBAHAN</span>
                  <div id="resFunds" style="color:#ef4444; font-weight:bold; font-size: 1.1rem; margin-top: 4px;">Rp 0</div>
              </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card" style="max-width:800px; margin:20px auto 0 auto; background: #f8fafc; border: 1px solid #e2e8f0; padding: 25px;">
      <h3 style="color:#10b981; margin-top: 0; margin-bottom: 25px; display: flex; align-items: center; gap: 10px;">
        <i class="fas fa-chart-line"></i> Profit / Loss Calculator (TP & SL)
      </h3>
      
      <div style="display:flex; gap:30px; flex-wrap:wrap;">
        <div style="flex:1; min-width: 250px; display: flex; flex-direction: column; gap: 15px;">
          <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #cbd5e1;">
              <label style="font-size: 0.8rem; font-weight: 700; color: #64748b;">SIMULASI TRANSAKSI</label>
              <div style="display:flex; gap:10px; margin-top: 10px;">
                  <input type="number" id="calcLotPL" placeholder="Jumlah Lot" style="flex: 1; width: 100%;">
                  <input type="number" id="calcBuyPrice" placeholder="Harga Beli (Rp)" style="flex: 1; width: 100%;">
              </div>
              <div style="margin-top: 10px;">
                  <input type="number" id="calcSellPrice" placeholder="Harga Jual / Target (Rp)" style="width: 100%;">
              </div>
          </div>
          
          <button class="btn-success" onclick="calculatePL()" style="width: 100%; justify-content: center; padding: 12px; font-size: 1rem; margin-top: 5px; font-weight: 600;">
            <i class="fas fa-bullseye"></i> Hitung Profit / Loss
          </button>
        </div>
        
        <div style="flex:1; min-width: 250px; background:#ffffff; padding:25px; border-radius:12px; border: 1px solid #cbd5e1; display: flex; flex-direction: column; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
          <span style="font-size: 0.85rem; color:#64748b; font-weight: 700; text-transform: uppercase;">Estimasi Profit / Loss</span>
          <div style="display: flex; align-items: baseline; gap: 10px; margin: 5px 0 25px 0;">
              <h2 id="resPLNominal" style="color:#1e293b; font-size: 2.2rem; margin: 0;">Rp 0</h2>
              <span id="resPLPercent" style="font-size: 1.1rem; font-weight: 700; padding: 4px 10px; border-radius: 8px; background: #e2e8f0; color: #475569;">0.00%</span>
          </div>
          
          <div style="display: flex; justify-content: space-between; border-top: 1px solid #f1f5f9; padding-top: 15px;">
              <div>
                  <span style="font-size: 0.75rem; color:#64748b; font-weight: 600;">MODAL AWAL</span>
                  <div id="resModalAwal" style="font-weight:bold; font-size: 1rem; color: #475569; margin-top: 4px;">Rp 0</div>
              </div>
              <div style="text-align: right;">
                  <span style="font-size: 0.75rem; color:#64748b; font-weight: 600;">TOTAL UANG KEMBALI</span>
                  <div id="resTotalReturn" style="color:#0ea5e9; font-weight:bold; font-size: 1.1rem; margin-top: 4px;">Rp 0</div>
              </div>
          </div>
        </div>
      </div>
    </div>
</div>

<div id="laporan" class="page" style="display:none;">
  <div class="header-with-picker">
    <h2 class="header-title">Laporan Analytics</h2>
    <div class="month-picker-capsule" onclick="try{document.getElementById('lapMonthFilter').showPicker()}catch(e){}">
      <i class="fas fa-calendar-alt"></i> <span id="lapMonthLabel">Pilih Bulan</span>
      <input type="month" id="lapMonthFilter" onchange="renderLaporan()" oninput="renderLaporan()">
    </div>
  </div>
  
  <div class="grid-3" id="laporanSummary"></div>
  <div class="card" style="margin-top:20px; display: flex; flex-direction: column; align-items: center;">
      <h3 style="margin-bottom:15px; align-self: flex-start;">Alokasi Pengeluaran</h3>
      <div class="chart-container" style="width:100%; max-width:400px; height:300px;"><canvas id="expenseDonutChart"></canvas></div>
  </div>
  
  <div class="card" style="margin-top: 20px;">
      <h3 style="margin-bottom: 15px; color:#475569;">Top 5 Pengeluaran Terbesar Bulan Ini</h3>
      <div id="topExpenses" style="display:flex; flex-direction:column; gap:10px;"></div>
  </div>
</div>

<div id="transaksi" class="page" style="display:none;">
  <div class="header-with-picker">
    <h2 class="header-title">Mutasi Keuangan</h2>
  </div>
  <div class="card">
    <div class="form-group">
      <select id="type" style="flex: 0.5; min-width: 180px;" onchange="handleTypeChange()">
        <option value="income">Pemasukan 📈</option>
        <option value="expense">Pengeluaran 📉</option>
        <option value="beli_aset">Beli Saham/Aset 🛒</option>
        <option value="jual_aset">Jual Saham/Aset 💰</option>
        <option value="transfer">Transfer Bank 🔄</option>
      </select>
      <select id="walletSelect" style="flex: 1;"><option value="">-- Rekening Sumber --</option></select>
      <select id="assetTargetSelect" style="flex: 1; display: none;"><option value="">-- Target Aset --</option></select>
      <select id="trxCategory" style="flex: 1;" onchange="handleTrxCategoryChange()"></select>
      <select id="trxSubCategory" style="flex: 1; display: none;"></select>
      <input type="text" id="customTrxCategory" placeholder="Ketik kategori baru..." style="flex: 1; display: none;">
      <input type="number" id="amount" placeholder="Nominal (Rp)">
      <input type="text" id="desc" placeholder="Keterangan">
      <input type="date" id="date" onchange="updateDropdowns()">
      <button class="action" onclick="addTransaction()"><i class="fas fa-plus"></i> Proses Transaksi</button>
    </div>
  </div>
  <div class="card" style="overflow-x: auto;">
    <table id="tabelTransaksi" style="min-width: 100%;">
      <thead><tr><th>Tanggal</th><th>Jenis</th><th>Keterangan</th><th>Nominal</th><th style="width: 80px; text-align: center;">Aksi</th></tr></thead>
      <tbody id="trxList"></tbody>
      <div style="display:flex; gap:10px; margin-bottom:15px; flex-wrap:wrap;">
      <input type="text" id="searchTrx" placeholder="Cari keterangan..." oninput="update()" style="flex:1; min-width:200px;">
      <input type="month" id="filterMonthTrx" onchange="update()" style="flex:0.5; min-width:150px;">
      <button class="btn-success" onclick="exportTrxToCSV()" style="padding:10px 15px;"><i class="fas fa-file-excel"></i> Export</button>
  </div>
    </table>
  </div>
</div>

<div id="anggaran" class="page" style="display:none;">
  <div class="header-with-picker">
    <h2 class="header-title">Anggaran Bulanan</h2>
    <div class="month-picker-capsule" onclick="try{document.getElementById('budgetMonthFilter').showPicker()}catch(e){}">
      <i class="fas fa-calendar-alt"></i> <span id="budgetMonthLabel">Pilih Bulan</span>
      <input type="month" id="budgetMonthFilter" onchange="update()" oninput="update()">
    </div>
  </div>
  <div id="budgetStatusCard" class="card" style="background: #f0f9ff; border: 1px solid #bae6fd; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
    <div style="flex: 1; min-width: 250px;">
      <h3 id="budgetCardTitle" style="color: var(--primary-dark); margin-bottom: 5px;">Budgeting</h3>
      <p style="margin: 0; font-size: 0.9rem; color: #64748b;">Target yang belum dibayar vs Saldo Kas saat ini.</p>
    </div>
    <div style="text-align: right; background: white; padding: 10px 20px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
      <h2 id="budgetVsLiquid" style="margin: 0; color: var(--text); font-size: 1.8rem;">Rp 0 / Rp 0</h2>
    </div>
  </div>
  <div class="card">
    <div class="form-group">
      <select id="budgetCategory" style="flex: 1;" onchange="handleBudgetCategoryChange()"></select>
      <input type="text" id="customBudgetCategory" placeholder="Ketik kategori baru..." style="flex: 1; display: none;">
      <input type="number" id="budgetAmount" placeholder="Batas Maksimal (Rp)" style="flex: 1;">
      <button class="action" onclick="addBudget()"><i class="fas fa-plus"></i> Set Anggaran</button>
    </div>
  </div>
  <div class="grid-2" id="budgetList"></div>
</div>

<div id="aset" class="page" style="display:none;">
  <div class="header-with-picker">
    <h2 class="header-title">Detail Aset & Portofolio</h2>
    <div class="month-picker-capsule" onclick="try{document.getElementById('assetMonthFilter').showPicker()}catch(e){}">
      <i class="fas fa-calendar-alt"></i> <span id="assetMonthLabel">Pilih Bulan</span>
      <input type="month" id="assetMonthFilter" onchange="update()" oninput="update()">
    </div>
  </div>
  <div class="card">
    <div class="form-group">
      <select id="assetType" style="flex: 0.5; min-width: 200px;" onchange="handleAssetTypeChange()">
        <option value="rekening">Rekening Bank / RDN 💳</option>
        <option value="saham">Saham (Ticker) 📈</option>
        <option value="emas">Emas 🏅</option>
        <option value="bergerak">Aset Bergerak 🚗</option>
        <option value="nonbergerak">Aset Tetap 🏠</option>
      </select>
      <input id="assetName" placeholder="Nama (Misal: Saham INET, Seabank)">
      <input type="number" id="assetLot" placeholder="Jml Lot" style="display:none; flex: 0.5;">
      <input type="number" id="assetAvg" placeholder="Avg Beli (Rp)" step="any" style="display:none; flex: 0.5;">
      <input type="number" id="assetValue" placeholder="Nilai Awal / Saldo (Rp)" step="any">
      <button class="action" onclick="addAsset()"><i class="fas fa-plus"></i> Tambah Aset</button>
    </div>
  </div>
  <div style="margin-bottom: 15px; padding: 0 10px;">
    <h3 style="margin: 0; color: #475569; font-size: 1.1rem;">Daftar Aset & Portofolio</h3>
  </div>
  <div id="assetListContainer"></div>
</div>

<div id="target" class="page" style="display:none;">
  <div class="header-with-picker">
    <h2 class="header-title">Target & Impian</h2>
  </div>
  <div class="card">
    <div class="form-group">
      <input id="goalName" placeholder="Nama Target" style="flex: 1;">
      <input type="number" id="goalValue" placeholder="Nominal (Rp)" style="flex: 1;">
      <button id="btnSelectSource" class="action" style="flex: 1; background: #f8fafc; color: #1e293b; border: 1px solid #cbd5e1; box-shadow: none;" onclick="openSourceModal('add')"><i class="fas fa-layer-group"></i> Semua Saldo Kas</button>
      <button class="action" onclick="addGoal()"><i class="fas fa-plus"></i> Simpan Target</button>
    </div>
  </div>
  <div class="grid-2" id="goalList"></div>
</div>

<div id="wedding" class="page" style="display:none;">
  <div class="header-with-picker">
    <h2 class="header-title" style="display: flex; align-items: center; gap: 10px;">
        <i class="fas fa-ring" style="color: #f472b6;"></i> Wedding Planner
    </h2>
  </div>
  <div class="wedding-tab">
      <button id="wed-tab-budget" class="active" onclick="switchWedTab('budget')">Budgeting</button>
      <button id="wed-tab-vendor" onclick="switchWedTab('vendor')">Vendor Tracker</button>
      <button id="wed-tab-guest" onclick="switchWedTab('guest')">Guest List</button>
  </div>
 <div id="wed-content-budget" class="wed-content">
      <div class="card" style="background: #eff6ff; border-color: #bfdbfe; margin-bottom: 15px;">
         <h3 style="margin:0; color:#1d4ed8; display:flex; justify-content:space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
             <span><i class="fas fa-bullseye"></i> Patokan Maksimal (Dari Target):</span>
             <strong id="wedMaxBudget" style="font-size: 1.5rem;">Rp 0</strong>
         </h3>
      </div>
      <div class="card">
        <div class="form-group">
          <input id="wedBudgetItem" placeholder="Item (Catering, Mas Kawin, dll)" style="flex: 1;">
          <input type="number" id="wedBudgetTarget" placeholder="Alokasi (Rp)" style="flex: 1;">
          <input id="wedBudgetNotes" placeholder="Keterangan / Link Toko" style="flex: 1.5;">
          <button class="action" onclick="addWedBudget()"><i class="fas fa-plus"></i> Tambah</button>
        </div>
      </div>
      <div id="wedBudgetContainer"></div>
  </div>
  
  <div id="wed-content-vendor" class="wed-content" style="display:none;">
      <div class="card">
        <div class="form-group">
          <input id="wedVendorName" placeholder="Nama Vendor" style="flex: 1;">
          <input id="wedVendorService" placeholder="Layanan (MUA, Dekor, Venue)" style="flex: 1;">
          <select id="wedVendorStatus" style="flex: 0.5;">
              <option value="Tanya">Baru Nanya / Survei</option>
              <option value="DP">Sudah DP</option>
              <option value="Lunas">Lunas</option>
          </select>
          <button class="action" onclick="addWedVendor()"><i class="fas fa-plus"></i> Tambah Vendor</button>
        </div>
      </div>
      <div class="card" style="overflow-x: auto;">
        <table id="wedVendorList" style="min-width: 100%;">
          <thead><tr><th>Nama Vendor</th><th>Layanan</th><th>Plus / Minus</th><th>Status</th><th style="width: 100px; text-align: center;">Aksi</th></tr></thead>
          <tbody id="wedVendorTbody"></tbody>
        </table>
      </div>
  </div>
  
  <div id="wed-content-guest" class="wed-content" style="display:none;">
      <div class="card" style="background: #f0fdf4; border-color: #bbf7d0; margin-bottom: 15px;">
         <h3 style="margin:0; color:#15803d; display:flex; justify-content:space-between; align-items:center;">
             <span>Total Tamu Diundang:</span>
             <div style="text-align:right;">
                <strong id="wedTotalGuests" style="font-size: 1.5rem;">0 Orang</strong>
                <div style="margin-top: 8px;">
                   <button class="btn-success" onclick="exportGuestsToCSV()" style="font-size:0.8rem; padding:6px 12px; cursor:pointer;"><i class="fas fa-file-excel"></i> Download Excel</button>
                </div>
             </div>
         </h3>
      </div>
      <div class="card">
        <div class="form-group">
          <input id="wedGuestName" placeholder="Nama Tamu / Keluarga" style="flex: 1.5;">
          <input id="wedGuestCity" placeholder="Kota / Domisili" style="flex: 1;">
          <select id="wedGuestType" style="flex: 0.5;">
              <option value="Keluarga Pria">Keluarga Pria</option>
              <option value="Keluarga Wanita">Keluarga Wanita</option>
              <option value="VIP">VIP</option>
              <option value="Reguler">Reguler</option>
          </select>
          <input type="number" id="wedGuestCount" placeholder="Jumlah Orang" style="flex: 0.5;" value="1">
          <button class="action" onclick="addWedGuest()"><i class="fas fa-plus"></i> Tambah Tamu</button>
        </div>
      </div>

      <div style="display:flex; justify-content:flex-end; margin-bottom: 15px;">
          <select id="guestSortSelect" onchange="changeGuestSort(this.value)" style="padding: 8px 15px; border-radius: 8px; border: 1px solid #cbd5e1; background: white; font-weight: 600; color: #475569; outline: none; cursor: pointer; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
              <option value="newest">Urutkan: Paling Baru</option>
              <option value="name">Urutkan: Abjad Nama (A-Z)</option>
              <option value="city">Urutkan: Kota Domisili (A-Z)</option>
          </select>
      </div>
      
      <div class="card" style="overflow-x: auto; margin-bottom: 20px; border-top: 4px solid #3b82f6;">
        <h4 onclick="toggleGuestList('Pria')" style="margin-top:0; color:#1d4ed8; display: flex; align-items: center; justify-content: space-between; cursor: pointer;">
            <span style="display: flex; align-items: center; gap: 8px;"><i class="fas fa-mars" style="color: #3b82f6;"></i> Daftar Keluarga Pria</span>
            <i id="icon-guest-Pria" class="fas fa-chevron-down" style="color: #94a3b8;"></i>
        </h4>
        <table id="wedGuestListPria" style="min-width: 100%; display: none;">
          <thead><tr><th>Nama Tamu</th><th>Kota</th><th>Jumlah (Pax)</th><th>Status Undangan</th><th>Kehadiran</th><th style="width: 100px; text-align: center;">Aksi</th></tr></thead>
          <tbody id="wedGuestTbodyPria"></tbody>
        </table>
      </div>

      <div class="card" style="overflow-x: auto; margin-bottom: 20px; border-top: 4px solid #ec4899;">
        <h4 onclick="toggleGuestList('Wanita')" style="margin-top:0; color:#be185d; display: flex; align-items: center; justify-content: space-between; cursor: pointer;">
            <span style="display: flex; align-items: center; gap: 8px;"><i class="fas fa-venus" style="color: #ec4899;"></i> Daftar Keluarga Wanita</span>
            <i id="icon-guest-Wanita" class="fas fa-chevron-down" style="color: #94a3b8;"></i>
        </h4>
        <table id="wedGuestListWanita" style="min-width: 100%; display: none;">
          <thead><tr><th>Nama Tamu</th><th>Kota</th><th>Jumlah (Pax)</th><th>Status Undangan</th><th>Kehadiran</th><th style="width: 100px; text-align: center;">Aksi</th></tr></thead>
          <tbody id="wedGuestTbodyWanita"></tbody>
        </table>
      </div>
      
      <div class="card" style="overflow-x: auto; margin-bottom: 20px; border-top: 4px solid #eab308;">
        <h4 onclick="toggleGuestList('VIP')" style="margin-top:0; color:#854d0e; display: flex; align-items: center; justify-content: space-between; cursor: pointer;">
            <span style="display: flex; align-items: center; gap: 8px;"><i class="fas fa-star" style="color: #eab308;"></i> Daftar Tamu VIP</span>
            <i id="icon-guest-VIP" class="fas fa-chevron-down" style="color: #94a3b8;"></i>
        </h4>
        <table id="wedGuestListVIP" style="min-width: 100%; display: none;">
          <thead><tr><th>Nama Tamu</th><th>Kota</th><th>Jumlah (Pax)</th><th>Status Undangan</th><th>Kehadiran</th><th style="width: 100px; text-align: center;">Aksi</th></tr></thead>
          <tbody id="wedGuestTbodyVIP"></tbody>
        </table>
      </div>

      <div class="card" style="overflow-x: auto; border-top: 4px solid #94a3b8;">
        <h4 onclick="toggleGuestList('Reguler')" style="margin-top:0; color:#475569; display: flex; align-items: center; justify-content: space-between; cursor: pointer;">
            <span style="display: flex; align-items: center; gap: 8px;"><i class="fas fa-users"></i> Daftar Tamu Reguler</span>
            <i id="icon-guest-Reguler" class="fas fa-chevron-down" style="color: #94a3b8;"></i>
        </h4>
        <table id="wedGuestListReguler" style="min-width: 100%; display: none;">
          <thead><tr><th>Nama Tamu</th><th>Kota</th><th>Jumlah (Pax)</th><th>Status Undangan</th><th>Kehadiran</th><th style="width: 100px; text-align: center;">Aksi</th></tr></thead>
          <tbody id="wedGuestTbodyReguler"></tbody>
        </table>
      </div>
  </div>
</div>

<div id="hutang" class="page" style="display:none;">
  <div class="header-with-picker">
    <h2 class="header-title">Manajemen Hutang & Cicilan</h2>
  </div>
  <div class="card">
    <div class="form-group">
      <input id="debtName" placeholder="Nama Hutang" style="flex: 1.5;">
      <input type="number" id="debtAmount" placeholder="Total Hutang (Rp)" style="flex: 1;">
      <div style="display: flex; align-items: center; border: 1px solid #cbd5e1; border-radius: 8px; background: #ffffff; padding-right: 10px; flex: 1;">
          <input type="date" id="debtDate" title="Tanggal Jatuh Tempo per Bulan" style="border: none; background: transparent; width: 100%;">
      </div>
      <button class="action" onclick="addDebt()"><i class="fas fa-plus"></i> Catat Hutang</button>
    </div>
  </div>
  <div class="card" style="overflow-x: auto;">
    <table id="tabelHutang" style="min-width: 100%;">
      <thead><tr><th>Nama / Keterangan</th><th>Total Pinjaman</th><th>Sisa Tagihan</th><th style="width: 150px; text-align: center;">Aksi</th></tr></thead>
      <tbody id="debtList"></tbody>
    </table>
  </div>
</div>

<div id="sourceModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(15, 23, 42, 0.7); z-index:9999; align-items:center; justify-content:center; backdrop-filter: blur(4px);">
  <div style="background:white; padding:30px; border-radius:16px; width:90%; max-width:450px; max-height:85vh; display:flex; flex-direction:column; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h3 style="margin:0; font-size:1.3rem; color: #1e293b;">Pilih Sumber Dana</h3>
        <button onclick="closeSourceModal()" style="background: none; border: none; font-size: 1.2rem; color: #94a3b8; cursor: pointer;"><i class="fas fa-times"></i></button>
    </div>
    <label style="display:flex; align-items:center; gap:12px; margin-bottom:20px; font-weight:700; padding: 15px; border-radius: 8px; background: #f0f9ff; border:1px solid #bae6fd; cursor:pointer;">
      <input type="checkbox" id="selectAllSources" style="width:20px; height:20px; margin:0; flex:none; cursor: pointer;" onchange="toggleSelectAllSources()">
      <span style="color:var(--primary-dark); font-size: 1.05rem;">Pilih Semua Aset</span>
    </label>
    <div id="sourceCheckboxes" style="overflow-y:auto; flex:1; padding-right:5px; display: flex; flex-direction: column; gap: 10px;"></div>
    <div style="display:flex; justify-content:flex-end; gap:12px; margin-top:25px; padding-top:20px; border-top:1px solid var(--border);">
      <button class="btn-danger" style="padding:12px 24px; font-weight: 600;" onclick="closeSourceModal()">Batal</button>
      <button class="btn-success" style="padding:12px 24px; font-weight: 600; background: var(--primary);" onclick="saveSourceSelection()">Simpan Pilihan</button>
    </div>
  </div>
</div>

</div>

<div class="bottom-nav">
  <div class="nav-item active" id="botnav-dashboard" onclick="showPage('dashboard')"><i class="fas fa-home"></i><span>Beranda</span></div>
  <div class="nav-item" id="botnav-transaksi" onclick="showPage('transaksi')"><i class="fas fa-file-invoice"></i><span>Transaksi</span></div>
  <div class="nav-item" id="botnav-profil" onclick="showPage('profil')"><i class="fas fa-user-circle"></i><span>Profil</span></div>
</div>

`;
}

// ================= FUNGSI NAVIGASI & MENU (UPDATE) =================
function showPage(p){
  document.querySelectorAll(".page").forEach(x => x.style.display="none");
  document.getElementById(p).style.display="block";
  
  document.querySelectorAll(".bottom-nav .nav-item").forEach(btn => btn.classList.remove("active"));
  if(document.getElementById("botnav-" + p)) document.getElementById("botnav-" + p).classList.add("active");
  
  // Logic Sapaan & Tombol Kembali
  let backBtn = document.getElementById("globalBackBtn");
  let greetingTxt = document.getElementById("headerGreeting");
  
  if(backBtn && greetingTxt) {
      if(p === 'dashboard') {
          backBtn.style.display = 'none';
          greetingTxt.style.display = 'block';
      } else {
          backBtn.style.display = 'flex';
          greetingTxt.style.display = 'none';
      }
  }

  if (window.innerWidth <= 768) {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('mobileOverlay');
    if(sidebar && overlay) { sidebar.classList.remove('open'); overlay.style.display = 'none'; }
  }
  
  if (p === 'wedding') renderWedding();
  if (p === 'laporan') renderLaporan();
  update();
}

// ================= FUNGSI PROFIL =================
function saveProfile() {
    userProfile.fullname = document.getElementById('profName').value;
    userProfile.phone = document.getElementById('profPhone').value;
    userProfile.city = document.getElementById('profCity').value;
    userProfile.job = document.getElementById('profJob').value;
    save();
    alert('Profil berhasil disimpan!');
    
    // Auto-update nama di Header
    let h2 = document.getElementById('headerGreeting');
    if(h2) h2.innerHTML = `${getGreeting()}, ${userProfile.fullname || currentUser}! ${getGreetingIcon()}`;
}

// ================= FUNGSI KALKULATOR SAHAM =================
function calculateAvg() {
    let lot1 = parseFloat(document.getElementById('calcLot1').value) || 0;
    let price1 = parseFloat(document.getElementById('calcPrice1').value) || 0;
    let lot2 = parseFloat(document.getElementById('calcLot2').value) || 0;
    let price2 = parseFloat(document.getElementById('calcPrice2').value) || 0;

    if(lot1===0 || price1===0 || lot2===0 || price2===0) {
        return alert("Isi semua data modal awal dan rencana top-up bro!");
    }

    let totalLot = lot1 + lot2;
    let totalValue = (lot1 * price1) + (lot2 * price2);
    let avgNew = totalValue / totalLot;
    let requiredFunds = lot2 * price2 * 100; // Harga x 100 lembar per lot

    document.getElementById('resAvg').innerText = formatRp(avgNew);
    document.getElementById('resLot').innerText = totalLot + " Lot";
    document.getElementById('resFunds').innerText = formatRp(requiredFunds);
}

// ================= FUNGSI KALKULATOR PROFIT / LOSS =================
function calculatePL() {
    let lot = parseFloat(document.getElementById('calcLotPL').value) || 0;
    let buyPrice = parseFloat(document.getElementById('calcBuyPrice').value) || 0;
    let sellPrice = parseFloat(document.getElementById('calcSellPrice').value) || 0;

    if(lot === 0 || buyPrice === 0 || sellPrice === 0) {
        return alert("Isi jumlah lot, harga beli, dan harga jual/targetnya bro!");
    }

    let modalAwal = lot * 100 * buyPrice;
    let totalReturn = lot * 100 * sellPrice;
    let profitLossNominal = totalReturn - modalAwal;
    let profitLossPercent = (profitLossNominal / modalAwal) * 100;

    let plNominalEl = document.getElementById('resPLNominal');
    let plPercentEl = document.getElementById('resPLPercent');
    
    // Format Tampilan
    document.getElementById('resModalAwal').innerText = formatRp(modalAwal);
    document.getElementById('resTotalReturn').innerText = formatRp(totalReturn);
    
    let sign = profitLossNominal > 0 ? '+' : '';
    plNominalEl.innerText = sign + formatRp(profitLossNominal);
    plPercentEl.innerText = sign + profitLossPercent.toFixed(2) + '%';

    // Kasih Warna Kaya Stockbit (Hijau Cuan, Merah Boncos)
    if(profitLossNominal > 0) {
        plNominalEl.style.color = '#10b981'; // Hijau
        plPercentEl.style.color = '#10b981';
        plPercentEl.style.backgroundColor = '#dcfce7';
    } else if (profitLossNominal < 0) {
        plNominalEl.style.color = '#ef4444'; // Merah
        plPercentEl.style.color = '#ef4444';
        plPercentEl.style.backgroundColor = '#fee2e2';
    } else {
        plNominalEl.style.color = '#1e293b'; // Abu-abu Netral
        plPercentEl.style.color = '#475569';
        plPercentEl.style.backgroundColor = '#e2e8f0';
    }
}

// ================= FUNGSI LAPORAN ANALYTICS =================
function renderLaporan() {
    let lapFilter = document.getElementById("lapMonthFilter");
    if (!lapFilter.value) lapFilter.value = defaultYM;
    let ym = lapFilter.value;
    
    let monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
    let d = new Date(ym + "-01");
    document.getElementById("lapMonthLabel").innerText = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;

    let inc = 0, exp = 0;
    let catExp = {};

    transactions.forEach(t => {
        if(t.date.startsWith(ym)) {
            if(t.type === 'income') inc += t.amount;
            else if(t.type === 'expense') {
                exp += t.amount;
                let cName = t.category || "Lainnya";
                catExp[cName] = (catExp[cName] || 0) + t.amount;
    renderExpenseDonut(catExp);
            }
        }
    });

    let net = inc - exp;
    let netColor = net >= 0 ? 'text-success' : 'text-danger';

    document.getElementById('laporanSummary').innerHTML = `
        <div class="card" style="border-left: 4px solid #10b981;">
            <h3 style="color:#10b981;"><i class="fas fa-arrow-down"></i> Total Pemasukan</h3>
            <h2>${formatRp(inc)}</h2>
        </div>
        <div class="card" style="border-left: 4px solid #ef4444;">
            <h3 style="color:#ef4444;"><i class="fas fa-arrow-up"></i> Total Pengeluaran</h3>
            <h2>${formatRp(exp)}</h2>
        </div>
        <div class="card" style="background:#f8fafc; border: 1px solid #cbd5e1;">
            <h3 style="color:#475569;"><i class="fas fa-wallet"></i> Net Cashflow</h3>
            <h2 class="${netColor}">${net >= 0 ? '+' : ''}${formatRp(net)}</h2>
        </div>
    `;

    // Render Top 5 Expenses
    let sortedCats = Object.keys(catExp).map(k => { return {name: k, amount: catExp[k]} }).sort((a,b) => b.amount - a.amount).slice(0,5);
    
    let topHTML = '';
    if(sortedCats.length === 0) topHTML = '<div style="color:#94a3b8; font-size:0.9rem;">Belum ada pengeluaran di bulan ini.</div>';
    else {
        sortedCats.forEach(item => {
            let pct = ((item.amount / exp) * 100).toFixed(1);
            topHTML += `
                <div style="display:flex; justify-content:space-between; padding: 12px; background: #f8fafc; border-radius: 8px; border-left: 3px solid #f59e0b;">
                    <div><strong style="color:#1e293b; font-size:0.95rem;">${item.name}</strong><div style="font-size:0.8rem; color:#64748b;">${pct}% dari total pengeluaran</div></div>
                    <div style="font-weight:700; color:#ef4444;">${formatRp(item.amount)}</div>
                </div>
            `;
        });
    }
    document.getElementById('topExpenses').innerHTML = topHTML;
}

// ================= FUNGSI NOTIFIKASI LONCENG =================
function toggleNotif() {
    const el = document.getElementById('notifPanel');
    
    if(el.style.display === 'block') {
        el.style.display = 'none';
    } else {
        renderNotifs();
        el.style.display = 'block';
    }
}

function renderNotifs() {
    try {
        let html = "";
        let today = new Date();
        let currentDay = today.getDate();
        let ym = defaultYM;
        
        let recentIncomes = transactions.filter(t => t.type === 'income' && t.date.startsWith(ym)).sort((a,b) => new Date(b.date) - new Date(a.date));
        if(recentIncomes.length > 0) {
            html += `<div class="notif-item success"><i class="fas fa-check-circle" style="color:#22c55e;"></i><div><strong>Pemasukan Masuk!</strong><br><span style="color:#64748b;">${recentIncomes[0].desc} (${formatRp(recentIncomes[0].amount)})</span></div></div>`;
        }

        debts.filter(d => d.remaining > 0).forEach(d => {
            let dueDay = parseInt(d.date.split('-')[2]);
            if(!isNaN(dueDay)) {
                let diff = dueDay - currentDay;
                let isPaid = transactions.some(t => t.type === 'expense' && t.desc.toLowerCase().includes(d.name.toLowerCase()) && t.date.startsWith(ym));
                if(!isPaid) {
                    if(diff <= 0) html += `<div class="notif-item danger"><i class="fas fa-exclamation-circle" style="color:#ef4444;"></i><div><strong>Cicilan Jatuh Tempo!</strong><br><span style="color:#64748b;">Segera bayar ${d.name}.</span></div></div>`;
                    else if(diff <= 5) html += `<div class="notif-item warning"><i class="fas fa-clock" style="color:#eab308;"></i><div><strong>H-${diff} Jatuh Tempo</strong><br><span style="color:#64748b;">Siapin dana buat ${d.name}.</span></div></div>`;
                }
            }
        });

        let currentBudgets = getBudgetsFor(ym);
        let spentThisMonth = {};
        transactions.filter(t => t.date.startsWith(ym) && t.type === 'expense').forEach(t => {
            spentThisMonth[t.category] = (spentThisMonth[t.category] || 0) + t.amount;
        });

        currentBudgets.forEach(b => {
            let spent = spentThisMonth[b.category] || 0;
            let target = b.amount || 0;
            if(target > 0) {
                let pct = Math.round((spent / target) * 100);
                if(pct > 100) html += `<div class="notif-item danger"><i class="fas fa-times-circle" style="color:#ef4444;"></i><div><strong>Overbudget: ${b.category}</strong><br><span style="color:#64748b;">Udah tembus ${pct}%!</span></div></div>`;
                else if(pct === 100) html += `<div class="notif-item success"><i class="fas fa-check-circle" style="color:#22c55e;"></i><div><strong>Terpenuhi: ${b.category}</strong><br><span style="color:#64748b;">Anggaran sudah terpakai 100%.</span></div></div>`;
            }
        });
        document.getElementById('notifBody').innerHTML = html || `<div style="text-align:center; padding:20px; color:#94a3b8; font-size:0.85rem;">Belum ada notifikasi baru bro. ☕</div>`;
    } catch(e) { console.error(e); }
}
// ==========================================
// FUNGSI WEDDING PLANNER
// ==========================================
function switchWedTab(tabName) {
    document.querySelectorAll('.wedding-tab button').forEach(btn => btn.classList.remove('active'));
    document.getElementById('wed-tab-' + tabName).classList.add('active');
    
    document.querySelectorAll('.wed-content').forEach(content => content.style.display = 'none');
    document.getElementById('wed-content-' + tabName).style.display = 'block';
}

function addWedBudget() {
    let name = document.getElementById('wedBudgetItem').value;
    let target = parseInt(document.getElementById('wedBudgetTarget').value);
    let notes = document.getElementById('wedBudgetNotes').value;
    
    if(!name || isNaN(target)) return alert("Isi nama item dan alokasi budgetnya bro!");
    
    let wedGoal = goals.find(g => g.name.toLowerCase().includes('nikah') || g.name.toLowerCase().includes('wedding'));
    let maxBudget = wedGoal ? wedGoal.target : 0;
    
    if (maxBudget > 0) {
        let currentTotalTarget = weddingData.budget.reduce((sum, b) => sum + b.target, 0);
        if (currentTotalTarget + target > maxBudget) {
            return alert(`Gagal! Total target item (${formatRp(currentTotalTarget + target)}) melebihi Patokan Maksimal (${formatRp(maxBudget)}) bro! Naikkan dulu target di menu Impian.`);
        }
    }
    
    weddingData.budget.push({ id: Date.now(), name: name, target: target, real: 0, notes: notes, subItems: [] });
    
    document.getElementById('wedBudgetItem').value = '';
    document.getElementById('wedBudgetTarget').value = '';
    document.getElementById('wedBudgetNotes').value = '';
    save(); renderWedding();
}

function updateWedBudgetReal(id) {
    let item = weddingData.budget.find(b => b.id === id);
    if (item.subItems && item.subItems.length > 0) return alert("Realisasi dihitung otomatis dari total Sub-Item bro! Update realisasi di masing-masing sub-item ya.");
    let newReal = prompt(`Update Realisasi Biaya untuk ${item.name} (Rp):`, item.real);
    if(newReal === null || newReal.trim() === "") return;
    newReal = parseInt(newReal.replace(/\./g, '').replace(/,/g, ''));
    if(isNaN(newReal)) return alert("Nominal nggak valid bro!");
    
    item.real = newReal;
    save(); renderWedding();
}

function deleteWedBudget(id) {
    if(confirm("Hapus budget item ini?")) {
        weddingData.budget = weddingData.budget.filter(b => b.id !== id);
        save(); renderWedding();
    }
}

function addWedSubItem(id) {
    let item = weddingData.budget.find(b => b.id === id);
    let name = prompt("Nama Sub Item (misal: Cincin Cowo):");
    if(!name || name.trim() === "") return;
    
    let amountInput = prompt(`Alokasi target untuk '${name}' (Rp):`);
    let amount = parseInt(amountInput ? amountInput.replace(/\./g, '').replace(/,/g, '') : 0);
    if(isNaN(amount) || amount <= 0) return alert("Nominal tidak valid!");

    if(!item.subItems) item.subItems = [];
    let currentSubTotal = item.subItems.reduce((sum, sub) => sum + sub.target, 0);
    if (currentSubTotal + amount > item.target) {
        return alert(`Gagal! Total Target Sub-Item (${formatRp(currentSubTotal + amount)}) melebihi Target Induk ${item.name} (${formatRp(item.target)}) bro!`);
    }

    let notes = prompt(`Keterangan / Link Vendor untuk '${name}' (Boleh dikosongkan):`);
    item.subItems.push({ id: Date.now(), name: name.trim(), target: amount, real: 0, notes: notes || "" });
    save(); renderWedding();
}

function updateWedSubItemReal(itemId, subId) {
    let item = weddingData.budget.find(b => b.id === itemId);
    let sub = item.subItems.find(s => s.id === subId);
    let newReal = prompt(`Update Realisasi Biaya untuk ${sub.name} (Rp):`, sub.real || 0);
    if(newReal === null || newReal.trim() === "") return;
    newReal = parseInt(newReal.replace(/\./g, '').replace(/,/g, ''));
    if(isNaN(newReal)) return alert("Nominal nggak valid bro!");
    sub.real = newReal;
    item.real = item.subItems.reduce((acc, curr) => acc + (curr.real || 0), 0);
    save(); renderWedding();
}

function deleteWedSubItem(itemId, subId) {
    if(confirm("Hapus sub item ini?")) {
        let item = weddingData.budget.find(b => b.id === itemId);
        item.subItems = item.subItems.filter(s => s.id !== subId);
        item.real = item.subItems.reduce((acc, curr) => acc + (curr.real || 0), 0);
        save(); renderWedding();
    }
}

function editWedBudgetNotes(id) {
    let item = weddingData.budget.find(b => b.id === id);
    let newNotes = prompt(`Update Keterangan/Link Vendor untuk ${item.name}:`, item.notes || "");
    if (newNotes !== null) { item.notes = newNotes; save(); renderWedding(); }
}

function editWedSubItemNotes(itemId, subId) {
    let item = weddingData.budget.find(b => b.id === itemId);
    let sub = item.subItems.find(s => s.id === subId);
    let newNotes = prompt(`Update Keterangan/Link Vendor untuk ${sub.name}:`, sub.notes || "");
    if (newNotes !== null) { sub.notes = newNotes; save(); renderWedding(); }
}

function addWedVendor() {
    let name = document.getElementById('wedVendorName').value;
    let service = document.getElementById('wedVendorService').value;
    let status = document.getElementById('wedVendorStatus').value;
    if(!name || !service) return alert("Lengkapi nama vendor dan layanannya bro!");
    weddingData.vendors.push({ id: Date.now(), name: name, service: service, status: status });
    document.getElementById('wedVendorName').value = '';
    document.getElementById('wedVendorService').value = '';
    save(); renderWedding();
}
window.editWedVendorNotes = function(id) {
    let vendor = weddingData.vendors.find(v => v.id === id);
    if (!vendor) return;
    
    let newNotes = prompt("Masukkan Plus / Minus untuk " + vendor.name + ":", vendor.plusminus || "");
    if (newNotes !== null) {
        vendor.plusminus = newNotes.trim();
        save();
        renderWedding();
    }
};

function toggleWedVendorStatus(id) {
    let vendor = weddingData.vendors.find(v => v.id === id);
    let nextStatus = vendor.status === 'Tanya' ? 'DP' : (vendor.status === 'DP' ? 'Lunas' : 'Tanya');
    vendor.status = nextStatus;
    save(); renderWedding();
}

function deleteWedVendor(id) {
    if(confirm("Hapus vendor ini?")) { weddingData.vendors = weddingData.vendors.filter(v => v.id !== id); save(); renderWedding(); }
}

function addWedGuest() {
    let name = document.getElementById('wedGuestName').value;
    let city = document.getElementById('wedGuestCity').value || '-'; 
    let type = document.getElementById('wedGuestType').value;
    let count = parseInt(document.getElementById('wedGuestCount').value);
    
    if(!name || isNaN(count)) return alert("Lengkapi nama dan jumlah tamu bro!");
    
    weddingData.guests.push({ id: Date.now(), name: name, city: city, type: type, count: count, isInvited: false, isAttending: true }); 
    
    document.getElementById('wedGuestName').value = '';
    document.getElementById('wedGuestCity').value = ''; 
    document.getElementById('wedGuestType').value = 'Keluarga Pria';
    document.getElementById('wedGuestCount').value = '1';
    
    save(); renderWedding();
}

function toggleWedGuestInvite(id) {
    let guest = weddingData.guests.find(g => g.id === id);
    guest.isInvited = !guest.isInvited;
    save(); renderWedding();
}

function toggleWedGuestAttend(id) {
    let guest = weddingData.guests.find(g => g.id === id);
    if (guest.isAttending === undefined) guest.isAttending = true;
    guest.isAttending = !guest.isAttending;
    save(); renderWedding();
}

function deleteWedGuest(id) {
    if(confirm("Hapus tamu ini?")) { weddingData.guests = weddingData.guests.filter(g => g.id !== id); save(); renderWedding(); }
}

function editWedGuest(id) {
    let guest = weddingData.guests.find(g => g.id === id);
    if (!guest) return;
    let newType = prompt("Pindah ke Jenis (Keluarga Pria / Keluarga Wanita / VIP / Reguler):", guest.type || 'Reguler');
    if (newType === null) return;
    const validTypes = ['VIP', 'Keluarga Pria', 'Keluarga Wanita', 'Reguler'];
    if (!validTypes.includes(newType.trim())) return alert("Gagal! Jenis harus: VIP, Keluarga Pria, Keluarga Wanita, atau Reguler.");
    guest.type = newType.trim();
    save(); renderWedding();
}

function inlineEditGuest(id, field) {
    let guest = weddingData.guests.find(g => g.id === id);
    if (!guest) return;

    if (field === 'name') {
        let newName = prompt("Edit Nama Tamu:", guest.name);
        if (newName !== null && newName.trim() !== "") { guest.name = newName.trim(); save(); renderWedding(); }
    } else if (field === 'city') {
        let newCity = prompt("Edit Kota / Domisili:", guest.city || '-');
        if (newCity !== null) { guest.city = newCity.trim(); save(); renderWedding(); }
    } else if (field === 'count') {
        let newCountStr = prompt(`Edit Jumlah (Pax) untuk ${guest.name}:`, guest.count);
        if (newCountStr !== null) {
            let newCount = parseInt(newCountStr);
            if (!isNaN(newCount) && newCount > 0) { guest.count = newCount; save(); renderWedding(); } 
            else alert("Jumlah (Pax) nggak valid bro!");
        }
    }
}

function exportGuestsToCSV() {
    if(weddingData.guests.length === 0) return alert("Belum ada data tamu buat di-download bro!");
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Nama Tamu,Kota/Domisili,Tipe Tamu,Jumlah (Pax),Status Undangan,Kehadiran\n"; 
    
    weddingData.guests.forEach(g => {
        let name = g.name.replace(/,/g, " "); 
        let city = (g.city || '-').replace(/,/g, " "); 
        let type = g.type || 'Reguler';
        let count = g.count;
        let invited = g.isInvited ? "Terkirim" : "Belum Terkirim";
        let attend = (g.isAttending !== false) ? "Hadir" : "Batal/Ragu";
        
        let row = `${name},${city},${type},${count},${invited},${attend}`; 
        csvContent += row + "\n";
    });
    
    var encodedUri = encodeURI(csvContent);
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "ProTama_Wedding_GuestList.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function changeGuestSort(val) { currentGuestSort = val; renderWedding(); }

function renderWedding() {
    let wedGoal = goals.find(g => g.name.toLowerCase().includes('nikah') || g.name.toLowerCase().includes('wedding'));
    let maxBudget = wedGoal ? wedGoal.target : 0;
    let maxBudgetEl = document.getElementById('wedMaxBudget');
    if (maxBudgetEl) maxBudgetEl.innerText = maxBudget > 0 ? formatRp(maxBudget) : "Set Target 'Nikah' di menu Impian";

    const budgetContainer = document.getElementById('wedBudgetContainer');
    if(budgetContainer) {
        let budgetHTML = ''; let totalAlokasi = 0; let totalRealisasi = 0;
        const formatCatatan = (text) => {
            if (!text) return "";
            let urlRegex = /((https?:\/\/|www\.)[^\s]+)/g;
            return text.replace(urlRegex, function(url) {
                let href = url.startsWith('http') ? url : 'https://' + url;
                return `<a href="${href}" target="_blank" style="color: #3b82f6; text-decoration: none; font-weight: 600; background: #eff6ff; padding: 2px 6px; border-radius: 4px;">Buka Link <i class="fas fa-external-link-alt" style="font-size:0.7rem;"></i></a>`;
            });
        };

        const colorPalette = ['#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#14b8a6', '#f97316'];

        if(weddingData.budget.length === 0) {
            budgetHTML = `<div class="card" style="text-align:center; color:#94a3b8; padding:30px; border: 1px dashed #cbd5e1;">Belum ada rincian biaya. Tambahkan di atas bro!</div>`;
        }

        weddingData.budget.forEach((b, index) => {
            let themeColor = colorPalette[index % colorPalette.length];
            totalAlokasi += b.target; totalRealisasi += b.real;
            let isWarning = b.real > b.target;
            let realColor = isWarning ? 'color: var(--danger); font-weight:bold;' : 'color: var(--success);';
            let notesHTML = b.notes ? `<div style="color:#64748b; font-size:0.85rem; margin-top:6px;"><i class="fas fa-info-circle"></i> ${formatCatatan(b.notes)}</div>` : '';
            
            let subHTML = '';
            if (b.subItems && b.subItems.length > 0) {
                subHTML += `
                <div style="overflow-x: auto; margin-top: 15px;">
                    <table style="min-width: 100%; border-radius: 8px; overflow: hidden; border-collapse: separate; border-spacing: 0; margin-top:0;">
                        <thead style="background: ${themeColor}15;">
                            <tr>
                                <th style="color: ${themeColor}; padding: 12px 15px; font-size:0.75rem; text-transform: uppercase;">Sub Item</th>
                                <th style="color: ${themeColor}; padding: 12px 15px; font-size:0.75rem; text-transform: uppercase;">Target</th>
                                <th style="color: ${themeColor}; padding: 12px 15px; font-size:0.75rem; text-transform: uppercase;">Realisasi</th>
                                <th style="color: ${themeColor}; padding: 12px 15px; font-size:0.75rem; text-transform: uppercase; text-align:center; width:120px;">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>`;
                
                b.subItems.forEach(sub => {
                    let subIsWarning = sub.real > sub.target;
                    let subRealColor = subIsWarning ? 'color: var(--danger);' : 'color: var(--success);';
                    let subNotes = sub.notes ? `<div style="color:#94a3b8; font-size:0.75rem; margin-top: 4px; font-weight: normal;">- ${formatCatatan(sub.notes)}</div>` : '';
                    
                    subHTML += `
                        <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 12px 15px; border-bottom: 1px solid #f1f5f9;"><strong style="color:#475569;">${sub.name}</strong>${subNotes}</td>
                            <td style="padding: 12px 15px; color:#64748b; border-bottom: 1px solid #f1f5f9;">${formatRp(sub.target)}</td>
                            <td style="padding: 12px 15px; ${subRealColor}; border-bottom: 1px solid #f1f5f9;">${formatRp(sub.real)}</td>
                            <td style="padding: 12px 15px; text-align:center; border-bottom: 1px solid #f1f5f9;">
                                <div style="display:flex; justify-content:center; gap:5px;">
                                    <button style="padding: 4px 8px; font-size: 0.75rem; background: #e2e8f0; color: #475569; border: none; border-radius: 6px; cursor: pointer;" onclick="editWedSubItemNotes(${b.id}, ${sub.id})" title="Edit Keterangan"><i class="fas fa-link"></i></button>
                                    <button class="btn-warning" style="padding: 4px 8px; font-size: 0.75rem;" onclick="updateWedSubItemReal(${b.id}, ${sub.id})" title="Update Realisasi Sub"><i class="fas fa-edit"></i></button>
                                    <button class="btn-danger" style="padding: 4px 8px; font-size: 0.75rem;" onclick="deleteWedSubItem(${b.id}, ${sub.id})"><i class="fas fa-trash"></i></button>
                                </div>
                            </td>
                        </tr>
                    `;
                });
                subHTML += `</tbody></table></div>`;
            } else {
                subHTML = `<div style="text-align:center; color:#94a3b8; font-size:0.85rem; padding: 15px; background: #f8fafc; border-radius: 8px; margin-top:15px; border: 1px dashed #cbd5e1;">Belum ada sub-item. Silakan tambah!</div>`;
            }

            budgetHTML += `
            <div class="card" style="border-top: 4px solid ${themeColor}; margin-bottom: 20px; padding: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.03);">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap: wrap; gap: 15px;">
                    <div style="flex: 1; min-width: 200px;">
                        <h3 style="margin:0; font-size:1.15rem; color: ${themeColor}; display:flex; align-items:center; gap:8px;">
                            <i class="fas fa-cube"></i> ${b.name}
                        </h3>
                        ${notesHTML}
                    </div>
                    <div style="display:flex; align-items:center; gap: 15px; flex-wrap: wrap;">
                        <div style="text-align: right; background: ${themeColor}10; padding: 8px 15px; border-radius: 8px; border: 1px solid ${themeColor}30;">
                            <div style="font-size:0.8rem; color:#64748b; margin-bottom: 4px; text-transform: uppercase; font-weight:700;">Target <span style="color:#1e293b; font-size:0.9rem; display:block;">${formatRp(b.target)}</span></div>
                            <div style="font-size:0.8rem; color:#64748b; text-transform: uppercase; font-weight:700;">Terpakai <span style="${realColor} font-size:0.9rem; display:block;">${formatRp(b.real)}</span></div>
                        </div>
                        <div style="display:flex; flex-direction:column; gap: 5px;">
                            <div style="display:flex; gap: 5px;">
                                <button style="flex:1; padding: 6px 10px; background: ${themeColor}; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.8rem; font-weight:600;" onclick="addWedSubItem(${b.id})" title="Tambah Sub Item"><i class="fas fa-plus"></i> Sub Item</button>
                                <button style="padding: 6px 10px; background: #e2e8f0; color: #475569; border: none; border-radius: 6px; cursor: pointer; font-size: 0.8rem;" onclick="editWedBudgetNotes(${b.id})" title="Edit Keterangan"><i class="fas fa-link"></i></button>
                            </div>
                            <div style="display:flex; gap: 5px;">
                                <button class="btn-warning" style="flex:1; padding: 6px 10px; font-size: 0.8rem;" onclick="updateWedBudgetReal(${b.id})" title="Update Realisasi"><i class="fas fa-edit"></i> Edit Nominal</button>
                                <button class="btn-danger" style="padding: 6px 10px; font-size: 0.8rem;" onclick="deleteWedBudget(${b.id})"><i class="fas fa-trash"></i></button>
                            </div>
                        </div>
                    </div>
                </div>
                ${subHTML}
            </div>
            `;
        });
        
        budgetHTML += `
            <div class="card" style="background: #0f172a; color: white; border: none; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px; margin-top: 10px;">
                <div>
                    <h3 style="margin: 0; color: #94a3b8; font-size: 0.8rem; text-transform: uppercase;">Total Keseluruhan Target</h3>
                    <h2 style="margin: 0; font-size: 1.6rem; color: #f8fafc;">${formatRp(totalAlokasi)}</h2>
                </div>
                <div style="text-align: right;">
                    <h3 style="margin: 0; color: #94a3b8; font-size: 0.8rem; text-transform: uppercase;">Total Realisasi (Terpakai)</h3>
                    <h2 style="margin: 0; font-size: 1.6rem; ${totalRealisasi > maxBudget && maxBudget > 0 ? 'color: #ef4444;' : 'color: #22c55e;'}">${formatRp(totalRealisasi)}</h2>
                </div>
            </div>
        `;
        budgetContainer.innerHTML = budgetHTML;
    }

    const vendorTbody = document.getElementById('wedVendorTbody');
    if(vendorTbody) {
        vendorTbody.innerHTML = '';
        weddingData.vendors.forEach(v => {
            let statusBtnClass = v.status === 'Lunas' ? 'btn-success' : (v.status === 'DP' ? 'btn-warning' : 'action');
            let statusBtnStyle = v.status === 'Tanya' ? 'background:#e2e8f0; color:#475569;' : '';
            
            // Siapin teks untuk kolom plus/minus
            let plusMinusText = v.plusminus ? v.plusminus : '<em style="color:#cbd5e1; font-size:0.8rem;"><i class="fas fa-edit"></i> Klik 2x buat isi</em>';

            vendorTbody.innerHTML += `
                <tr>
                    <td><strong style="color:#1e293b;">${v.name}</strong></td>
                    <td style="color:#475569;">${v.service}</td>
                    
                    <td ondblclick="editWedVendorNotes(${v.id})" title="Klik 2x untuk edit" style="cursor:pointer; color:#64748b; font-size:0.9rem;">
                        ${plusMinusText}
                    </td>
                    
                    <td><button class="${statusBtnClass}" style="padding: 4px 10px; font-size:0.8rem; ${statusBtnStyle}" onclick="toggleWedVendorStatus(${v.id})">${v.status}</button></td>
                    <td style="text-align:center;"><button class="btn-danger" style="padding: 6px 10px;" onclick="deleteWedVendor(${v.id})"><i class="fas fa-trash"></i></button></td>
                </tr>
            `;
        });
    }

    const tbodyVIP = document.getElementById('wedGuestTbodyVIP');
    const tbodyPria = document.getElementById('wedGuestTbodyPria');
    const tbodyWanita = document.getElementById('wedGuestTbodyWanita');
    const tbodyReguler = document.getElementById('wedGuestTbodyReguler');
    const totalGuestsEl = document.getElementById('wedTotalGuests');
    const sortSelectEl = document.getElementById('guestSortSelect');
    
    if(tbodyVIP && tbodyReguler && tbodyPria && tbodyWanita && totalGuestsEl) {
        tbodyVIP.innerHTML = ''; tbodyReguler.innerHTML = '';
        tbodyPria.innerHTML = ''; tbodyWanita.innerHTML = '';
        
        let totalPax = 0; let totalVIP = 0; let totalReguler = 0; let totalPria = 0; let totalWanita = 0;
        let hadirPax = 0; let hadirVIP = 0; let hadirReguler = 0; let hadirPria = 0; let hadirWanita = 0;

        if (sortSelectEl) sortSelectEl.value = currentGuestSort;

        let sortedGuests = [...weddingData.guests];
        if (currentGuestSort === 'name') sortedGuests.sort((a, b) => a.name.localeCompare(b.name));
        else if (currentGuestSort === 'city') sortedGuests.sort((a, b) => (a.city || '').localeCompare(b.city || ''));

        sortedGuests.forEach(g => {
            let gType = g.type || 'Reguler'; let isAttend = g.isAttending !== false;
            totalPax += g.count;
            if (gType === 'VIP') totalVIP += g.count; else if (gType === 'Keluarga Pria') totalPria += g.count;
            else if (gType === 'Keluarga Wanita') totalWanita += g.count; else totalReguler += g.count;

            if (isAttend) {
                hadirPax += g.count;
                if (gType === 'VIP') hadirVIP += g.count; else if (gType === 'Keluarga Pria') hadirPria += g.count;
                else if (gType === 'Keluarga Wanita') hadirWanita += g.count; else hadirReguler += g.count;
            }

            let checkIcon = g.isInvited ? '<i class="fas fa-check-circle" style="color:var(--success); font-size:1.2rem;"></i>' : '<i class="far fa-circle" style="color:#cbd5e1; font-size:1.2rem;"></i>';
            let attendIcon = isAttend ? '<i class="fas fa-user-check" style="color:var(--primary); font-size:1.2rem;"></i>' : '<i class="fas fa-user-times" style="color:var(--danger); font-size:1.2rem;"></i>';
            
            let typeBadge = '';
            if(gType === 'VIP') typeBadge = '<span style="background:#fef08a; color:#854d0e; padding:2px 6px; border-radius:4px; font-size:0.7rem; font-weight:bold; margin-left:8px;">VIP</span>';
            else if(gType === 'Keluarga Pria') typeBadge = '<span style="background:#dbeafe; color:#1e40af; padding:2px 6px; border-radius:4px; font-size:0.7rem; font-weight:bold; margin-left:8px;">PRIA</span>';
            else if(gType === 'Keluarga Wanita') typeBadge = '<span style="background:#fce7f3; color:#9d174d; padding:2px 6px; border-radius:4px; font-size:0.7rem; font-weight:bold; margin-left:8px;">WANITA</span>';
            else typeBadge = '<span style="background:#e2e8f0; color:#475569; padding:2px 6px; border-radius:4px; font-size:0.7rem; font-weight:bold; margin-left:8px;">Reguler</span>';
            
            let rowHTML = `
                <tr style="opacity: ${isAttend ? '1' : '0.5'}; transition: background 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
                    <td ondblclick="inlineEditGuest(${g.id}, 'name')" title="Klik 2x untuk edit Nama" style="cursor:pointer;"><strong style="color:#1e293b;">${g.name}</strong>${typeBadge}</td>
                    <td ondblclick="inlineEditGuest(${g.id}, 'city')" title="Klik 2x untuk edit Kota" style="cursor:pointer; color:#64748b;"><i class="fas fa-map-marker-alt" style="color:#cbd5e1; margin-right:4px;"></i> ${g.city || '-'}</td>
                    <td ondblclick="inlineEditGuest(${g.id}, 'count')" title="Klik 2x untuk edit Pax" style="cursor:pointer; color:#475569; font-weight:600;">${g.count} Orang</td>
                    <td style="cursor:pointer;" onclick="toggleWedGuestInvite(${g.id})">
                        ${checkIcon} <span style="font-size:0.85rem; color:#64748b; margin-left:5px;">${g.isInvited ? 'Terkirim' : 'Belum'}</span>
                    </td>
                    <td style="cursor:pointer;" onclick="toggleWedGuestAttend(${g.id})">
                        ${attendIcon} <span style="font-size:0.85rem; color:#64748b; margin-left:5px;">${isAttend ? 'Hadir' : 'Batal'}</span>
                    </td>
                    <td style="text-align:center; display:flex; justify-content:center; gap:5px;">
                        <button class="btn-warning" style="padding: 6px 10px;" onclick="editWedGuest(${g.id})" title="Pindah Jenis Tamu"><i class="fas fa-exchange-alt"></i></button>
                        <button class="btn-danger" style="padding: 6px 10px;" onclick="deleteWedGuest(${g.id})" title="Hapus Tamu"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;

            if (gType === 'VIP') tbodyVIP.innerHTML += rowHTML;
            else if (gType === 'Keluarga Pria') tbodyPria.innerHTML += rowHTML;
            else if (gType === 'Keluarga Wanita') tbodyWanita.innerHTML += rowHTML;
            else tbodyReguler.innerHTML += rowHTML;
        });
        
        if(tbodyPria.innerHTML === '') tbodyPria.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#94a3b8; font-size:0.9rem;">Belum ada Keluarga Pria</td></tr>';
        if(tbodyWanita.innerHTML === '') tbodyWanita.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#94a3b8; font-size:0.9rem;">Belum ada Keluarga Wanita</td></tr>';
        if(tbodyVIP.innerHTML === '') tbodyVIP.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#94a3b8; font-size:0.9rem;">Belum ada tamu VIP</td></tr>';
        if(tbodyReguler.innerHTML === '') tbodyReguler.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#94a3b8; font-size:0.9rem;">Belum ada tamu Reguler</td></tr>';

        totalGuestsEl.innerHTML = `
            <div style="text-align: right;">
                <div style="font-size: 0.9rem; font-weight: 500; color: #475569; margin-bottom: 5px;">
                    Diundang: ${totalPax} <span style="font-size: 0.8rem;">(Pria ${totalPria} | Wanita ${totalWanita} | VIP ${totalVIP} | Reg ${totalReguler})</span>
                </div>
                <span style="color: var(--primary);"><i class="fas fa-users"></i> Estimasi Hadir: ${hadirPax} Orang</span><br>
                <span style="font-size: 0.85rem; color: #3b82f6; font-weight: 500;">(Pria: ${hadirPria} | Wanita: ${hadirWanita} | VIP: ${hadirVIP} | Reg: ${hadirReguler})</span>
            </div>
        `;
    }
}

// FITUR BARU: Format Hide/Show Saldo
const formatRp = (angka) => {
  if(isBalanceHidden) return "***.***";
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(angka);
};

// FITUR BARU: Toggle Hide Balance
function toggleHideBalance() {
  isBalanceHidden = !isBalanceHidden;
  let eyeIcons = document.querySelectorAll(".toggle-eye-icon");
  
  eyeIcons.forEach(icon => {
      if(isBalanceHidden) {
          icon.classList.remove("fa-eye");
          icon.classList.add("fa-eye-slash");
          icon.style.color = "#3b82f6";
      } else {
          icon.classList.remove("fa-eye-slash");
          icon.classList.add("fa-eye");
          icon.style.color = "#94a3b8";
      }
  });
  update();
}

function handleTypeChange() {
  let type = document.getElementById("type").value;
  let assetTarget = document.getElementById("assetTargetSelect");
  let trxCat = document.getElementById("trxCategory");
  let customTrxCat = document.getElementById("customTrxCategory");
  
  assetTarget.style.display = (type === 'beli_aset' || type === 'jual_aset' || type === 'transfer') ? "block" : "none";
  trxCat.style.display = (type === 'income' || type === 'expense') ? "block" : "none";
  
  if (type !== 'income' && type !== 'expense') customTrxCat.style.display = "none";
  else handleTrxCategoryChange(); 
  
  updateDropdowns();
}

function handleTrxCategoryChange() {
  let val = document.getElementById("trxCategory").value;
  let customCat = document.getElementById("customTrxCategory");
  let subCatSel = document.getElementById("trxSubCategory");
  
  if (val === 'Lainnya') {
    customCat.style.display = 'block';
    subCatSel.style.display = 'none';
  } else {
    customCat.style.display = 'none';
    let type = document.getElementById("type").value;
    if(type === 'expense') {
        let trxDate = document.getElementById("date").value || defaultYM;
        let ym = trxDate.substring(0, 7);
        let budget = getBudgetsFor(ym).find(b => b.category === val);
        
        if (budget && budget.subBudgets && budget.subBudgets.length > 0) {
            subCatSel.innerHTML = '<option value="">-- Pilih Sub Kategori (Opsional) --</option>';
            budget.subBudgets.forEach(sub => { subCatSel.innerHTML += `<option value="${sub.name}">${sub.name}</option>`; });
            subCatSel.style.display = 'block';
        } else { subCatSel.style.display = 'none'; subCatSel.value = ''; }
    } else { subCatSel.style.display = 'none'; subCatSel.value = ''; }
  }
}

function handleBudgetCategoryChange() {
  let val = document.getElementById("budgetCategory").value;
  document.getElementById("customBudgetCategory").style.display = (val === 'Lainnya') ? 'block' : 'none';
}

function handleAssetTypeChange() {
  let type = document.getElementById("assetType").value;
  let lotInput = document.getElementById("assetLot");
  let avgInput = document.getElementById("assetAvg");
  let valInput = document.getElementById("assetValue");
  
  if (type === 'saham') {
    lotInput.style.display = "block"; avgInput.style.display = "block"; valInput.placeholder = "Harga Saat Ini / Lembar (Rp)";
  } else {
    lotInput.style.display = "none"; avgInput.style.display = "none"; valInput.placeholder = "Nilai Awal / Saldo (Rp)";
  }
}

function updateDropdowns() {
  let type = document.getElementById("type");
  let walletSel = document.getElementById("walletSelect");
  let assetSel = document.getElementById("assetTargetSelect");
  
  let trxDateInput = document.getElementById("date");
  let trxYM = (trxDateInput && trxDateInput.value) ? trxDateInput.value.substring(0, 7) : defaultYM;
  let trxAssets = getAssetsFor(trxYM);
  
  if(walletSel && assetSel && type) {
    walletSel.innerHTML = '<option value="">-- Sumber Dana (' + trxYM + ') --</option>';
    assetSel.innerHTML = type.value === 'transfer' ? '<option value="">-- Ke Rekening --</option>' : '<option value="">-- Ke Saham/Aset --</option>';

    trxAssets.forEach((a, i) => {
      if(a.type === 'rekening') {
        walletSel.innerHTML += `<option value="${i}">${a.name} (${formatRp(a.value)})</option>`;
        if(type.value === 'transfer') assetSel.innerHTML += `<option value="${i}">${a.name}</option>`;
      } else { if(type.value !== 'transfer') assetSel.innerHTML += `<option value="${i}">${a.name}</option>`; }
    });
  }

  let defaultExpenseCats = ["Kebutuhan Pokok", "Transportasi", "Cicilan / Tagihan", "Hiburan / Ngedate"];
  let defaultIncomeCats = ["Gaji Pokok", "Tunjangan / Bonus", "Dividen Saham", "Hasil Jual Aset", "Pendapatan Lain"];
  let extraExpenseCats = []; let extraIncomeCats = [];
  
  transactions.forEach(t => { 
    if(t.category && t.category !== "Tanpa Kategori" && t.category !== "Lainnya") { 
      if(t.type === 'expense' && !defaultExpenseCats.includes(t.category) && !extraExpenseCats.includes(t.category)) extraExpenseCats.push(t.category);
      else if (t.type === 'income' && !defaultIncomeCats.includes(t.category) && !extraIncomeCats.includes(t.category)) extraIncomeCats.push(t.category);
    } 
  });
  
  Object.values(budgetsData).forEach(monthlyBdg => {
    monthlyBdg.forEach(b => { 
      if(!defaultExpenseCats.includes(b.category) && !extraExpenseCats.includes(b.category)) extraExpenseCats.push(b.category); 
    });
  });

  let trxCatSel = document.getElementById("trxCategory");
  if(trxCatSel && type) {
    let currentTrxCat = trxCatSel.value;
    trxCatSel.innerHTML = '<option value="Tanpa Kategori">-- Pilih Kategori --</option>';
    if (type.value === 'income') {
        defaultIncomeCats.forEach(c => trxCatSel.innerHTML += `<option value="${c}">${c}</option>`);
        extraIncomeCats.forEach(c => trxCatSel.innerHTML += `<option value="${c}">${c}</option>`);
    } else {
        defaultExpenseCats.forEach(c => trxCatSel.innerHTML += `<option value="${c}">${c}</option>`);
        extraExpenseCats.forEach(c => trxCatSel.innerHTML += `<option value="${c}">${c}</option>`);
    }
    trxCatSel.innerHTML += '<option value="Lainnya">Lainnya (Ketik Sendiri)</option>';
    let opts = Array.from(trxCatSel.options).map(o => o.value);
    if(opts.includes(currentTrxCat)) trxCatSel.value = currentTrxCat;
  }

  let bdgCatSel = document.getElementById("budgetCategory");
  if(bdgCatSel) {
    let currentBdgCat = bdgCatSel.value;
    bdgCatSel.innerHTML = '';
    defaultExpenseCats.forEach(c => bdgCatSel.innerHTML += `<option value="${c}">${c}</option>`);
    extraExpenseCats.forEach(c => bdgCatSel.innerHTML += `<option value="${c}">${c}</option>`);
    bdgCatSel.innerHTML += '<option value="Lainnya">Lainnya (Ketik Sendiri)</option>';
    let opts = Array.from(bdgCatSel.options).map(o => o.value);
    if(opts.includes(currentBdgCat)) bdgCatSel.value = currentBdgCat;
  }
  handleTrxCategoryChange();
}

function openSourceModal(mode, index) {
  currentSourceMode = mode;
  editingGoalIndex = index;
  let cbContainer = document.getElementById("sourceCheckboxes");
  cbContainer.innerHTML = "";
  
  let selected = mode === 'add' ? tempSelectedSources : (Array.isArray(goals[index].source) ? goals[index].source : [goals[index].source || 'all_liquid']);
  let isAllLiquid = selected.includes('all_liquid');
  let allChecked = true;
  
  let currentMonthAssets = getAssetsFor(defaultYM);
  currentMonthAssets.forEach(a => {
    let isChecked = isAllLiquid ? (a.type === 'rekening') : selected.includes(a.name); 
    if(!isChecked) allChecked = false;
    cbContainer.innerHTML += `
      <label style="display:flex; align-items:center; gap:15px; padding:12px 16px; background:#ffffff; border-radius:10px; border:1px solid #cbd5e1; cursor:pointer; transition: all 0.2s ease;">
        <input type="checkbox" class="source-cb" value="${a.name}" ${isChecked ? 'checked' : ''} style="width:20px; height:20px; margin:0; flex:none; cursor:pointer;" onchange="checkIndividualSource()">
        <div style="display:flex; justify-content:space-between; flex:1; align-items: center;">
          <strong style="font-size:1rem; color: #1e293b;">${a.name}</strong>
          <span style="color:#64748b; font-size:0.95rem; font-weight: 500;">${formatRp(a.value)}</span>
        </div>
      </label>
    `;
  });
  
  document.getElementById("selectAllSources").checked = allChecked && currentMonthAssets.length > 0;
  document.getElementById("sourceModal").style.display = "flex";
}

function toggleSelectAllSources() {
  let isChecked = document.getElementById("selectAllSources").checked;
  document.querySelectorAll(".source-cb").forEach(cb => cb.checked = isChecked);
}

function checkIndividualSource() {
  let allCb = document.querySelectorAll(".source-cb");
  let allChecked = Array.from(allCb).every(cb => cb.checked);
  document.getElementById("selectAllSources").checked = allChecked;
}

function saveSourceSelection() {
  let selected = [];
  document.querySelectorAll(".source-cb:checked").forEach(cb => selected.push(cb.value));
  if(selected.length === 0) return alert("Pilih minimal 1 sumber dana bro!");
  
  if(currentSourceMode === 'add') {
    tempSelectedSources = selected;
    let currentMonthAssets = getAssetsFor(defaultYM);
    let btnText = selected.length === currentMonthAssets.length ? "Semua Saldo Kas" : (selected.length === 1 ? selected[0] : selected.length + " Sumber Gabungan");
    document.getElementById("btnSelectSource").innerHTML = `<i class="fas fa-layer-group"></i> ${btnText}`;
  } else {
    goals[editingGoalIndex].source = selected;
    save(); update();
  }
  closeSourceModal();
}

function closeSourceModal() { document.getElementById("sourceModal").style.display = "none"; }

function addTransaction(){
  let amountVal = parseInt(document.getElementById("amount").value);
  let desc = document.getElementById("desc").value;
  let date = document.getElementById("date").value || new Date().toISOString().split('T')[0];
  let type = document.getElementById("type").value;
  let walletIdx = document.getElementById("walletSelect").value;
  let assetIdx = document.getElementById("assetTargetSelect").value;
  
  let category = document.getElementById("trxCategory").value; 
  if (category === 'Lainnya') {
    category = document.getElementById("customTrxCategory").value;
    if (!category) return alert("Isi nama kategori barunya bro!");
  }
  
  let subCatEl = document.getElementById("trxSubCategory");
  let subCategory = (subCatEl.style.display !== 'none' && subCatEl.value !== "") ? subCatEl.value : null;

  if(!amountVal || !desc || walletIdx === "") return alert("Lengkapi data mutasi, bro!");
  walletIdx = parseInt(walletIdx);

  let trxYM = date.substring(0, 7);
  if(!assetsData[trxYM]) return alert("Aset di bulan " + trxYM + " masih kosong. Buka menu Aset Portofolio, pilih bulan tersebut, lalu salin asetnya dulu bro!");
  
  let trxAssets = assetsData[trxYM];

  if(type === "income") {
    trxAssets[walletIdx].value += amountVal;
  } else if(type === "expense") {
    if(trxAssets[walletIdx].value < amountVal) return alert("Saldo ga cukup!");
    trxAssets[walletIdx].value -= amountVal;
  } else if(type === "beli_aset") {
    if(assetIdx === "") return alert("Pilih target aset!");
    assetIdx = parseInt(assetIdx);
    if(trxAssets[walletIdx].value < amountVal) return alert("Saldo kas ga cukup!");
    trxAssets[walletIdx].value -= amountVal;
    trxAssets[assetIdx].value += amountVal;
  } else if(type === "jual_aset") {
    if(assetIdx === "") return alert("Pilih aset yg dijual!");
    assetIdx = parseInt(assetIdx);
    trxAssets[assetIdx].value -= amountVal;
    trxAssets[walletIdx].value += amountVal;
  } else if(type === "transfer") {
    if(assetIdx === "" || walletIdx === assetIdx) return alert("Pilih rekening tujuan yang berbeda bro!");
    assetIdx = parseInt(assetIdx);
    if(trxAssets[walletIdx].value < amountVal) return alert("Saldo ga cukup buat transfer!");
    trxAssets[walletIdx].value -= amountVal;
    trxAssets[assetIdx].value += amountVal;
  }

  let finalCategory = (type === 'expense' || type === 'income') ? category : null;
  transactions.push({ id: Date.now(), amount: amountVal, desc, date, type, walletName: trxAssets[walletIdx].name, category: finalCategory, subCategory: subCategory });
  
  document.getElementById("amount").value = "";
  document.getElementById("desc").value = "";
  if(document.getElementById("trxCategory")) document.getElementById("trxCategory").value = "Tanpa Kategori";
  document.getElementById("customTrxCategory").value = "";
  document.getElementById("customTrxCategory").style.display = "none";
  if(document.getElementById("trxSubCategory")) { document.getElementById("trxSubCategory").value = ""; document.getElementById("trxSubCategory").style.display = "none"; }
  
  save(); update();
}

function deleteTransaction(index) {
  if(confirm("Hapus catatan transaksi ini? (Aset harus direvisi manual biar sinkron)")) { transactions.splice(index, 1); save(); update(); }
}

function addBudget() {
  let cat = document.getElementById("budgetCategory").value;
  if (cat === 'Lainnya') {
    cat = document.getElementById("customBudgetCategory").value;
    if (!cat) return alert("Isi nama kategori barunya bro!");
  }
  let amount = parseInt(document.getElementById("budgetAmount").value);
  if(!amount || isNaN(amount)) return alert("Isi nominal budget maksimal bro!");
  
  let budgetYM = document.getElementById("budgetMonthFilter") ? document.getElementById("budgetMonthFilter").value : defaultYM;
  if(!budgetYM) budgetYM = defaultYM;
  if(!budgetsData[budgetYM]) budgetsData[budgetYM] = [];
  
  let existing = budgetsData[budgetYM].findIndex(b => b.category === cat);
  if(existing !== -1) budgetsData[budgetYM][existing].amount = amount;
  else budgetsData[budgetYM].push({category: cat, amount: amount});
  
  document.getElementById("budgetAmount").value = "";
  document.getElementById("budgetCategory").value = "Kebutuhan Pokok";
  document.getElementById("customBudgetCategory").value = "";
  document.getElementById("customBudgetCategory").style.display = "none";
  save(); update();
}

function deleteBudget(ym, index) {
  if(confirm("Hapus anggaran untuk kategori ini?")) { budgetsData[ym].splice(index, 1); save(); update(); }
}

function addSubBudget(ym, index) {
  let name = prompt("Nama Sub Kategori (misal: Makan, Bensin):");
  if(!name || name.trim() === "") return;
  let amountInput = prompt(`Nominal budget maksimal untuk '${name}' (Rp):`);
  let amount = parseInt(amountInput ? amountInput.replace(/\./g, '').replace(/,/g, '') : 0);
  if(isNaN(amount) || amount <= 0) return alert("Nominal tidak valid!");
  
  if(!budgetsData[ym][index].subBudgets) budgetsData[ym][index].subBudgets = [];
  let currentSubTotal = budgetsData[ym][index].subBudgets.reduce((acc, curr) => acc + curr.amount, 0);
  if(currentSubTotal + amount > budgetsData[ym][index].amount) return alert(`Gagal! Total Sub-Budget (${formatRp(currentSubTotal + amount)}) melebihi Batas Maksimal Kategori Utama (${formatRp(budgetsData[ym][index].amount)}).`);

  budgetsData[ym][index].subBudgets.push({name: name.trim(), amount: amount});
  save(); update();
}

function deleteSubBudget(ym, bIdx, subIdx) {
  if(confirm("Hapus sub kategori ini?")) { budgetsData[ym][bIdx].subBudgets.splice(subIdx, 1); save(); update(); }
}

window.inlineEditBudget = function(ym, bIdx, subIdx = null) {
    let budgetList = budgetsData[ym];
    if (!budgetList || !budgetList[bIdx]) return;

    if (subIdx === null) {
        // Edit Anggaran Utama
        let b = budgetList[bIdx];
        let newAmount = prompt(`Edit Batas Maksimal untuk ${b.category} (Rp):`, b.amount);
        if (newAmount !== null) {
            newAmount = parseInt(newAmount.replace(/\D/g, ''));
            if (!isNaN(newAmount) && newAmount >= 0) {
                b.amount = newAmount;
                save();
                update();
            } else {
                alert("Nominal nggak valid bro!");
            }
        }
    } else {
        // Edit Sub Anggaran
        let sub = budgetList[bIdx].subBudgets[subIdx];
        let newAmount = prompt(`Edit Batas Maksimal untuk ${sub.name} (Rp):`, sub.amount);
        if (newAmount !== null) {
            newAmount = parseInt(newAmount.replace(/\D/g, ''));
            if (!isNaN(newAmount) && newAmount >= 0) {
                // Cek biar sub-budget nggak ngelebihi batas induknya
                let currentSubTotal = budgetList[bIdx].subBudgets.reduce((acc, curr, idx) => acc + (idx === subIdx ? 0 : curr.amount), 0);
                if (currentSubTotal + newAmount > budgetList[bIdx].amount) {
                    alert(`Gagal! Total Sub-Budget melebihi Batas Maksimal Kategori Utama (${formatRp(budgetList[bIdx].amount)}).`);
                    return;
                }
                sub.amount = newAmount;
                save();
                update();
            } else {
                alert("Nominal nggak valid bro!");
            }
        }
    }
};

function copyPreviousMonthBudgets() {
  let currentYM = document.getElementById("budgetMonthFilter") ? document.getElementById("budgetMonthFilter").value : defaultYM;
  if(!currentYM) currentYM = defaultYM;
  let allMonths = Object.keys(budgetsData).sort();
  let prevMonths = allMonths.filter(m => m < currentYM);
  if (prevMonths.length === 0) return alert("Belum ada data anggaran dari bulan-bulan sebelumnya buat dicopy bro!");
  
  let lastMonth = prevMonths[prevMonths.length - 1];
  budgetsData[currentYM] = JSON.parse(JSON.stringify(budgetsData[lastMonth]));
  save(); update();
}

function addAsset(){
  let name = document.getElementById("assetName").value;
  let value = parseFloat(document.getElementById("assetValue").value);
  let type = document.getElementById("assetType").value;
  
  if(!name || isNaN(value)) return alert("Isi nama dan nominal!");
  let newData = {name, value, type};
  
  if (type === 'saham') {
    let lot = parseInt(document.getElementById("assetLot").value);
    let avg = parseFloat(document.getElementById("assetAvg").value);
    if(isNaN(lot) || isNaN(avg)) return alert("Isi Jumlah Lot dan Average Harga Beli untuk saham bro!");
    newData.lot = lot; newData.avg = avg; newData.value = value * lot * 100;
  }
  
  let assetYM = document.getElementById("assetMonthFilter") ? document.getElementById("assetMonthFilter").value : defaultYM;
  if(!assetYM) assetYM = defaultYM;
  if(!assetsData[assetYM]) assetsData[assetYM] = [];
  
  assetsData[assetYM].push(newData);
  document.getElementById("assetName").value = "";
  document.getElementById("assetValue").value = "";
  if(document.getElementById("assetLot")) document.getElementById("assetLot").value = "";
  if(document.getElementById("assetAvg")) document.getElementById("assetAvg").value = "";
  save(); update();
}

function updateStockValue(i) {
  let assetYM = document.getElementById("assetMonthFilter") ? document.getElementById("assetMonthFilter").value : defaultYM;
  if(!assetYM) assetYM = defaultYM;
  let curAssets = assetsData[assetYM];
  let asset = curAssets[i];
  
  if (asset.type === 'saham' && asset.lot) {
      let currentPrice = asset.value / (asset.lot * 100);
      let newPrice = prompt(`Update harga saham ${asset.name} (per lembar).\n\nHarga saat ini: Rp ${currentPrice}\nLot dimiliki: ${asset.lot} lot\nAvg beli: Rp ${asset.avg || 0}`, currentPrice);
      if (newPrice === null || newPrice.trim() === "") return;
      newPrice = parseFloat(newPrice.replace(/,/g, '.'));
      if (isNaN(newPrice) || newPrice < 0) return alert("Harga gak valid bro!");
      asset.value = newPrice * asset.lot * 100;
  } else {
      let newVal = prompt(`Update nominal terbaru untuk ${asset.name} (Rp):`, asset.value);
      if (newVal === null || newVal.trim() === "") return;
      newVal = parseFloat(newVal.replace(/,/g, '.'));
      if (isNaN(newVal) || newVal < 0) return alert("Nominal gak valid bro!");
      asset.value = newVal;
  }
  save(); update();
}

function deleteAsset(index) { 
  if(confirm("Hapus aset ini?")) { 
    let assetYM = document.getElementById("assetMonthFilter") ? document.getElementById("assetMonthFilter").value : defaultYM;
    if(!assetYM) assetYM = defaultYM;
    assetsData[assetYM].splice(index, 1); 
    save(); update(); 
  } 
}
window.inlineEditStock = (i, field) => {
  let filterEl = document.getElementById("assetMonthFilter");
  let ym = filterEl ? filterEl.value : defaultYM;
  let a = assetsData[ym][i];
  
  if (field === 'lot') {
    let n = prompt("Edit Jumlah Lot untuk " + a.name + ":", a.lot);
    if (n) {
      n = parseInt(n.replace(/\D/g,''));
      if (!isNaN(n) && n > 0) {
        let curPrice = a.value / (a.lot * 100); // Ambil harga pasar saat ini per lembar
        a.lot = n;
        a.value = curPrice * n * 100; // Sesuaikan total saldo berdasarkan lot baru
        save(); update();
      }
    }
  } else if (field === 'avg') {
    let n = prompt("Edit Average Harga Beli (Rp) untuk " + a.name + ":", a.avg);
    if (n) {
      n = parseFloat(n.replace(/,/g,'.'));
      if (!isNaN(n) && n > 0) {
        a.avg = n;
        save(); update();
      }
    }
  }
};

function copyPreviousMonthAssets() {
  let currentYM = document.getElementById("assetMonthFilter") ? document.getElementById("assetMonthFilter").value : defaultYM;
  if(!currentYM) currentYM = defaultYM;
  let allMonths = Object.keys(assetsData).sort();
  let prevMonths = allMonths.filter(m => m < currentYM);
  if (prevMonths.length === 0) return alert("Belum ada data dari bulan-bulan sebelumnya buat dicopy bro!");
  
  let lastMonth = prevMonths[prevMonths.length - 1];
  assetsData[currentYM] = JSON.parse(JSON.stringify(assetsData[lastMonth]));
  save(); update();
}

function addGoal(){
  let name = document.getElementById("goalName").value; 
  let target = parseInt(document.getElementById("goalValue").value);
  if(!name || isNaN(target)) return alert("Isi nama dan nominal target!");
  
  goals.push({name, target, source: tempSelectedSources}); 
  document.getElementById("goalName").value = "";
  document.getElementById("goalValue").value = "";
  tempSelectedSources = ['all_liquid'];
  document.getElementById("btnSelectSource").innerHTML = `<i class="fas fa-layer-group"></i> Semua Saldo Kas`;
  save(); update();
}

function editGoalSource(i) { openSourceModal('edit', i); }

function editGoal(i) {
  let newName = prompt("Ubah nama target:", goals[i].name); if (!newName) return;
  let newTarget = parseInt(prompt(`Ubah nominal target (Rp):`, goals[i].target));
  if (isNaN(newTarget) || newTarget <= 0) return alert("Nominal gak valid!");
  goals[i].name = newName; goals[i].target = newTarget;
  save(); update();
}

function deleteGoal(index) { if(confirm("Hapus target ini?")) { goals.splice(index, 1); save(); update(); } }

function addDebt(){
  let name = document.getElementById("debtName").value; 
  let amountVal = parseInt(document.getElementById("debtAmount").value);
  let date = document.getElementById("debtDate").value || new Date().toISOString().split('T')[0];
  
  if(!name || isNaN(amountVal)) return alert("Isi nama dan nominal hutang!");
  debts.push({name, total:amountVal, remaining:amountVal, date});
  document.getElementById("debtName").value = "";
  document.getElementById("debtAmount").value = "";
  save(); update();
}

function editDebt(i) {
  let newName = prompt("Ubah nama hutang:", debts[i].name); if (!newName) return;
  let newTotal = parseInt(prompt(`Ubah total pinjaman (Rp):`, debts[i].total));
  if (isNaN(newTotal) || newTotal < 0) return alert("Nominal gak valid!");
  let sudahDibayar = debts[i].total - debts[i].remaining;
  let newRemaining = newTotal - sudahDibayar;
  if (newRemaining < 0) newRemaining = 0; 
  debts[i].name = newName; debts[i].total = newTotal; debts[i].remaining = newRemaining;
  save(); update();
}

function payDebt(i){
  let currentMonthAssets = getAssetsFor(defaultYM);
  let reks = currentMonthAssets.map((a, idx) => a.type === 'rekening' ? {idx, name: a.name, val: a.value} : null).filter(x => x);
  if (reks.length === 0) return alert("Bikin aset jenis 'Rekening Bank / RDN' dulu bro buat sumber dana bayar cicilan!");
  
  let bayarInput = prompt(`Sisa hutang ${debts[i].name} = ${formatRp(debts[i].remaining)}.\nMau bayar berapa?`);
  if(!bayarInput) return;
  let bayar = parseInt(bayarInput.replace(/\./g, '').replace(/,/g, ''));
  if(isNaN(bayar)) return alert("Nominal nggak valid bro!");
  if(bayar > debts[i].remaining) bayar = debts[i].remaining;

  let rekOptions = reks.map((r, index) => `${index + 1}. ${r.name} (Saldo: ${formatRp(r.val)})`).join("\n");
  let rekChoice = prompt(`Pilih sumber dana (masukkan angkanya aja):\n${rekOptions}`, "1");
  if(rekChoice === null) return; 
  rekChoice = parseInt(rekChoice);
  if(isNaN(rekChoice) || rekChoice < 1 || rekChoice > reks.length) return alert("Pilihan rekening gak valid bro!");

  let selectedRekIdx = reks[rekChoice - 1].idx;
  if(currentMonthAssets[selectedRekIdx].value < bayar) return alert(`Waduh, saldo di ${currentMonthAssets[selectedRekIdx].name} ga cukup buat bayar!`);

  currentMonthAssets[selectedRekIdx].value -= bayar;
  debts[i].remaining -= bayar;
  if(debts[i].remaining < 0) debts[i].remaining = 0;

  transactions.push({ id: Date.now(), amount: bayar, desc: "Bayar Cicilan: " + debts[i].name, date: new Date().toISOString().split('T')[0], type: "expense", walletName: currentMonthAssets[selectedRekIdx].name, category: "Cicilan / Tagihan" });

  alert(`Sukses! Saldo ${currentMonthAssets[selectedRekIdx].name} otomatis terpotong Rp ${bayar.toLocaleString('id-ID')}.`);
  save(); update();
}

function deleteDebt(index) { if(confirm("Hapus catatan hutang?")) { debts.splice(index, 1); save(); update(); } }

function toggleAccordion(element) {
  element.nextElementSibling.classList.toggle('active');
  let icon = element.querySelector('.fa-chevron-down, .fa-chevron-up');
  if(icon.classList.contains('fa-chevron-down')){ icon.classList.replace('fa-chevron-down', 'fa-chevron-up'); } 
  else { icon.classList.replace('fa-chevron-up', 'fa-chevron-down'); }
}

function triggerAnim(id, diff, invertColor = false) {
  let el = document.getElementById(id);
  if(!el) return;
  el.className = "anim-float"; 
  void el.offsetWidth; 
  let sign = diff > 0 ? "+ " : "- ";
  
  if(isBalanceHidden) el.innerText = sign + "***.***";
  else el.innerText = sign + formatRp(Math.abs(diff));
  
  let isGood = diff > 0;
  if (invertColor) isGood = diff < 0; 
  el.classList.add(isGood ? "anim-up" : "anim-down");
}

let barChart, donutChart;
function getMonthlyData(range){
  let now=new Date(), data={};
  for(let i=range-1;i>=0;i--){
    let d=new Date(now.getFullYear(),now.getMonth()-i,1);
    let monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
    data[monthNames[d.getMonth()] + " " + d.getFullYear()] = { income: 0, expense: 0 };
  }
  transactions.forEach(t=>{
    let d = new Date(t.date); let key = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"][d.getMonth()] + " " + d.getFullYear();
    if(data[key]){
      if(t.type === "income") data[key].income += t.amount;
      else if(t.type === "expense") data[key].expense += t.amount;
    }
  });
  return data;
}

function renderMonthlyChart(range){
  let dataObj = getMonthlyData(range); let labels = Object.keys(dataObj);
  document.querySelectorAll('.chart-controls button').forEach(btn => btn.classList.remove('active'));
  document.querySelector(`.chart-controls button[onclick="renderMonthlyChart(${range})"]`).classList.add('active');

  if(barChart) barChart.destroy();
  barChart = new Chart(document.getElementById("barChart"),{
    type: 'bar', data: { labels: labels, datasets: [
      { label: 'Pemasukan', data: labels.map(l => dataObj[l].income), backgroundColor: '#10b981', borderRadius: 4 },
      { label: 'Pengeluaran', data: labels.map(l => dataObj[l].expense), backgroundColor: '#ef4444', borderRadius: 4 }
    ]}, options: { maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
  });
}

function update(){
  updateDropdowns();
  
  const reminderContainer = document.getElementById("debtReminderContainer");
  if(reminderContainer) {
      let reminderHTML = "";
      let today = new Date(); let currentDay = today.getDate();
      let currentMonthPrefix = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, '0');
      let activeDebts = debts.filter(d => d.remaining > 0);
      
      if(activeDebts.length > 0) {
          let tempHTML = `<div class="reminder-card"><div class="reminder-title"><i class="fas fa-bell" style="color: var(--warning);"></i> Status Cicilan Bulanan</div>`;
          let monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
          
          activeDebts.forEach(d => {
              let parts = d.date.split('-');
              let dueYear = parts[0]; let dueMonth = parseInt(parts[1]) - 1; let dueDay = parseInt(parts[2]);
              let lunasStr = isNaN(dueMonth) ? "Belum Diatur" : monthNames[dueMonth] + " " + dueYear;
              let warningText = "";
              
              let isPaidThisMonth = transactions.some(t => t.type === 'expense' && t.desc.toLowerCase().includes(d.name.toLowerCase()) && t.date.startsWith(currentMonthPrefix));

              if (isPaidThisMonth) warningText = `<span style="color: var(--success); font-weight: 700; font-size: 0.85rem; margin-left: 10px; background: #dcfce7; padding: 2px 8px; border-radius: 4px;">(Sudah Dibayar Bulan Ini ✓)</span>`;
              else if (!isNaN(dueDay)) {
                  let diff = dueDay - currentDay;
                  if (diff === 0) warningText = `<span style="color: var(--danger); font-weight: 700; font-size: 0.85rem; margin-left: 10px; background: #fee2e2; padding: 2px 8px; border-radius: 4px;">(HARI INI JATUH TEMPO!)</span>`;
                  else if (diff > 0 && diff <= 7) warningText = `<span style="color: var(--danger); font-weight: 700; font-size: 0.85rem; margin-left: 10px; background: #fee2e2; padding: 2px 8px; border-radius: 4px;">(H-${diff} Jatuh Tempo)</span>`;
                  else if (diff < 0) warningText = `<span style="color: #b91c1c; font-weight: 700; font-size: 0.85rem; margin-left: 10px; background: #fef08a; padding: 2px 8px; border-radius: 4px;">(Lewat ${Math.abs(diff)} hari)</span>`;
                  else warningText = `<span style="color: var(--primary-dark); font-weight: 600; font-size: 0.85rem; margin-left: 10px; background: #eff6ff; padding: 2px 8px; border-radius: 4px;">(Aman, ${diff} hari lagi)</span>`;
              }
              tempHTML += `<div class="reminder-item"><i class="fas fa-chevron-right"></i> <span><strong>${d.name}</strong> - Tgl <strong>${isNaN(dueDay) ? '-' : dueDay}</strong> <span style="color:#64748b; font-size: 0.85rem;">(Lunas: ${lunasStr})</span> ${warningText}</span></div>`;
          });
          tempHTML += `</div>`;
          reminderHTML = tempHTML;
      }
      reminderContainer.innerHTML = reminderHTML;
  }
  
  let budgetFilter = document.getElementById("budgetMonthFilter"); let assetFilter = document.getElementById("assetMonthFilter");
  if (budgetFilter && !budgetFilter.value) budgetFilter.value = defaultYM;
  if (assetFilter && !assetFilter.value) assetFilter.value = defaultYM;
  
  let budgetYM = budgetFilter ? budgetFilter.value : defaultYM;
  let assetYM = assetFilter ? assetFilter.value : defaultYM;

  let assetTargetDate = new Date(assetYM + "-01");
  let assetTargetMonth = assetTargetDate.getMonth();
  let assetTargetYear = assetTargetDate.getFullYear();

  let curAssets = getAssetsFor(defaultYM); 
  let dispAssets = getAssetsFor(assetYM); 
  let currentBudgets = getBudgetsFor(budgetYM); 
  assets = curAssets; 

  let balance = 0; let totalAssetValue = 0;
  let kategori = { 'Rekening Bank': 0, 'Saham': 0, 'Emas': 0, 'Aset Bergerak': 0, 'Aset Tetap': 0 };
  const assetTypeMap = { 'rekening': 'Rekening Bank', 'saham': 'Saham', 'emas': 'Emas', 'bergerak': 'Aset Bergerak', 'nonbergerak': 'Aset Tetap' };
  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  
  if(document.getElementById("budgetMonthLabel")) { let bDt = new Date(budgetYM + "-01"); document.getElementById("budgetMonthLabel").innerText = `${monthNames[bDt.getMonth()]} ${bDt.getFullYear()}`; }
  if(document.getElementById("assetMonthLabel")) { let aDt = new Date(assetYM + "-01"); document.getElementById("assetMonthLabel").innerText = `${monthNames[aDt.getMonth()]} ${aDt.getFullYear()}`; }

  curAssets.forEach(a => {
    if(a.type === 'rekening') balance += a.value;
    else totalAssetValue += a.value;
    kategori[assetTypeMap[a.type]] += a.value;
  });

  let totalDebt = 0; debts.forEach(d => totalDebt += d.remaining);
  let wealth = balance + totalAssetValue - totalDebt;

  if (lastBalance !== null && lastBalance !== balance) triggerAnim("balanceAnim", balance - lastBalance);
  if (lastWealth !== null && lastWealth !== wealth) triggerAnim("wealthAnim", wealth - lastWealth);
  if (lastDebt !== null && lastDebt !== totalDebt) triggerAnim("debtAnim", totalDebt - lastDebt, true); 
  
  lastBalance = balance; lastWealth = wealth; lastDebt = totalDebt;

  if(document.getElementById("balance")) {
      document.getElementById("balance").innerText = isBalanceHidden ? "***.***" : balance.toLocaleString('id-ID');
  }
  if(document.getElementById("wealth")) {
      document.getElementById("wealth").innerText = isBalanceHidden ? "***.***" : wealth.toLocaleString('id-ID');
  }
  if(document.getElementById("totalDebtDisplay")) {
      document.getElementById("totalDebtDisplay").innerText = isBalanceHidden ? "***.***" : totalDebt.toLocaleString('id-ID');
  }

  const trxList = document.getElementById("trxList");
    if(trxList) {
        trxList.innerHTML = "";
        let searchKeyword = document.getElementById("searchTrx")?.value.toLowerCase() || "";
        let filterMonth = document.getElementById("filterMonthTrx")?.value || "";

        transactions
          .filter(t => {
              let matchSearch = t.desc.toLowerCase().includes(searchKeyword);
              let matchMonth = filterMonth === "" || t.date.startsWith(filterMonth);
              return matchSearch && matchMonth;
          })
          .sort((a,b) => new Date(b.date) - new Date(a.date))
          .slice(0, 20) // Nampilin 20 mutasi terakhir
          .forEach((t) => {
            let originalIndex = transactions.findIndex(orig => orig.id === t.id);
            let typeIcon = t.type === 'income' ? '<i class="fas fa-arrow-down text-success"></i>' : (t.type === 'expense' ? '<i class="fas fa-arrow-up text-danger"></i>' : '<i class="fas fa-exchange-alt text-primary"></i>');
            
            trxList.innerHTML += `
                <tr>
                    <td style="color:#64748b;">${t.date}</td>
                    <td>${typeIcon}</td>
                    <td ondblclick="inlineEditTrx(${t.id}, 'desc')" style="cursor:pointer;" title="Klik 2x Edit Keterangan">
                        <strong style="color:#1e293b;">${t.desc}</strong>
                        ${t.category ? `<span style="background:#e2e8f0; padding:2px 8px; border-radius:12px; font-size:0.75rem; margin-left:8px;">${t.category}</span>` : ""}
                        <br><small style="color:#94a3b8;">${t.walletName}</small>
                    </td>
                    <td ondblclick="inlineEditTrx(${t.id}, 'amount')" style="font-weight:600; cursor:pointer;" title="Klik 2x Edit Nominal">
                        ${isBalanceHidden ? "Rp ***.***" : formatRp(t.amount)}
                    </td>
                    <td style="text-align: center;">
                        <button class="btn-danger" style="padding: 6px 10px;" onclick="deleteTransaction(${originalIndex})"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>`;
          });
    }

 renderBudgetList(currentBudgets, budgetYM);

  const assetListContainer = document.getElementById("assetListContainer");
  if(assetListContainer) {
    assetListContainer.innerHTML = "";
    if(dispAssets.length === 0) {
      assetListContainer.innerHTML = `
        <div style="text-align:center; padding: 50px 20px; background: white; border-radius: 16px; border: 1px dashed #cbd5e1;">
          <div style="width: 60px; height: 60px; background: #f1f5f9; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px;"><i class="fas fa-box-open" style="font-size: 1.5rem; color: #94a3b8;"></i></div>
          <h3 style="margin: 0 0 5px; color:#334155;">Aset Kosong</h3>
          <p style="color:#64748b; font-size: 0.95rem; margin-bottom:20px;">Belum ada pencatatan aset untuk bulan <b>${monthNames[assetTargetMonth]} ${assetTargetYear}</b>.</p>
          <button class="action" style="margin: 0 auto; background: var(--success); box-shadow: 0 4px 6px rgba(34, 197, 94, 0.2);" onclick="copyPreviousMonthAssets()"><i class="fas fa-copy"></i> Salin Aset Bulan Sebelumnya</button>
        </div>
      `;
    } else {
      let groupedAssets = {};
      dispAssets.forEach((a, i) => { let catName = assetTypeMap[a.type]; if(!groupedAssets[catName]) groupedAssets[catName] = []; groupedAssets[catName].push({...a, originalIndex: i}); });

      for (let cat in groupedAssets) {
        let catTotal = groupedAssets[cat].reduce((sum, item) => sum + item.value, 0);
        let catIcon = cat === 'Saham' ? 'fa-chart-line' : cat === 'Emas' ? 'fa-coins' : cat === 'Rekening Bank' ? 'fa-wallet' : 'fa-box';
        
        let totalDisplay = isBalanceHidden ? "Rp ***.***" : formatRp(catTotal);
        
        let groupHTML = `<div class="accordion-header" onclick="toggleAccordion(this)"><span style="font-size: 0.95rem; font-weight: 700; color: #334155; display: flex; align-items: center;"><i class="fas ${catIcon} text-primary" style="margin-right:12px; font-size: 1.1rem;"></i> ${cat.toUpperCase()}</span><span style="font-weight: 600;">${totalDisplay} <i class="fas fa-chevron-down" style="font-size: 0.8em; margin-left:12px; color:#94a3b8;"></i></span></div><div class="accordion-content"><table style="margin-top: 0;"><tbody>`;

        groupedAssets[cat].forEach(a => {
          let stockInfo = "";
          let valDisplay = isBalanceHidden ? "Rp ***.***" : formatRp(a.value);
          
          if (a.type === 'saham' && a.lot && a.avg) {
             let modal = a.lot * 100 * a.avg; let profitLoss = a.value - modal;
             let pct = ((profitLoss / modal) * 100).toFixed(2); let colorClass = profitLoss >= 0 ? 'text-success' : 'text-danger'; let sign = profitLoss >= 0 ? '+' : '';
             
             let avgDisplay = isBalanceHidden ? "Rp ***.***" : formatRp(a.avg);
             let plDisplay = isBalanceHidden ? "Rp ***.***" : formatRp(profitLoss);
             
             stockInfo = `<br><small><span ondblclick="inlineEditStock(${a.originalIndex}, 'lot')" style="cursor:pointer; border-bottom:1px dashed #cbd5e1;" title="Klik 2x Edit Lot">${a.lot} Lot</span> | Avg: <span ondblclick="inlineEditStock(${a.originalIndex}, 'avg')" style="cursor:pointer; border-bottom:1px dashed #cbd5e1;" title="Klik 2x Edit Avg">${avgDisplay}</span></small><div class="${colorClass}" style="font-size: 0.8rem; font-weight:700;">${sign}${plDisplay} (${sign}${pct}%)</div>`;
          }
          groupHTML += `<tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 12px 15px;"><strong style="color: #1e293b; font-size:0.95rem;">${a.name}</strong>${stockInfo}</td><td style="padding: 12px 15px; font-weight: 500; color: #475569;">${valDisplay}</td><td style="padding: 12px 15px; text-align: right;"><button class="btn-warning" style="padding: 6px 10px; margin-right: 5px;" onclick="updateStockValue(${a.originalIndex})" title="Edit Harga"><i class="fas fa-edit"></i></button><button class="btn-danger" style="padding: 6px 10px;" onclick="deleteAsset(${a.originalIndex})"><i class="fas fa-trash"></i></button></td></tr>`;
        });
        groupHTML += `</tbody></table></div>`; assetListContainer.innerHTML += groupHTML;
      }
    }
  }

  const debtList = document.getElementById("debtList");
  if(debtList) {
    debtList.innerHTML = "";
    debts.forEach((d, i) => {
      let status = d.remaining === 0 ? '<span class="text-success" style="font-weight:700; background: #dcfce7; padding: 4px 10px; border-radius: 12px; font-size: 0.85rem;"><i class="fas fa-check-circle"></i> Lunas</span>' : `<span style="font-weight:600; color:#1e293b;">${isBalanceHidden ? "Rp ***.***" : formatRp(d.remaining)}</span>`;
      let tDisplay = isBalanceHidden ? "Rp ***.***" : formatRp(d.total);
      
      debtList.innerHTML += `<tr><td><strong style="color:#1e293b;">${d.name}</strong><br><small style="color:#64748b"><i class="far fa-calendar-alt"></i> Jatuh Tempo: ${d.date}</small></td><td style="color:#475569;">${tDisplay}</td><td>${status}</td><td style="display:flex; gap:8px;">${d.remaining > 0 ? `<button class="btn-success" style="padding: 6px 12px; font-weight: 600;" onclick="payDebt(${i})"><i class="fas fa-money-bill-wave"></i> Bayar</button>` : ''}<button class="btn-warning" style="padding: 6px 10px;" onclick="editDebt(${i})"><i class="fas fa-edit"></i></button><button class="btn-danger" style="padding: 6px 10px;" onclick="deleteDebt(${i})"><i class="fas fa-trash"></i></button></td></tr>`;
    });
  }

  const goalList = document.getElementById("goalList");
  if(goalList) {
    goalList.innerHTML = "";
    goals.forEach((g, i) => {
      let currentAmount = 0; let sourceLabel = "";
      let srcList = Array.isArray(g.source) ? g.source : [g.source || 'all_liquid'];

      if (srcList.includes('all_liquid')) {
         currentAmount = balance; sourceLabel = "Semua Saldo Kas (Rekening)";
      } else {
         let validNames = [];
         srcList.forEach(srcName => { let assetMatch = curAssets.find(a => a.name === srcName); if(assetMatch) { currentAmount += assetMatch.value; validNames.push(srcName); } });
         if(validNames.length === 0) sourceLabel = "Aset udah dihapus"; else if(validNames.length <= 2) sourceLabel = validNames.join(" + "); else sourceLabel = validNames.length + " Sumber Gabungan";
      }

      let percent = Math.min((currentAmount / g.target) * 100, 100).toFixed(1); 
      let isAchieved = currentAmount >= g.target;
      
      let caDisplay = isBalanceHidden ? "Rp ***.***" : formatRp(Math.min(currentAmount, g.target));
      let tgDisplay = isBalanceHidden ? "Rp ***.***" : formatRp(g.target);
      
      goalList.innerHTML += `
        <div class="card" style="margin-bottom: 0; padding: 20px; border-color: ${isAchieved ? '#86efac' : 'var(--border)'}; background: ${isAchieved ? '#f0fdf4' : '#ffffff'};">
          <div class="progress-header" style="align-items: center; margin-bottom: 12px;">
            <strong style="font-size: 1.1rem; color: #1e293b;">${g.name}</strong>
            <div style="display:flex; gap:6px;"><button style="padding: 4px 8px; background: #0ea5e9; color: white; border: none; border-radius: 6px; cursor: pointer; transition: 0.2s;" onmouseover="this.style.background='#0284c7'" onmouseout="this.style.background='#0ea5e9'" onclick="editGoalSource(${i})" title="Ganti/Tambah Sumber Dana"><i class="fas fa-coins"></i></button><button class="btn-warning" style="padding: 4px 8px; border-radius: 6px;" onclick="editGoal(${i})" title="Edit Nama & Nominal"><i class="fas fa-edit"></i></button><button class="btn-danger" style="padding: 4px 8px; border-radius: 6px;" onclick="deleteGoal(${i})" title="Hapus Target"><i class="fas fa-times"></i></button></div>
          </div>
          <div style="font-size: 0.85rem; color: #64748b; margin-bottom: 8px;">Sumber: <strong style="color: #475569;">${sourceLabel}</strong></div>
          <div style="font-size: 0.95rem; color: #1e293b; margin-bottom: 12px;">Terkumpul: <strong>${caDisplay}</strong> <span style="color:#94a3b8; font-size:0.85rem;">/ ${tgDisplay}</span></div>
          <div class="progress" style="margin-bottom: 10px; height: 12px; background: #e2e8f0;"><div class="progress-bar" style="width:${percent}%; background: ${isAchieved ? 'var(--success)' : 'var(--primary)'}"></div></div>
          <div style="display: flex; justify-content: space-between; align-items: center;"><span style="font-weight: 700; font-size: 0.9rem; color: ${isAchieved ? 'var(--success)' : 'var(--primary)'}">${percent}% ${isAchieved ? 'Tercapai' : ''}</span>${isAchieved ? '<i class="fas fa-check-circle" style="color:var(--success); font-size:1.4rem;"></i>' : ''}</div>
        </div>
      `;
    });
  }

  if(document.getElementById("donutChart")){
    if(donutChart) donutChart.destroy();
    let chartData = [kategori['Rekening Bank'], kategori['Saham'], kategori['Emas'], kategori['Aset Bergerak'], kategori['Aset Tetap']];
    let chartLabels = ['Rekening Bank', 'Saham', 'Emas', 'Aset Bergerak', 'Aset Tetap'];
    let filteredData = []; let filteredLabels = [];
    for(let i=0; i<chartData.length; i++){ if(chartData[i] > 0) { filteredData.push(chartData[i]); filteredLabels.push(chartLabels[i]); } }
    if(filteredData.length === 0) { filteredData = [1]; filteredLabels = ["Belum ada aset"]; }

    donutChart = new Chart(document.getElementById("donutChart"),{
      type: 'doughnut', data: { labels: filteredLabels, datasets: [{ data: filteredData, backgroundColor: ['#0ea5e9', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'], borderWidth: 0 }] },
      options: { maintainAspectRatio: false, cutout: '70%', plugins: { legend: { position: 'right', labels: { usePointStyle: true, boxWidth: 8 } } } }
    });
    renderMonthlyChart(12);
  }
}

function renderBudgetList(list, ym) {
  try {
    const container = document.getElementById("budgetList"); 
    if(!container) return;
    container.innerHTML = "";
    
    let bMonthAssets = getAssetsFor(ym); 
    let cash = 0; 
    bMonthAssets.forEach(a => { if(a.type === 'rekening') cash += a.value; });

    if (!list || list.length === 0) {
        const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        let mName = monthNames[parseInt(ym.split('-')[1]) - 1];
        
        container.innerHTML = `<div style="grid-column: span 2; text-align:center; padding: 50px 20px; background: white; border-radius: 16px; border: 1px dashed #cbd5e1;"><div style="width: 60px; height: 60px; background: #f1f5f9; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px;"><i class="fas fa-clipboard-list" style="font-size: 1.5rem; color: #94a3b8;"></i></div><h3 style="margin: 0 0 5px; color:#334155;">Anggaran Kosong</h3><p style="color:#64748b; font-size: 0.95rem; margin-bottom:20px;">Belum ada rencana pengeluaran untuk bulan <b>${mName}</b>.</p><button class="action" style="margin: 0 auto; background: var(--success); box-shadow: 0 4px 6px rgba(34, 197, 94, 0.2);" onclick="copyPreviousMonthBudgets()"><i class="fas fa-copy"></i> Salin Data Bulan Sebelumnya</button></div>`;
        
        const statusCard = document.getElementById("budgetStatusCard"); 
        const budgetVsLiquid = document.getElementById("budgetVsLiquid");
        if(statusCard && budgetVsLiquid){
          budgetVsLiquid.innerHTML = `<span style="color:var(--success)">Rp 0</span> <small style="color:#94a3b8">/ Rp 0</small>`;
          statusCard.style.backgroundColor = '#f0fdf4'; 
          statusCard.style.borderColor = '#bbf7d0';
          document.getElementById("budgetCardTitle").innerText = "Ringkasan Anggaran Bulan Ini";
          let descEl = document.querySelector("#budgetStatusCard p");
          if(descEl) descEl.innerHTML = `Total Pengeluaran (Mutasi) vs Total Rencana Anggaran<br><span style="color: #3b82f6; font-weight: 600; font-size: 0.85rem;"><i class="fas fa-wallet"></i> Saldo Kas Saat Ini: ${formatRp(cash)}</span>`;
        }
        return;
    }
    
    let spentThisMonth = {};
    transactions.filter(t => t.date.startsWith(ym) && t.type === 'expense').forEach(t => { 
        spentThisMonth[t.category] = (spentThisMonth[t.category] || 0) + t.amount; 
    });

    let totalTargetBulanIni = 0;
    let totalRealisasiBulanIni = 0;

    list.forEach((b, i) => {
        let spent = spentThisMonth[b.category] || 0;
        let target = b.amount || 0;
        
        totalTargetBulanIni += target;
        totalRealisasiBulanIni += spent;
        
        let pct = target > 0 ? Math.round((spent / target) * 100) : 0;
        let isOver = pct > 100;
        let isFull = pct === 100;
        
        let barColor = isOver ? 'var(--danger)' : (isFull ? 'var(--success)' : (pct >= 80 ? 'var(--warning)' : 'var(--primary)'));
        let bgCard = isOver ? '#fff1f2' : '#ffffff';
        let statusTxt = isOver ? '<span style="color:var(--danger); font-size:0.75rem; margin-left:8px;">(Over Budget!)</span>' : (isFull ? '<span class="budget-badge badge-paid" style="color:var(--success); font-size:0.8rem; margin-left:8px;">✓ Terpenuhi</span>' : '');

        // Hitung Sisa Kategori Utama
        let sisaUtama = Math.max(0, target - spent);
        let sisaUtamaDisplay = isBalanceHidden ? "Rp ***.***" : formatRp(sisaUtama);

        let subHTML = '';
        if(b.subBudgets && b.subBudgets.length > 0) {
            subHTML += `<div style="margin-top: 15px; border-top: 1px dashed #e2e8f0; padding-top: 12px;">`;
            b.subBudgets.forEach((sub, subIdx) => {
                let sSpent = transactions.filter(t => t.date.startsWith(ym) && t.type === 'expense' && t.category === b.category && t.subCategory === sub.name).reduce((acc, t) => acc + t.amount, 0);
                let sPct = sub.amount > 0 ? Math.round((sSpent / sub.amount) * 100) : 0;
                
                // Hitung Sisa Sub Kategori
                let sisaSub = Math.max(0, sub.amount - sSpent);
                let sisaSubDisplay = isBalanceHidden ? "Rp ***.***" : formatRp(sisaSub);
                
                subHTML += `<div style="display:flex; justify-content:space-between; font-size: 0.85rem; margin-bottom: 5px;"><span><i class="fas fa-level-up-alt fa-rotate-90" style="margin-right:8px; color:#cbd5e1;"></i> ${sub.name} <button onclick="deleteSubBudget('${ym}', ${i}, ${subIdx})" style="background:none;border:none;color:#ef4444;cursor:pointer;padding:0;margin-left:5px;"><i class="fas fa-times"></i></button></span><strong style="color:${sSpent > sub.amount ? 'var(--danger)' : (sSpent === sub.amount ? 'var(--success)' : '#1e293b')}">${formatRp(sSpent)} <span ondblclick="inlineEditBudget('${ym}', ${i}, ${subIdx})" title="Klik 2x Edit Rencana Sub" style="color:#94a3b8; font-size:0.75rem; font-weight:normal; cursor:pointer; border-bottom:1px dashed #cbd5e1;">/ ${formatRp(sub.amount)}</span></strong></div>
                <div class="progress" style="height:6px; margin-bottom:4px; background: ${sSpent > sub.amount ? '#fee2e2' : '#e0f2fe'};"><div class="progress-bar" style="width:${Math.min(sPct, 100)}%; background:${sSpent > sub.amount ? 'var(--danger)' : (sSpent === sub.amount ? 'var(--success)' : '#0ea5e9')}"></div></div>
                <div style="text-align: right; font-size: 0.75rem; color: #64748b; margin-bottom: 10px; font-weight: 500;">Sisa: <span style="color:${sisaSub > 0 ? '#1e293b' : 'var(--success)'}">${sisaSubDisplay}</span></div>`;
            });
            subHTML += `</div>`;
        }

        container.innerHTML += `
            <div class="card" style="margin-bottom: 0; background: ${bgCard}; border-left: 5px solid ${barColor}">
                <div class="progress-header" style="margin-bottom: 12px;">
                    <strong style="font-size: 1.05rem; display:flex; align-items:center;">${b.category} ${statusTxt}</strong>
                    <div style="display:flex; gap:8px;">
                        <button style="padding: 4px 8px; background: #e0f2fe; color: #0ea5e9; border: none; border-radius: 6px; font-size: 0.75rem; font-weight: 600; cursor: pointer; display:flex; align-items:center; gap:4px;" onclick="addSubBudget('${ym}', ${i})"><i class="fas fa-plus"></i> Sub</button>
                        <button class="btn-danger" style="padding: 4px 8px; background: transparent; color: #cbd5e1; transition: color 0.2s;" onmouseover="this.style.color='var(--danger)'" onmouseout="this.style.color='#cbd5e1'" onclick="deleteBudget('${ym}', ${i})"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                <div style="font-size: 0.95rem; margin-bottom: 10px;">Terpakai: <strong>${formatRp(spent)}</strong> <small ondblclick="inlineEditBudget('${ym}', ${i})" title="Klik 2x Edit Rencana" style="color:#94a3b8; cursor:pointer; border-bottom:1px dashed #cbd5e1;">/ ${formatRp(target)}</small></div>
                <div class="progress" style="margin-bottom: 8px; background: ${isOver ? '#fee2e2' : '#f1f5f9'};"><div class="progress-bar" style="width:${Math.min(pct, 100)}%; background: ${barColor}"></div></div>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="font-size: 0.85rem; color: #64748b; font-weight:600;">Sisa: <span style="color:${sisaUtama > 0 ? '#1e293b' : 'var(--success)'};">${sisaUtamaDisplay}</span></div>
                    <div style="text-align: right; font-weight: 700; font-size: 0.85rem; color: ${barColor}">${pct}%</div>
                </div>
                ${subHTML}
            </div>`;
    });

    const sCard = document.getElementById("budgetStatusCard");
    const bVsL = document.getElementById("budgetVsLiquid");
    if(sCard && bVsL) {
        let isWarning = totalRealisasiBulanIni > totalTargetBulanIni;
        
        bVsL.innerHTML = `<span style="color:${isWarning ? 'var(--danger)' : 'var(--success)'}">${formatRp(totalRealisasiBulanIni)}</span> <small style="color:#94a3b8">/ ${formatRp(totalTargetBulanIni)}</small>`;
        
        sCard.style.background = isWarning ? '#fff1f2' : '#f0fdf4';
        sCard.style.borderColor = isWarning ? '#fecaca' : '#bbf7d0';
        
        document.getElementById("budgetCardTitle").innerText = "Ringkasan Anggaran Bulan Ini";
        let descEl = document.querySelector("#budgetStatusCard p");
        if(descEl) descEl.innerHTML = `Total Pengeluaran (Mutasi) vs Total Rencana Anggaran<br><span style="color: #3b82f6; font-weight: 600; font-size: 0.85rem;"><i class="fas fa-wallet"></i> Saldo Kas Saat Ini: ${formatRp(cash)}</span>`;
    }
  } catch(e) { console.error("Render Error:", e); }
}
// ==========================================
// FITUR BARU: MINIMIZE GUEST LIST WEDDING
// ==========================================
window.toggleGuestList = function(tipe) {
    let tabel = document.getElementById("wedGuestList" + tipe);
    let ikon = document.getElementById("icon-guest-" + tipe);
    
    // Cek kalau tabel lagi disembunyiin
    if (tabel.style.display === "none") {
        tabel.style.display = "table"; // Munculin tabel
        ikon.classList.remove("fa-chevron-down");
        ikon.classList.add("fa-chevron-up"); // Ubah panah ke atas
    } else {
        tabel.style.display = "none"; // Sembunyiin tabel
        ikon.classList.remove("fa-chevron-up");
        ikon.classList.add("fa-chevron-down"); // Ubah panah ke bawah
    }
};
// 1. Fungsi Edit Mutasi (Klik 2x)
window.inlineEditTrx = function(id, field) {
    let trx = transactions.find(t => t.id === id);
    if (!trx) return;
    let oldVal = trx[field];
    let newVal = prompt(`Edit ${field === 'amount' ? 'Nominal' : 'Keterangan'} Transaksi:`, oldVal);
    
    if (newVal !== null && newVal.trim() !== "") {
        if (field === 'amount') {
            let val = parseInt(newVal.replace(/\D/g, ''));
            if (isNaN(val)) return alert("Angka nggak valid!");
            // Logika auto-update saldo aset (khusus Income & Expense)
            let diff = val - oldVal;
            let assetYM = trx.date.substring(0, 7);
            if (assetsData[assetYM]) {
                let targetAsset = assetsData[assetYM].find(a => a.name === trx.walletName);
                if (targetAsset) {
                    if (trx.type === 'income') targetAsset.value += diff;
                    else if (trx.type === 'expense') targetAsset.value -= diff;
                }
            }
            trx.amount = val;
        } else {
            trx[field] = newVal.trim();
        }
        save(); update();
    }
};

// 2. Fungsi Export Mutasi ke CSV
window.exportTrxToCSV = function() {
    if(transactions.length === 0) return alert("Data kosong!");
    let csv = "Tanggal,Jenis,Keterangan,Kategori,Rekening,Nominal\n";
    transactions.sort((a,b) => new Date(b.date) - new Date(a.date)).forEach(t => {
        csv += `${t.date},${t.type},${t.desc.replace(/,/g," ")},${t.category || '-'},${t.walletName},${t.amount}\n`;
    });
    let a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
    a.download = 'ProTama_Mutasi_Keuangan.csv';
    a.click();
};

// 3. Fungsi Render Donut Chart Kategori di Laporan
let expenseDonutChart;
function renderExpenseDonut(dataObj) {
    const ctx = document.getElementById('expenseDonutChart');
    if (!ctx) return;
    if (expenseDonutChart) expenseDonutChart.destroy();
    
    let labels = Object.keys(dataObj);
    let values = Object.values(dataObj);
    
    if(labels.length === 0) { labels = ["Belum ada data"]; values = [1]; }

    expenseDonutChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4'],
                borderWidth: 0
            }]
        },
        options: { maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    });
}
if (document.getElementById("barChart")) setTimeout(update, 100);
