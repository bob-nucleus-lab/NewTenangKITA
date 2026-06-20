(() => {
  'use strict';

  const LOCAL_KEY = 'newtk-v06-preferences';
  const SESSION_KEY = 'newtk-v06-session';
  const SESSION_MS = 15 * 60 * 1000;
  const defaults = {
    route: 'welcome',
    tab: 'home',
    concern: null,
    activeNeed: 'living',
    state: '',
    household: '',
    largeText: false,
    simpleMode: false,
    verified: false,
    consents: [],
    authAt: 0,
    authError: '',
    accessNeeds: [],
    caregiverMode: false,
    highContrast: false,
    dosmStatus: 'idle',
    dosmRows: [],
    dosmUpdatedAt: '',
    dosmError: ''
  };

  function parseStore(store, key) {
    try { return JSON.parse(store.getItem(key)) || {}; } catch { return {}; }
  }

  const local = parseStore(localStorage, LOCAL_KEY);
  const session = parseStore(sessionStorage, SESSION_KEY);
  const sessionValid = session.verified && Date.now() - Number(session.authAt || 0) < SESSION_MS;
  const state = {
    ...defaults,
    ...local,
    verified: Boolean(sessionValid),
    consents: sessionValid && Array.isArray(session.consents) ? session.consents : [],
    authAt: sessionValid ? session.authAt : 0
  };
  if (!state.verified && ['consent', 'auth-progress'].includes(state.route)) {
    state.route = 'main';
    state.tab = 'benefits';
  }
  const app = document.querySelector('#app');

  const concerns = {
    groceries: { icon: '◫', label: 'Belanja dapur', desc: 'Harga barang asas, SARA dan pilihan berhampiran.' },
    fuel: { icon: '◉', label: 'Petrol & perjalanan', desc: 'Subsidi bahan api dan anggaran perjalanan.' },
    bills: { icon: '▤', label: 'Bil & rumah', desc: 'Keutamaan bil, perumahan dan bantuan berkaitan.' },
    children: { icon: '☆', label: 'Anak & sekolah', desc: 'Keperluan pendidikan dan perbelanjaan keluarga.' },
    income: { icon: '◇', label: 'Kerja & pendapatan', desc: 'Program pekerjaan, latihan dan sokongan pendapatan.' },
    urgent: { icon: '!', label: 'Bantuan segera', desc: 'Saluran rasmi apabila keadaan memerlukan perhatian.' }
  };

  const sources = {
    sara: {
      name: 'SARA / MyKasih',
      scope: 'Baki, masa kemas kini dan transaksi ringkas',
      url: 'https://sara.gov.my/'
    },
    budi: {
      name: 'BUDI95',
      scope: 'Status dan penggunaan subsidi bahan api',
      url: 'https://www.budi95.gov.my/'
    },
    str: {
      name: 'STR / HASiL',
      scope: 'Status permohonan dan bayaran',
      url: 'https://bantuantunai.hasil.gov.my/'
    },
    padu: {
      name: 'PADU',
      scope: 'Profil isi rumah yang disahkan kerajaan, tertakluk kelulusan dan kebenaran khusus',
      url: 'https://padu.gov.my/',
      future: true
    }
  };


  const resourceRegistry = [
    { id: 'opendosm', title: 'OpenDOSM', owner: 'Jabatan Perangkaan Malaysia', type: 'API rasmi terbuka', status: 'Boleh disambung', use: 'Konteks ekonomi dan sosial; bukan keputusan individu.', url: 'https://developer.data.gov.my/static-api/opendosm' },
    { id: 'pricecatcher', title: 'PriceCatcher', owner: 'KPDN / DOSM melalui data.gov.my', type: 'Dataset rasmi terbuka', status: 'Perlu adapter/cache', use: 'Harga item di premis; bukan pengganti CPI.', url: 'https://data.gov.my/data-catalogue/pricecatcher' },
    { id: 'pjrm', title: 'Jualan Rahmah', owner: 'KPDN', type: 'Portal rasmi', status: 'Pautan rasmi', use: 'Semak jadual dan lokasi; jangan reka acara.', url: 'https://pjrm.kpdn.gov.my/' },
    { id: 'mydigitalid', title: 'MyDigital ID', owner: 'My Digital ID Sdn. Bhd.', type: 'Identiti digital', status: 'Simulasi prototaip', use: 'Pengesahan identiti; bukan persetujuan automatik data bantuan.', url: 'https://www.digital-id.my/en/support' },
    { id: 'padu', title: 'PADU', owner: 'Kerajaan Malaysia', type: 'Profil peribadi berasaskan kebenaran', status: 'Fasa akan datang', use: 'Profil isi rumah untuk cadangan; bukan label atau hukuman.', url: 'https://padu.gov.my/' },
    { id: 'jkm', title: 'JKM / OKU', owner: 'Jabatan Kebajikan Masyarakat', type: 'Maklumat bantuan dan kaunter', status: 'Pautan rasmi', use: 'Sokongan OKU, penjaga, warga emas dan kebajikan.', url: 'https://www.malaysia.gov.my/' }
  ];

  const opendosmDatasets = [
    { id: 'cpi_state', label: 'CPI mengikut negeri', purpose: 'Konteks tekanan harga mengikut negeri.' },
    { id: 'cpi_lowincome', label: 'CPI isi rumah berpendapatan rendah', purpose: 'Konteks kos yang mungkin lebih terasa kepada isi rumah rentan.' },
    { id: 'hies_state', label: 'Pendapatan & perbelanjaan isi rumah', purpose: 'Penanda aras latar; bukan penilaian keluarga.' }
  ];

  const needsData = {
    living: { icon: '◫', label: 'Kos sara hidup', desc: 'Harga asas, jualan berhemah dan bantuan tunai.', link: 'https://www.malaysia.gov.my/categories/bantuan-kebajikan--kemudahan/bantuan-kewangan' },
    transport: { icon: '◎', label: 'Pengangkutan', desc: 'Anggar kos perjalanan dan semak bantuan bahan api.', link: 'https://www.budi95.gov.my/' },
    health: { icon: '+', label: 'Kesihatan', desc: 'Cari saluran kesihatan dan sokongan berkaitan.', link: 'https://www.malaysia.gov.my/categories/kesihatan' },
    education: { icon: '☆', label: 'Pendidikan', desc: 'Bantuan persekolahan, pengajian dan latihan.', link: 'https://www.malaysia.gov.my/my/categories/bantuan-kebajikan--kemudahan/bantuan-pendidikan' },
    housing: { icon: '⌂', label: 'Perumahan', desc: 'Program rumah dan sokongan tempat tinggal.', link: 'https://www.malaysia.gov.my/my/categories/bantuan-kebajikan--kemudahan/bantuan-perumahan' },
    work: { icon: '◇', label: 'Kerja & pendapatan', desc: 'Pekerjaan, latihan dan perlindungan pendapatan.', link: 'https://www.malaysia.gov.my/categories/bantuan-kebajikan--kemudahan/bantuan-pekerjaan' },
    oku: { icon: '♿', label: 'OKU & penjaga', desc: 'Sokongan OKU, penjaga dan akses bantuan manusia.', link: 'https://www.malaysia.gov.my/' }
  };

  const priceSamples = ['Beras putih tempatan', 'Telur ayam', 'Minyak masak'];

  const benefitCatalog = [
    { name: 'Sumbangan Asas Rahmah (SARA)', need: 'living', category: 'Persekutuan', owner: 'MOF / MyKasih', summary: 'Kredit barangan asas untuk penerima yang disahkan melalui saluran rasmi.', prep: ['MyKad', 'Telefon untuk menerima maklumat', 'Senarai barang asas yang diperlukan', 'Semak kedai dan barangan yang dibenarkan'], help: 'Semak portal rasmi atau dapatkan bantuan di kaunter berkaitan jika tidak dapat menggunakan aplikasi.', url: 'https://sara.gov.my/' },
    { name: 'Sumbangan Tunai Rahmah (STR)', need: 'living', category: 'Persekutuan', owner: 'HASiL', summary: 'Semakan permohonan dan bayaran bantuan tunai melalui HASiL.', prep: ['MyKad', 'Maklumat pasangan dan tanggungan, jika berkaitan', 'Maklumat akaun bank, jika diminta', 'Semak status permohonan dan rayuan melalui saluran rasmi'], help: 'Keputusan, bayaran dan rayuan hanya disahkan oleh HASiL.', url: 'https://bantuantunai.hasil.gov.my/' },
    { name: 'BUDI95', need: 'transport', category: 'Subsidi', owner: 'MOF / sistem BUDI95', summary: 'Maklumat rasmi berkaitan subsidi dan penggunaan bahan api.', prep: ['MyKad', 'Maklumat kenderaan, jika diminta', 'Aplikasi MyDigital ID untuk semakan peribadi', 'Jangan rancang untuk menghabiskan kuota subsidi'], help: 'Gunakan untuk merancang perjalanan secara berhemah, bukan untuk menggalakkan penggunaan berlebihan.', url: 'https://www.budi95.gov.my/' },
    { name: 'Jualan Rahmah', need: 'living', category: 'Kos sara hidup', owner: 'KPDN', summary: 'Semakan lokasi dan jadual jualan berhemah yang diumumkan melalui saluran rasmi.', prep: ['Negeri atau daerah', 'Masa operasi yang tertera', 'Senarai barangan yang mahu dibeli'], help: 'Jadual boleh berubah. Semak sebelum bergerak.', url: 'https://pjrm.kpdn.gov.my/' },
    { name: 'Bantuan pendidikan', need: 'education', category: 'Keluarga', owner: 'Agensi pendidikan berkaitan', summary: 'Pintu masuk rasmi untuk program pendidikan yang mungkin berkaitan.', prep: ['MyKad penjaga dan anak', 'Surat atau bukti pendaftaran institusi', 'Maklumat pendapatan jika program memerlukannya', 'Tarikh tutup permohonan'], help: 'Program boleh berbeza mengikut negeri, peringkat pendidikan dan institusi.', url: needsData.education.link },
    { name: 'Bantuan perumahan', need: 'housing', category: 'Tempat tinggal', owner: 'Agensi perumahan persekutuan/negeri', summary: 'Pintu masuk rasmi untuk program rumah dan tempat tinggal.', prep: ['MyKad pemohon', 'Maklumat isi rumah', 'Bukti pendapatan atau tempat tinggal jika diminta', 'Alamat atau kawasan pilihan jika program memerlukan'], help: 'Semak syarat negeri dan saluran kaunter jika sukar memohon secara digital.', url: needsData.housing.link },
    { name: 'Bantuan pekerjaan', need: 'work', category: 'Kerja', owner: 'Agensi pekerjaan/latihan berkaitan', summary: 'Program pekerjaan, latihan dan perlindungan pendapatan.', prep: ['MyKad', 'Maklumat pekerjaan terkini', 'Resume ringkas jika ada', 'Kemahiran atau latihan yang diminati'], help: 'TenangKITA hanya membantu persediaan; padanan dan kelulusan oleh agensi berkaitan.', url: needsData.work.link },
    { name: 'Perkhidmatan kesihatan', need: 'health', category: 'Kesihatan', owner: 'Agensi kesihatan berkaitan', summary: 'Maklumat perkhidmatan dan saluran kesihatan kerajaan.', prep: ['MyKad atau dokumen pengenalan', 'Surat rujukan jika ada', 'Senarai ubat atau rekod berkaitan jika ada', 'Keperluan akses seperti kerusi roda atau jurubahasa jika berkaitan'], help: 'Untuk kecemasan kesihatan, jangan tunggu aplikasi.', url: needsData.health.link },
    { name: 'Sokongan OKU / JKM', need: 'oku', category: 'OKU', owner: 'JKM / agensi kebajikan', summary: 'Panduan awal untuk semakan bantuan, pendaftaran atau kemas kini OKU melalui saluran rasmi.', prep: ['MyKad pemohon', 'Maklumat kad atau pendaftaran OKU jika ada', 'Dokumen perubatan atau sokongan jika diminta', 'Maklumat penjaga jika berkaitan'], help: 'Anda tidak perlu mendedahkan OKU untuk menggunakan maklumat umum TenangKITA.', url: 'https://www.malaysia.gov.my/' },
    { name: 'Bantuan penjaga', need: 'oku', category: 'Penjaga', owner: 'JKM / agensi kebajikan', summary: 'Panduan untuk keluarga atau penjaga yang membantu rakyat OKU, warga emas atau ahli keluarga yang memerlukan sokongan.', prep: ['MyKad pemohon dan individu dibantu', 'Hubungan dengan individu tersebut', 'Dokumen sokongan jika diminta agensi', 'Izin individu yang dibantu jika mampu memberi kebenaran'], help: 'Akses penjaga perlu berasaskan izin dan audit dalam fasa sebenar.', url: 'https://www.malaysia.gov.my/' },
    { name: 'Program negeri', need: 'living', category: 'Negeri', owner: 'Kerajaan negeri berkaitan', summary: 'Bantuan negeri boleh berbeza mengikut lokasi, umur, anak, pendapatan, OKU atau keadaan keluarga.', prep: ['Negeri tempat tinggal', 'MyKad', 'Dokumen sokongan mengikut program', 'Semak portal negeri yang rasmi'], help: 'TenangKITA tidak akan meneka kelayakan negeri tanpa sumber yang disahkan.', url: 'https://www.malaysia.gov.my/' }
  ];

  const servicePrinciples = [
    ['Empati', 'Tidak melabel rakyat sebagai miskin, gagal atau berisiko.'],
    ['Kebenaran', 'Bezakan rasmi, anggaran, demo dan sumber yang belum disambungkan.'],
    ['Tindakan praktikal', 'Setiap kad perlu ada langkah, dokumen dan saluran rasmi atau manusia.'],
    ['Akses inklusif', 'Paparan mudah, teks besar, kontras, bacaan suara, OKU dan penjaga.']
  ];

  const stateProgrammeNotes = [
    'Program negeri perlu disahkan melalui portal rasmi negeri atau agensi pemilik.',
    'Jangan salin syarat lama tanpa tarikh semakan.',
    'Jika tiada API, paparkan pautan rasmi dan checklist sahaja.',
    'Setiap program perlu ada tarikh semakan, pemilik data dan saluran pembetulan.'
  ];

  function persist() {
    localStorage.setItem(LOCAL_KEY, JSON.stringify({
      route: state.route,
      tab: state.tab,
      concern: state.concern,
      activeNeed: state.activeNeed,
      state: state.state,
      household: state.household,
      largeText: state.largeText,
      simpleMode: state.simpleMode,
      accessNeeds: state.accessNeeds,
      caregiverMode: state.caregiverMode,
      highContrast: state.highContrast
    }));
    if (state.verified) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({
        verified: true,
        consents: state.consents,
        authAt: state.authAt
      }));
    } else {
      sessionStorage.removeItem(SESSION_KEY);
    }
    document.documentElement.classList.toggle('large-text', state.largeText);
    document.documentElement.classList.toggle('simple-mode', state.simpleMode);
    document.documentElement.classList.toggle('high-contrast', state.highContrast);
  }

  function phase() {
    return `<div class="phase"><b>PROTOTAIP v0.6</b> Nilai demo dan anggaran bukan rekod rasmi. <a href="#" data-action="about-demo">Ketahui batas prototaip</a></div>`;
  }

  function top() {
    return `<header class="topbar"><div class="brand"><div class="brand-mark" aria-hidden="true">TK</div><div><b>TenangKITA</b><small>Ringkaskan bantuan. Kecilkan beban.</small></div></div><div class="top-actions"><button class="icon-button" data-action="read-page" aria-label="Bacakan halaman">&#128266;</button><button class="icon-button" data-action="toggle-simple" aria-label="Tukar paparan mudah">${state.simpleMode ? 'Penuh' : 'Mudah'}</button></div></header>`;
  }

  function backBar(label = 'Kembali') {
    return `<button class="back-button" data-action="back" aria-label="${label}"><span aria-hidden="true">‹</span> ${label}</button>`;
  }

  function shell(content, nav = true) {
    return `${phase()}${top()}<main id="main" tabindex="-1">${content}</main>${nav ? tabs() : ''}`;
  }

  function tabs() {
    const items = [
      ['home', '⌂', 'Utama'],
      ['benefits', '▣', 'Bantuan'],
      ['needs', '◎', 'Keperluan'],
      ['access', '♿', 'Akses'],
      ['me', '○', 'Saya']
    ];
    return `<nav class="tabs" aria-label="Navigasi utama">${items.map(([id, icon, label]) => `<button class="tab ${state.tab === id ? 'active' : ''}" data-tab="${id}" ${state.tab === id ? 'aria-current="page"' : ''}><span aria-hidden="true">${icon}</span>${label}</button>`).join('')}</nav>`;
  }

  function welcome() {
    return shell(`<section class="card hero"><div class="hero-symbol" aria-hidden="true">♥</div><p class="eyebrow">Untuk rakyat Malaysia</p><h1>Apa yang boleh kita ringankan hari ini?</h1><p>TenangKITA membantu anda memahami bantuan, kos harian dan tindakan praktikal tanpa bahasa yang menghukum.</p><div class="button-row"><button class="button full" data-route="concern">Pilih keutamaan saya</button><button class="button-secondary full" data-action="guest">Teroka maklumat umum</button></div></section><section class="card"><h2>Apa yang TenangKITA lakukan</h2><div class="action-list"><article class="action"><span class="action-icon">1</span><div><b>Ringkaskan keadaan</b><small>Tunjukkan perkara paling penting dahulu.</small></div></article><article class="action"><span class="action-icon">2</span><div><b>Cadangkan tindakan kecil</b><small>Fokus pada apa yang boleh dibuat hari ini atau minggu ini.</small></div></article><article class="action"><span class="action-icon">3</span><div><b>Hubungkan sumber rasmi</b><small>Anda mengawal sumber yang disambungkan.</small></div></article></div></section><section class="card secondary-card"><h2>Direka untuk semua</h2><p>Termasuk warga emas, OKU, penjaga, pengguna pembaca skrin dan rakyat yang mahu bantuan manusia, bukan hanya perkhidmatan digital.</p><button class="button-secondary full" data-tab-jump="access">Tetapkan keperluan akses</button></section>`, false);
  }

  function concern() {
    const places = ['', 'Selangor', 'Johor', 'Kedah', 'Sabah', 'Sarawak', 'W.P. Kuala Lumpur', 'Pulau Pinang', 'Perak', 'Kelantan', 'Terengganu', 'Negeri Sembilan', 'Melaka', 'Pahang', 'Perlis', 'W.P. Putrajaya', 'W.P. Labuan'];
    const households = ['', '1', '2', '3', '4', '5', '6+'];
    return shell(`${backBar()}<section class="card"><p class="eyebrow">Pilihan anda</p><h1>Apa yang paling membimbangkan anda?</h1><p>Pilih satu dahulu. Anda boleh menukarnya kemudian.</p><div class="choice-grid">${Object.entries(concerns).map(([id, item]) => `<button class="choice ${state.concern === id ? 'selected' : ''}" data-concern="${id}" aria-pressed="${state.concern === id}"><span aria-hidden="true">${item.icon}</span><span><b>${item.label}</b><small>${item.desc}</small></span></button>`).join('')}</div><label class="field">Negeri atau wilayah (pilihan)<select id="state-select">${places.map(place => `<option value="${place}" ${place === state.state ? 'selected' : ''}>${place || 'Tidak mahu nyatakan'}</option>`).join('')}</select></label><label class="field">Bilangan ahli isi rumah (pilihan)<select id="household-select">${households.map(value => `<option value="${value}" ${value === state.household ? 'selected' : ''}>${value || 'Tidak mahu nyatakan'}</option>`).join('')}</select></label><div class="privacy">TenangKITA tidak memerlukan lokasi tepat atau pendapatan untuk meneruskan.</div><button class="button full" data-action="finish-setup" ${state.concern ? '' : 'disabled'}>Lihat cadangan saya</button></section>`, false);
  }

  function guestHome() {
    return `<section class="card hero"><p class="eyebrow">Teroka tanpa log masuk</p><h1>Mulakan dengan maklumat umum.</h1><p>Tiada lokasi, saiz isi rumah atau identiti diandaikan untuk anda.</p><button class="button" data-route="concern">Pilih keutamaan jika mahu</button></section><section class="card"><h2>Boleh dibuat sekarang</h2><div class="action-list"><article class="action"><span class="action-icon">1</span><div><b>Teroka bantuan awam</b><small>Lihat SARA, STR dan program lain tanpa menentukan kelayakan.</small></div></article><button class="action action-button" data-route="data-trust"><span class="action-icon">2</span><span><b>Semak sumber rasmi</b><small>Lihat OpenDOSM, PriceCatcher, PADU dan had data.</small></span><span class="action-arrow" aria-hidden="true">›</span></button><article class="action"><span class="action-icon">3</span><div><b>Dapatkan bantuan manusia</b><small>Saluran bantuan kekal tersedia tanpa pengesahan identiti.</small></div></article></div></section>`;
  }

  function home() {
    if (!state.concern) return guestHome();
    if (state.concern === 'urgent') return urgentSummary();
    const current = concerns[state.concern];
    const primary = {
      groceries: ['living', 'Semak harga & bantuan makanan'],
      fuel: ['transport', 'Kira kos perjalanan saya'],
      bills: ['housing', 'Semak sokongan rumah & bil'],
      children: ['education', 'Semak bantuan pendidikan'],
      income: ['work', 'Semak bantuan kerja & pendapatan']
    }[state.concern];
    return `<section class="card hero"><p class="eyebrow">Ringkasan anda hari ini</p><h1>Kita fokus pada ${current.label.toLowerCase()} dahulu.</h1><p>Tidak perlu semak semuanya sekarang. Mulakan dengan satu tindakan kecil.</p><button class="button full" data-open-need="${primary[0]}">${primary[1]}</button></section><section class="card"><h2>Tindakan minggu ini</h2><p class="detail-extra">Tekan mana-mana tindakan untuk terus ke langkah seterusnya.</p><div class="action-list">${weeklyActions().map((item, index) => `<button class="action action-button" ${item[2] === 'benefits' ? 'data-tab-jump="benefits"' : `data-open-need="${item[2]}"`}><span class="action-icon">${index + 1}</span><span><b>${item[0]}</b><small>${item[1]}</small></span><span class="action-arrow" aria-hidden="true">›</span></button>`).join('')}</div></section><section class="card secondary-card"><h2>Status ringkas</h2><div class="status-grid"><article class="mini-card"><span>Lokasi umum</span><b>${state.state || 'Tidak dinyatakan'}</b></article><article class="mini-card"><span>Ahli isi rumah</span><b>${state.household || 'Tidak dinyatakan'}</b></article><article class="mini-card"><span>Sumber yang anda benarkan</span><b>${state.consents.length}</b></article></div><div class="notice">Semak portal rasmi sebelum membuat keputusan kewangan.</div></section><section class="card secondary-card"><h2>Amanah Data</h2><p>Lihat apa yang TenangKITA tahu, apa yang tidak diketahui, dan sumber rasmi yang digunakan.</p><button class="button-secondary full" data-route="data-trust">Lihat sumber & batas data</button></section>`;
  }

  function urgentSummary(showMore = true) {
    return `<section class="card urgent-card"><p class="eyebrow">Bantuan segera</p><h1>Utamakan keselamatan dan bantuan manusia.</h1><p>Anda tidak perlu log masuk untuk mendapatkan saluran bantuan.</p><div class="button-row"><a class="button danger-action full" href="tel:999">Hubungi kecemasan 999</a><a class="button-secondary full" href="tel:15999">Hubungi Talian Kasih 15999</a>${showMore ? '<button class="button-secondary full" data-route="urgent">Lihat saluran lain</button>' : ''}</div></section><section class="card"><h2>Langkah kecil sekarang</h2><div class="action-list"><article class="action"><span class="action-icon">1</span><div><b>Pastikan anda berada di tempat selamat</b><small>Jangan tunggu aplikasi jika terdapat bahaya segera.</small></div></article><article class="action"><span class="action-icon">2</span><div><b>Maklumkan orang dipercayai</b><small>Kongsi keadaan dan lokasi apabila selamat berbuat demikian.</small></div></article></div></section>`;
  }

  function weeklyActions() {
    const hasSara = state.verified && state.consents.includes('sara');
    const hasBudi = state.verified && state.consents.includes('budi');
    const common = ['Semak bantuan berkaitan', 'Lihat program yang mungkin berkaitan. Kelayakan ditentukan oleh agensi.', 'benefits'];
    const maps = {
      groceries: [
        hasSara ? ['Rancang menggunakan baki SARA demo', 'Semak baki dan barangan layak sebelum menggunakan tunai.', 'benefits'] : ['Semak sama ada SARA berkaitan', 'Gunakan portal rasmi untuk melihat status dan baki.', 'benefits'],
        ['Bandingkan sebelum bergerak', 'Semak harga dan jadual Jualan Rahmah melalui sumber terkini.', 'living'],
        common
      ],
      fuel: [
        hasBudi ? ['Semak penggunaan BUDI95 demo', 'Lihat simulasi penggunaan sebelum merancang perjalanan.', 'benefits'] : ['Semak status BUDI95', 'Gunakan portal rasmi sebelum membuat anggaran.', 'benefits'],
        ['Kira kos perjalanan', 'Gunakan jarak dan harga yang anda sendiri masukkan.', 'transport'],
        common
      ],
      bills: [['Susun bil mengikut tarikh', 'Mulakan dengan bil yang mempunyai tarikh paling hampir.', 'housing'], common, ['Semak sokongan tempat tinggal', 'Program boleh berbeza mengikut negeri dan keadaan.', 'housing']],
      children: [['Fokus keperluan minggu ini', 'Asingkan keperluan sekolah yang perlu didahulukan.', 'education'], common, ['Semak bantuan pendidikan', 'Program pendidikan boleh berbeza mengikut negeri.', 'education']],
      income: [['Semak program berkaitan kerja', 'Cari latihan atau sokongan mengikut keadaan pekerjaan.', 'work'], common, ['Sediakan dokumen asas', 'Mulakan dengan MyKad dan maklumat pekerjaan terkini.', 'work']]
    };
    return maps[state.concern] || maps.groceries;
  }

  function benefits() {
    if (!state.verified) {
      return `<section class="card hero"><p class="eyebrow">Bantuan peribadi</p><h1>Lihat maklumat anda dengan selamat.</h1><p>Log masuk hanya diperlukan untuk melihat status, baki atau penggunaan yang berkaitan dengan diri anda.</p><div class="privacy"><b>TenangKITA tidak meminta kata laluan MyDigital ID.</b><br>Pengesahan berlaku dalam aplikasi MyDigital ID.</div><button class="button full" data-route="auth-intro">Log masuk dengan MyDigital ID</button><a class="button-secondary full official-jump" href="#official-list">Lihat pilihan semakan rasmi</a></section>${benefitDiscovery()}${publicBenefits()}`;
    }
    return `<div class="demo-banner">PENGESAHAN & DATA DEMO — Bukan identiti, baki, transaksi atau keputusan sebenar.</div><section class="card"><h1>Bantuan saya</h1><p>Hanya sumber yang anda izinkan dipaparkan. Sesi simulasi tamat selepas 15 minit.</p>${Object.keys(sources).filter(id => !sources[id].future).map(benefitCard).join('')}</section>${benefitDiscovery()}`;
  }

  function benefitDiscovery() {
    const mapped = { groceries: 'living', fuel: 'transport', bills: 'housing', children: 'education', income: 'work' }[state.concern];
    const ordered = [...benefitCatalog].sort((a, b) => Number(b.need === mapped) - Number(a.need === mapped));
    return `<section class="card"><p class="eyebrow">Teroka tanpa log masuk</p><h2>Katalog bantuan Malaysia</h2><p>Senarai ini membantu anda bersedia. Ia tidak mengesahkan kelayakan atau bayaran.</p><div class="service-principles">${servicePrinciples.map(([title, text]) => `<article><b>${title}</b><small>${text}</small></article>`).join('')}</div><div class="catalog">${ordered.map((item, idx) => `<article class="catalog-item"><div><span class="tag official">Pautan rasmi</span><span class="tag">${item.category}</span>${item.need === mapped ? '<span class="tag relevant">Berkaitan pilihan anda</span>' : ''}<h3>${item.name}</h3><p>${item.summary}</p></div><details class="prep" ${idx < 2 ? 'open' : ''}><summary>Sebelum membuka portal</summary><p>Sediakan jika berkaitan:</p><ul>${item.prep.map(entry => `<li>${entry}</li>`).join('')}</ul><small>${item.help}</small></details><div class="truth-row"><span><b>Pemilik</b>${item.owner}</span><span><b>Keputusan</b>Oleh agensi</span></div><div class="inline-actions"><a class="button-secondary" href="${item.url}" target="_blank" rel="noopener noreferrer">Buka portal rasmi</a><button class="text-button" data-print-checklist="${idx}">Cetak / simpan checklist</button></div></article>`).join('')}</div></section>${stateProgrammeLayer()}`;
  }

  function stateProgrammeLayer() {
    return `<section class="card secondary-card"><p class="eyebrow">Program negeri & sektor</p><h2>Jangan reka syarat. Semak sumber rasmi.</h2><p>Program bantuan boleh berubah mengikut negeri, agensi dan tahun. NewTenangKITA v0.6 hanya menyediakan checklist dan pautan selamat sehingga sumber disahkan.</p><div class="action-list">${stateProgrammeNotes.map((note, index) => `<article class="action"><span class="action-icon">${index + 1}</span><div><b>${index === 0 ? 'Sahkan pemilik sumber' : index === 1 ? 'Semak tarikh' : index === 2 ? 'Gunakan pautan rasmi' : 'Sediakan pembetulan'}</b><small>${note}</small></div></article>`).join('')}</div><div class="truth-note"><b>Status: readiness</b><span>Direka untuk diisi dengan registry rasmi, bukan crawler bebas tanpa kawalan.</span></div></section>`;
  }

  function publicBenefits() {
    return `<section class="card" id="official-list"><h2>Semakan rasmi tanpa log masuk TenangKITA</h2><p>Pilih portal yang berkaitan. Portal agensi mungkin mempunyai kaedah pengesahan sendiri.</p><div class="official-grid">${Object.values(sources).filter(source => !source.future).map(source => `<a class="official-card" href="${source.url}" target="_blank" rel="noopener noreferrer"><b>${source.name}</b><small>${source.scope}</small><span>Semak rasmi ›</span></a>`).join('')}<a class="official-card" href="https://www.malaysia.gov.my/" target="_blank" rel="noopener noreferrer"><b>Program lain</b><small>Perkhidmatan dan maklumat kerajaan Malaysia.</small><span>Teroka ›</span></a></div></section>`;
  }

  function benefitCard(id) {
    const source = sources[id];
    const connected = state.consents.includes(id);
    const demo = {
      sara: ['Baki demo', 'RM84.50', 'Contoh paparan; tiada tarikh rasmi'],
      budi: ['Penggunaan demo', '42 L bulan ini', 'Had dan kaedah sebenar tertakluk sumber rasmi'],
      str: ['Status demo', 'Bayaran dikreditkan', 'Tarikh dan jumlah sebenar melalui HASiL']
    }[id];
    return `<article class="benefit"><div class="benefit-head"><div><h3>${source.name}</h3><span class="tag ${connected ? 'connected' : ''}">${connected ? 'Kebenaran aktif' : 'Belum dibenarkan'}</span></div><span class="tag demo">Data demo</span></div>${connected ? `<div class="benefit-data"><small>${demo[0]}</small><strong>${demo[1]}</strong><small>${demo[2]}</small></div>` : `<p>${source.scope}</p>`}<div class="truth-row"><span><b>Sumber</b>${source.name}</span><span><b>Jenis</b>${connected ? 'Simulasi' : 'Belum disambung'}</span></div><div class="inline-actions">${connected ? `<button class="text-button" data-disconnect="${id}">Tarik balik kebenaran</button>` : `<button class="button-secondary" data-request-consent="${id}">Lihat maklumat yang diperlukan</button>`}<a class="link button-secondary" href="${source.url}" target="_blank" rel="noopener noreferrer">Semak rasmi</a></div></article>`;
  }

  function needs() {
    return `<section class="card"><h1>Keperluan harian</h1><p>Pilih perkara yang mahu diringkaskan. Tiada identiti diperlukan.</p><div class="need-grid">${Object.entries(needsData).map(([id, item]) => `<button class="need-button ${state.activeNeed === id ? 'selected' : ''}" data-need="${id}" aria-pressed="${state.activeNeed === id}"><span aria-hidden="true">${item.icon}</span><b>${item.label}</b></button>`).join('')}</div></section>${needDetail()}`;
  }

  function needDetail() {
    if (state.activeNeed === 'living') return livingCostModule();
    if (state.activeNeed === 'transport') return travelModule();
    if (state.activeNeed === 'oku') return okuModule();
    const item = needsData[state.activeNeed];
    const actions = {
      health: ['Kenal pasti bantuan yang diperlukan', 'Sediakan dokumen rawatan atau surat rujukan jika ada.'],
      education: ['Fokus satu keperluan dahulu', 'Semak tarikh permohonan dan dokumen sekolah atau institusi.'],
      housing: ['Semak program mengikut negeri', 'Syarat rumah dan tempat tinggal boleh berbeza mengikut lokasi.'],
      work: ['Pilih satu laluan hari ini', 'Semak peluang kerja, latihan atau perlindungan pendapatan.']
    }[state.activeNeed];
    return `<section class="card"><p class="eyebrow">${item.label}</p><h2>Apa yang boleh dibuat sekarang?</h2><div class="action-list"><article class="action"><span class="action-icon">1</span><div><b>${actions[0]}</b><small>${actions[1]}</small></div></article><article class="action"><span class="action-icon">2</span><div><b>Semak maklumat rasmi</b><small>Portal rasmi menentukan syarat, tarikh dan keputusan sebenar.</small></div></article></div><a class="button full" href="${item.link}" target="_blank" rel="noopener noreferrer">Teroka portal rasmi</a><div class="truth-note"><b>Status data: portal rasmi</b><span>TenangKITA tidak menentukan kelayakan.</span></div></section>${humanSupport()}`;
  }

  function livingCostModule() {
    const place = state.state || 'lokasi anda';
    return `<section class="card"><p class="eyebrow">Kos sara hidup</p><h2>Semak harga barang asas</h2><div class="demo-banner">HARGA BELUM DISAMBUNGKAN — tiada harga semasa dipaparkan.</div><p>Barang yang boleh dibandingkan untuk ${place}:</p><div class="price-grid">${priceSamples.map(item => `<article class="price-card"><span>${item}</span><strong>—</strong><small>Semak melalui PriceCatcher</small></article>`).join('')}</div><div class="truth-row"><span><b>Sumber sebenar</b>PriceCatcher KPDN</span><span><b>Dikemas kini</b>Semasa portal dibuka</span></div><a class="button full" href="https://pricecatcher.kpdn.gov.my/" target="_blank" rel="noopener noreferrer">Semak harga sebenar</a></section><section class="card"><p class="eyebrow">Jualan Rahmah</p><h2>Cari jualan berhampiran</h2><p>Jadual boleh berubah. Semak lokasi dan masa terus melalui saluran KPDN.</p><a class="button full" href="https://pjrm.kpdn.gov.my/" target="_blank" rel="noopener noreferrer">Buka jadual rasmi</a><div class="truth-note"><b>Status: belum disambungkan</b><span>Tiada acara atau jarak rekaan dipaparkan.</span></div></section>`;
  }

  function travelModule() {
    return `<section class="card"><p class="eyebrow">Pengangkutan</p><h2>Anggar kos perjalanan bulanan</h2><p>Masukkan anggaran sendiri. Nilai ini dikira pada peranti dan tidak disimpan.</p><label class="field">Jarak sebulan (km)<input id="trip-km" type="number" min="0" step="10" inputmode="decimal" placeholder="Contoh: 600"></label><label class="field">Penggunaan bahan api (L/100 km)<input id="trip-eff" type="number" min="0" step="0.1" inputmode="decimal" placeholder="Contoh: 7.0"></label><label class="field">Harga bahan api (RM/L)<input id="trip-price" type="number" min="0" step="0.01" inputmode="decimal" placeholder="Masukkan harga yang anda bayar"></label><label class="field">Tol & parkir sebulan (RM)<input id="trip-extra" type="number" min="0" step="1" inputmode="decimal" placeholder="Jika ada"></label><button class="button full" data-action="calculate-trip">Kira anggaran</button><div id="trip-result" class="result-box" aria-live="polite"><small>Anggaran akan dipaparkan di sini.</small></div><div class="truth-note"><b>Status data: anggaran TenangKITA</b><span>Bukan rekod transaksi, tuntutan atau penggunaan subsidi.</span></div><a class="button-secondary full" href="https://www.budi95.gov.my/" target="_blank" rel="noopener noreferrer">Semak BUDI95 secara rasmi</a></section>`;
  }


  function okuModule() {
    return `<section class="card"><p class="eyebrow">OKU & penjaga</p><h2>Sokongan yang boleh disemak</h2><p>Anda tidak perlu mendedahkan ketidakupayaan untuk menggunakan TenangKITA. Maklumat OKU hanya diperlukan apabila anda mahu menyemak bantuan rasmi berkaitan.</p><div class="action-list"><article class="action"><span class="action-icon">1</span><div><b>Semak bantuan OKU / JKM</b><small>Sediakan MyKad, maklumat OKU jika ada dan dokumen sokongan yang diminta agensi.</small></div></article><article class="action"><span class="action-icon">2</span><div><b>Sokongan penjaga</b><small>Jika anda membantu ahli keluarga, dapatkan izin mereka dan simpan dokumen hubungan atau penjagaan jika diminta.</small></div></article><article class="action"><span class="action-icon">3</span><div><b>Pilih saluran yang sesuai</b><small>Gunakan portal rasmi, telefon, WhatsApp atau kaunter jika sukar menyelesaikan secara digital.</small></div></article></div><div class="truth-row"><span><b>Jenis</b>Panduan awal</span><span><b>Keputusan</b>Oleh agensi</span></div><a class="button full" href="https://www.malaysia.gov.my/" target="_blank" rel="noopener noreferrer">Cari perkhidmatan rasmi</a></section>${humanSupport(true)}`;
  }

  function accessCentre() {
    const options = [
      ['largeText','Saya kurang jelas melihat teks','Saiz teks lebih besar'],
      ['highContrast','Saya perlukan kontras lebih jelas','Kontras tinggi'],
      ['simpleMode','Saya sukar membaca ayat panjang','Paparan mudah'],
      ['screenReader','Saya menggunakan pembaca skrin','Label dan susunan mesra pembaca skrin'],
      ['bigButtons','Saya perlukan butang lebih besar','Sasaran sentuh lebih besar'],
      ['caregiver','Saya membantu ahli keluarga','Mod penjaga']
    ];
    return `<section class="card hero"><p class="eyebrow">Keperluan akses saya</p><h1>Gunakan TenangKITA dengan cara yang selesa.</h1><p>Bahagian ini pilihan. Anda tidak perlu menyatakan OKU untuk mendapatkan maklumat umum.</p><div class="access-grid">${options.map(([id,label,short]) => `<button class="access-choice ${isAccessOn(id) ? 'selected' : ''}" data-access="${id}" aria-pressed="${isAccessOn(id)}"><b>${label}</b><small>${short}</small></button>`).join('')}</div><div class="notice">Tetapan ini disimpan pada peranti ini sahaja dalam prototaip.</div></section><section class="card"><h2>Sokongan OKU & penjaga</h2><p>TenangKITA boleh bantu anda bersedia sebelum membuka portal rasmi atau menghubungi agensi.</p><div class="button-row"><button class="button full" data-open-need="oku">Lihat panduan OKU & penjaga</button><button class="button-secondary full" data-route="access-statement">Lihat pernyataan akses</button></div></section>${humanSupport(true)}`;
  }

  function isAccessOn(id) {
    if (id === 'largeText') return state.largeText;
    if (id === 'highContrast') return state.highContrast;
    if (id === 'simpleMode') return state.simpleMode;
    if (id === 'caregiver') return state.caregiverMode;
    return state.accessNeeds.includes(id);
  }

  function accessStatement() {
    return shell(`${backBar()}<section class="card"><p class="eyebrow">Pernyataan akses</p><h1>TenangKITA untuk semua rakyat.</h1><p>Prototaip ini direka untuk menyokong pengguna OKU, warga emas, penjaga dan rakyat yang kurang yakin menggunakan perkhidmatan digital.</p><ul class="plain-list"><li>Maklumat penting tidak bergantung pada warna sahaja.</li><li>Setiap perjalanan penting mempunyai pilihan bantuan manusia.</li><li>Maklumat peribadi dan manfaat hanya dipaparkan selepas pengesahan dan kebenaran.</li><li>Mod penjaga menekankan izin individu yang dibantu.</li><li>Paparan mudah, teks besar, kontras tinggi dan bacaan suara disediakan sebagai sokongan awal.</li></ul><div class="truth-note"><b>Status: prototaip</b><span>Ujian kebolehgunaan bersama komuniti OKU perlu dibuat sebelum pilot awam.</span></div></section>`, false);
  }

  function humanSupport(includeJkm = false) {
    return `<section class="card"><h2>Saluran bantuan manusia</h2><p>Anda boleh mendapatkan bantuan tanpa menyelesaikan semuanya secara digital.</p><div class="support-list"><article class="support-card"><span class="action-icon">☎</span><div><b>Talian Kasih 15999</b><small>24 jam untuk kebajikan, perlindungan dan isu sosial.</small><div class="inline-actions"><a class="link" href="tel:15999">Telefon</a><a class="link" href="https://wa.me/60192615999" target="_blank" rel="noopener noreferrer">WhatsApp</a></div></div></article><article class="support-card"><span class="action-icon">!</span><div><b>Kecemasan 999</b><small>Untuk bahaya atau kecemasan yang memerlukan tindakan segera.</small><a class="link" href="tel:999">Hubungi 999</a></div></article>${includeJkm ? '<article class="support-card"><span class="action-icon">♿</span><div><b>JKM / pejabat kebajikan</b><small>Untuk sokongan OKU, penjaga, warga emas dan isu kebajikan. Semak kaunter terdekat melalui portal rasmi.</small><a class="link" href="https://www.malaysia.gov.my/" target="_blank" rel="noopener noreferrer">Cari perkhidmatan</a></div></article>' : ''}</div><div class="truth-note"><b>Sumber: Portal Rasmi Kerajaan Malaysia</b><span>Semak semula nombor jika maklumat pada portal rasmi berubah.</span></div></section>`;
  }

  function urgent() {
    return shell(`${backBar()}${urgentSummary(false)}${humanSupport()}`, false);
  }

  function me() {
    return `<section class="card"><h1>Saya & privasi</h1><div class="setting-row"><div><b>Keperluan akses</b><small>Teks besar, kontras, paparan mudah, pembaca skrin atau mod penjaga.</small></div><button class="button-secondary" data-tab-jump="access">Urus</button></div><div class="setting-row"><div><b>Paparan mudah</b><small>Kurangkan maklumat dan tunjuk tindakan utama.</small></div><button class="button-secondary" data-action="toggle-simple">${state.simpleMode ? 'Tutup' : 'Aktifkan'}</button></div><div class="setting-row"><div><b>Saiz teks lebih besar</b><small>Mudahkan pembacaan pada peranti kecil.</small></div><button class="button-secondary" data-action="toggle-text">${state.largeText ? 'Tutup' : 'Aktifkan'}</button></div><div class="setting-row"><div><b>Kontras tinggi</b><small>Tambah kejelasan untuk sesetengah pengguna.</small></div><button class="button-secondary" data-action="toggle-contrast">${state.highContrast ? 'Tutup' : 'Aktifkan'}</button></div><div class="setting-row"><div><b>Mod penjaga</b><small>${state.caregiverMode ? 'Aktif: gunakan maklumat dengan izin individu dibantu.' : 'Untuk membantu ahli keluarga dengan izin mereka.'}</small></div><button class="button-secondary" data-action="toggle-caregiver">${state.caregiverMode ? 'Tutup' : 'Aktifkan'}</button></div><div class="setting-row"><div><b>Bacakan halaman</b><small>Gunakan suara yang tersedia pada peranti.</small></div><button class="button-secondary" data-action="read-page">Dengar</button></div><div class="setting-row"><div><b>Keutamaan utama</b><small>${state.concern ? concerns[state.concern].label : 'Belum dipilih'}</small></div><button class="text-button" data-route="concern">Tukar</button></div><div class="setting-row"><div><b>Status identiti</b><small>${state.verified ? 'Pengesahan simulasi aktif' : 'Belum disahkan'}</small></div><span class="tag ${state.verified ? 'connected' : ''}">${state.verified ? 'Demo aktif' : 'Tetamu'}</span></div>${state.verified ? `<button class="button-secondary full" data-action="logout">Keluar daripada sesi demo</button>` : ''}</section><section class="card secondary-card"><h2>Sumber & ketelusan</h2><p>Lihat dari mana maklumat datang, cara ia digunakan dan batasnya.</p><button class="button-secondary full" data-route="data-trust">Lihat sumber & kaedah</button></section><section class="card secondary-card"><h2>Pusat kebenaran</h2>${Object.entries(sources).filter(([id, source]) => !source.future).map(([id, source]) => `<div class="setting-row"><div><b>${source.name}</b><small>${state.consents.includes(id) ? 'Kebenaran melihat maklumat aktif' : 'Tidak disambungkan'}</small></div>${state.consents.includes(id) ? `<button class="text-button" data-disconnect="${id}">Tarik balik</button>` : '<span class="tag">Tiada akses</span>'}</div>`).join('')}</section><section class="card secondary-card"><h2>Kawalan data</h2><p>Pilihan umum disimpan pada peranti ini. Pengesahan dan kebenaran tamat bersama sesi.</p><button class="button-secondary danger-button full" data-action="reset">Padam semua data prototaip</button></section>`;
  }

  function dataTrust() {
    return shell(`${backBar()}<section class="card"><p class="eyebrow">Amanah Data</p><h1>Apa yang diketahui, dan apa yang belum diketahui.</h1><p>TenangKITA hanya menggunakan data untuk memberi panduan. Ia tidak menentukan kelayakan, status ekonomi atau keputusan rasmi.</p><div class="action-list"><article class="action"><span class="action-icon">✓</span><div><b>Apa yang boleh digunakan</b><small>Data terbuka rasmi seperti OpenDOSM untuk konteks negara dan negeri.</small></div></article><article class="action"><span class="action-icon">?</span><div><b>Apa yang belum diketahui</b><small>Profil sebenar keluarga, baki bantuan dan status permohonan tanpa kebenaran anda.</small></div></article><article class="action"><span class="action-icon">!</span><div><b>Apa yang perlu disemak rasmi</b><small>Kelayakan, bayaran, baki, kuota dan keputusan akhir oleh agensi.</small></div></article></div></section>${eaServiceLayer()}${opendosmPanel()}${resourceRegistryPanel()}${paduReadinessPanel()}<section class="card"><h2>Prinsip prototaip</h2><ul class="plain-list"><li>Tidak mengisytiharkan kelayakan bantuan.</li><li>Tidak mereka baki, lokasi acara atau harga sebagai data semasa.</li><li>Membuka portal rasmi untuk pengesahan akhir.</li><li>Mengutamakan tindakan mudah tanpa memalukan pengguna.</li><li>Memastikan OKU, penjaga dan pengguna rendah literasi tidak tertinggal.</li></ul></section>`, false);
  }

  function eaServiceLayer() {
    const layers = [
      ['Pengalaman rakyat', 'Keutamaan, paparan mudah, tindakan kecil, bantuan manusia.'],
      ['Akses inklusif', 'OKU, warga emas, penjaga, teks besar, kontras dan bacaan suara.'],
      ['Amanah & kebenaran', 'MyDigital ID, persetujuan sumber dan penarikan balik kebenaran.'],
      ['Perkhidmatan Malaysia', 'Katalog bantuan, checklist, portal rasmi dan alternatif kaunter.'],
      ['Data rasmi', 'OpenDOSM, PriceCatcher adapter, PADU masa hadapan dan sumber agensi.']
    ];
    return `<section class="card secondary-card"><p class="eyebrow">EA dalam aplikasi</p><h2>Setiap fungsi mesti ada lapisan amanah.</h2><div class="source-list">${layers.map(([title, text]) => `<article class="source-card"><h3>${title}</h3><p>${text}</p></article>`).join('')}</div></section>`;
  }

  function opendosmPanel() {
    const statusText = {
      idle: 'Belum dimuatkan',
      loading: 'Sedang cuba memuatkan',
      ready: 'Data berjaya dimuatkan',
      error: 'Tidak dapat dimuatkan'
    }[state.dosmStatus] || 'Belum dimuatkan';
    const rows = state.dosmRows.length ? state.dosmRows.slice(0, 3).map(row => `<article class="source-card"><div><h3>${escapeText(row.dataset || row.id || 'OpenDOSM')}</h3><span class="tag official">Rasmi</span></div><p>${escapeText(row.date || row.period || row.year || 'Rekod diterima daripada API')}</p><small>${escapeText(JSON.stringify(row).slice(0, 170))}${JSON.stringify(row).length > 170 ? '…' : ''}</small></article>`).join('') : `<div class="truth-note"><b>Belum ada data dipaparkan</b><span>Tekan butang di bawah untuk menguji sambungan API. Jika gagal, prototaip masih membuka dokumentasi rasmi.</span></div>`;
    return `<section class="card"><p class="eyebrow">OpenDOSM</p><h2>Konteks rasmi, bukan penilaian keluarga.</h2><p>Data OpenDOSM membantu menerangkan perubahan kos atau keadaan ekonomi. Ia tidak cukup untuk menilai keadaan sebenar isi rumah seseorang.</p><div class="truth-row"><span><b>Status</b>${statusText}</span><span><b>Kemas kini aplikasi</b>${state.dosmUpdatedAt || 'Belum dicuba'}</span></div><div class="source-list">${rows}</div>${state.dosmError ? `<div class="notice"><b>API tidak dapat dicapai:</b> ${escapeText(state.dosmError)}. Gunakan pautan rasmi sebagai sandaran.</div>` : ''}<div class="button-row"><button class="button full" data-action="load-opendosm">Cuba muat OpenDOSM</button><a class="button-secondary full" href="https://developer.data.gov.my/static-api/opendosm" target="_blank" rel="noopener noreferrer">Buka dokumentasi OpenDOSM</a></div><details class="prep"><summary>Dataset yang dicadangkan</summary><ul>${opendosmDatasets.map(item => `<li><b>${item.label}</b> — ${item.purpose}</li>`).join('')}</ul></details></section>`;
  }

  function resourceRegistryPanel() {
    return `<section class="card"><p class="eyebrow">Verified Resource Registry</p><h2>Daftar sumber yang dibenarkan.</h2><p>Setiap sumber perlu ada pemilik, kegunaan, status sambungan dan batas sebelum dipaparkan kepada rakyat.</p><div class="source-list">${resourceRegistry.map(item => `<article class="source-card"><div><h3>${item.title}</h3><span class="tag">${item.status}</span></div><p><b>Pemilik:</b> ${item.owner}</p><p><b>Kegunaan:</b> ${item.use}</p><div class="truth-row"><span><b>Jenis</b>${item.type}</span><span><b>Had</b>Perlu semakan rasmi</span></div><a class="button-secondary" href="${item.url}" target="_blank" rel="noopener noreferrer">Buka sumber</a></article>`).join('')}</div></section>`;
  }

  function paduReadinessPanel() {
    return `<section class="card"><p class="eyebrow">PADU readiness</p><h2>Untuk fasa akan datang, dengan izin khusus.</h2><p>PADU tidak patut digunakan sebagai data terbuka. Ia hanya sesuai sebagai sambungan profil berasaskan kebenaran, selepas MyDigital ID dan kelulusan pemilik sistem.</p><div class="action-list"><article class="action"><span class="action-icon">1</span><div><b>Pengguna memilih untuk sambung PADU</b><small>TenangKITA tetap berguna tanpa PADU.</small></div></article><article class="action"><span class="action-icon">2</span><div><b>Data minimum sahaja</b><small>Contohnya profil isi rumah yang relevan, bukan butiran mentah yang tidak perlu.</small></div></article><article class="action"><span class="action-icon">3</span><div><b>Cadangan yang boleh dijelaskan</b><small>Tiada label miskin, skor, atau keputusan automatik.</small></div></article></div><div class="privacy">PADU tidak disambungkan dalam prototaip ini. Bahagian ini hanya menunjukkan kesediaan EA dan aliran persetujuan masa hadapan.</div></section>`;
  }

  function escapeText(value) {
    return String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  }

  function authIntro() {
    return shell(`${backBar()}<section class="card"><div class="auth-logo" aria-hidden="true">ID</div><p class="eyebrow">Pengesahan identiti</p><h1>Log masuk melalui MyDigital ID</h1><h2>Mengapa perlu log masuk?</h2><p>Hanya untuk melihat maklumat peribadi seperti baki atau status bantuan. Maklumat umum boleh digunakan tanpa log masuk.</p><div class="privacy"><b>Apa yang TenangKITA terima?</b><br>Pengesahan bahawa anda ialah pengguna yang sah. Kata laluan dan biometrik tidak diberikan kepada TenangKITA.</div><div class="notice">Ini simulasi prototaip. Tiada pengesahan sebenar dilakukan.</div><div class="button-row"><button class="button full" data-route="auth-progress">Teruskan ke simulasi MyDigital ID</button><button class="button-secondary full" data-route="auth-help">Saya tiada aplikasi MyDigital ID</button><button class="text-button full" data-action="return-benefits">Terus tanpa log masuk</button></div></section>`, false);
  }

  function authHelp() {
    return shell(`${backBar()}<section class="card"><p class="eyebrow">Pilihan bantuan</p><h1>Tiada aplikasi MyDigital ID?</h1><p>Anda masih boleh menggunakan semua maklumat umum dalam TenangKITA.</p><div class="action-list"><article class="action"><span class="action-icon">1</span><div><b>Dapatkan bantuan MyDigital ID</b><small>Semak panduan, kios dan sokongan melalui laman rasmi.</small></div></article><article class="action"><span class="action-icon">2</span><div><b>Hubungi meja bantuan</b><small>+603 8687 2772 untuk bantuan teknikal MyDigital ID.</small></div></article></div><div class="button-row"><a class="button full" href="https://www.digital-id.my/support" target="_blank" rel="noopener noreferrer">Cari panduan atau kios</a><a class="button-secondary full" href="tel:+60386872772">Hubungi meja bantuan</a><button class="text-button full" data-action="return-benefits">Terus tanpa log masuk</button></div><div class="truth-note"><b>Sumber: MyDigital ID</b><span>Waktu operasi dan lokasi kios tertakluk pada maklumat rasmi terkini.</span></div></section>`, false);
  }

  function authProgress() {
    return shell(`${backBar('Batal')}<section class="card auth-progress"><div class="auth-logo" aria-hidden="true">ID</div><h1>Simulasi MyDigital ID</h1><p>Dalam pengalaman sebenar, pengesahan berlaku dalam aplikasi MyDigital ID sebelum kembali ke TenangKITA.</p><div class="demo-banner">SIMULASI — Pilih hasil untuk menguji perjalanan pengguna.</div><div class="button-row"><button class="button full" data-auth-result="success">Simulasi pengesahan berjaya</button><button class="button-secondary full" data-auth-result="cancelled">Simulasi pengguna membatalkan</button><button class="button-secondary full" data-auth-result="unavailable">Simulasi aplikasi tidak tersedia</button></div></section>`, false);
  }

  function authError() {
    const unavailable = state.authError === 'unavailable';
    return shell(`${backBar()}<section class="card"><div class="hero-symbol error-symbol" aria-hidden="true">!</div><p class="eyebrow">Pengesahan tidak selesai</p><h1>${unavailable ? 'MyDigital ID tidak tersedia.' : 'Anda membatalkan pengesahan.'}</h1><p>${unavailable ? 'Anda masih boleh menggunakan maklumat umum atau mendapatkan bantuan MyDigital ID.' : 'Tiada data dikongsi. Anda boleh mencuba semula apabila bersedia.'}</p><div class="button-row"><button class="button full" data-route="auth-progress">Cuba semula</button>${unavailable ? '<button class="button-secondary full" data-route="auth-help">Lihat pilihan bantuan</button>' : ''}<button class="text-button full" data-action="return-benefits">Terus tanpa log masuk</button></div></section>`, false);
  }

  function consent() {
    return shell(`${backBar()}<section class="card"><p class="eyebrow">Pengesahan berjaya — simulasi</p><h1>Pilih maklumat yang boleh dilihat</h1><p>Anda tentukan sumber yang boleh dibaca. TenangKITA tidak mengubah permohonan atau rekod.</p>${Object.entries(sources).filter(([id, source]) => !source.future).map(([id, source]) => `<article class="consent-item"><label><input type="checkbox" value="${id}" class="consent-check" ${state.consents.includes(id) ? 'checked' : ''}><span>${source.name}<small>${source.scope}. TenangKITA hanya melihat maklumat yang anda benarkan.</small></span></label></article>`).join('')}<div class="privacy">Anda boleh menarik balik kebenaran pada bila-bila masa dalam “Saya & privasi”.</div><button class="button full" data-action="approve-consent">Simpan pilihan dan teruskan</button><button class="button-secondary full" data-action="skip-consent">Terus tanpa sambungan</button></section>`, false);
  }

  function main() {
    const view = { home, benefits, needs, access: accessCentre, me }[state.tab] || home;
    return shell(view());
  }

  function about() {
    alert('NewTenangKITA v0.6 ialah prototaip inklusif dengan lapisan perkhidmatan Malaysia yang praktikal. MyDigital ID, data manfaat dan sokongan OKU adalah simulasi atau pautan panduan. Harga sebenar tidak dipaparkan; kalkulator menghasilkan anggaran pada peranti. Tiada kelayakan, baki atau transaksi sebenar diproses.');
  }

  function navigate(route, tab = state.tab, replace = false) {
    state.route = route;
    state.tab = tab;
    const snapshot = { newtk: true, route, tab };
    if (replace) history.replaceState(snapshot, '', location.href);
    else history.pushState(snapshot, '', location.href);
    render();
  }

  function clearSession() {
    state.verified = false;
    state.consents = [];
    state.authAt = 0;
    sessionStorage.removeItem(SESSION_KEY);
  }

  function render() {
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    if (state.verified && Date.now() - state.authAt >= SESSION_MS) clearSession();
    if (!state.verified && state.route === 'consent') {
      state.route = 'main';
      state.tab = 'benefits';
    }
    persist();
    const routes = {
      welcome,
      concern,
      urgent,
      'auth-intro': authIntro,
      'auth-progress': authProgress,
      'auth-error': authError,
      'auth-help': authHelp,
      'data-trust': dataTrust,
      'access-statement': accessStatement,
      consent,
      main
    };
    app.innerHTML = (routes[state.route] || main)();
    bind();
    window.scrollTo(0, 0);
    requestAnimationFrame(() => document.querySelector('#main')?.focus({ preventScroll: true }));
  }

  function bind() {
    document.querySelectorAll('[data-route]').forEach(element => {
      element.onclick = () => navigate(element.dataset.route);
    });
    document.querySelectorAll('[data-tab]').forEach(element => {
      element.onclick = () => navigate('main', element.dataset.tab);
    });
    document.querySelectorAll('[data-tab-jump]').forEach(element => {
      element.onclick = () => navigate('main', element.dataset.tabJump);
    });
    document.querySelectorAll('[data-open-need]').forEach(element => {
      element.onclick = () => {
        state.activeNeed = element.dataset.openNeed;
        navigate('main', 'needs');
      };
    });
    document.querySelectorAll('[data-action="back"]').forEach(element => {
      element.onclick = () => history.length > 1 ? history.back() : navigate('main', state.tab, true);
    });
    document.querySelectorAll('[data-concern]').forEach(element => {
      element.onclick = () => {
        state.concern = element.dataset.concern;
        persist();
        document.querySelectorAll('[data-concern]').forEach(choice => {
          const selected = choice.dataset.concern === state.concern;
          choice.classList.toggle('selected', selected);
          choice.setAttribute('aria-pressed', String(selected));
        });
        const finish = document.querySelector('[data-action="finish-setup"]');
        if (finish) finish.disabled = false;
      };
    });
    document.querySelectorAll('[data-need]').forEach(element => {
      element.onclick = () => {
        state.activeNeed = element.dataset.need;
        render();
      };
    });
    document.querySelectorAll('[data-action="toggle-text"]').forEach(element => {
      element.onclick = () => { state.largeText = !state.largeText; render(); };
    });
    document.querySelectorAll('[data-action="toggle-simple"]').forEach(element => {
      element.onclick = () => { state.simpleMode = !state.simpleMode; render(); };
    });
    document.querySelectorAll('[data-action="toggle-contrast"]').forEach(element => {
      element.onclick = () => { state.highContrast = !state.highContrast; render(); };
    });
    document.querySelectorAll('[data-action="toggle-caregiver"]').forEach(element => {
      element.onclick = () => { state.caregiverMode = !state.caregiverMode; render(); };
    });
    document.querySelectorAll('[data-access]').forEach(element => {
      element.onclick = () => {
        const id = element.dataset.access;
        if (id === 'largeText') state.largeText = !state.largeText;
        else if (id === 'highContrast') state.highContrast = !state.highContrast;
        else if (id === 'simpleMode') state.simpleMode = !state.simpleMode;
        else if (id === 'caregiver') state.caregiverMode = !state.caregiverMode;
        else if (state.accessNeeds.includes(id)) state.accessNeeds = state.accessNeeds.filter(item => item !== id);
        else state.accessNeeds = [...state.accessNeeds, id];
        render();
      };
    });
    document.querySelectorAll('[data-action="read-page"]').forEach(element => {
      element.onclick = () => {
        if (!('speechSynthesis' in window)) {
          alert('Fungsi bacaan suara tidak tersedia pada peranti ini.');
          return;
        }
        speechSynthesis.cancel();
        const text = document.querySelector('#main')?.innerText.replace(/\s+/g, ' ').trim();
        if (!text) return;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ms-MY';
        utterance.rate = 0.9;
        speechSynthesis.speak(utterance);
      };
    });
    document.querySelectorAll('[data-action="load-opendosm"]').forEach(element => {
      element.onclick = async () => {
        state.dosmStatus = 'loading';
        state.dosmError = '';
        render();
        try {
          const response = await fetch('https://api.data.gov.my/opendosm?id=cpi_state&limit=3', { headers: { accept: 'application/json' } });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const data = await response.json();
          state.dosmRows = Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : []);
          state.dosmStatus = state.dosmRows.length ? 'ready' : 'error';
          state.dosmError = state.dosmRows.length ? '' : 'Respons API tidak mempunyai rekod yang boleh dipaparkan';
          state.dosmUpdatedAt = new Date().toLocaleString('ms-MY');
        } catch (error) {
          state.dosmStatus = 'error';
          state.dosmRows = [];
          state.dosmError = error.message || 'Sambungan gagal';
          state.dosmUpdatedAt = new Date().toLocaleString('ms-MY');
        }
        render();
      };
    });
    document.querySelectorAll('[data-action="about-demo"]').forEach(element => {
      element.onclick = event => { event.preventDefault(); about(); };
    });
    const setup = document.querySelector('[data-action="finish-setup"]');
    if (setup) setup.onclick = () => {
      state.state = document.querySelector('#state-select').value;
      state.household = document.querySelector('#household-select').value;
      state.activeNeed = { groceries: 'living', fuel: 'transport', bills: 'housing', children: 'education', income: 'work' }[state.concern] || state.activeNeed;
      navigate(state.concern === 'urgent' ? 'urgent' : 'main', 'home');
    };
    const guest = document.querySelector('[data-action="guest"]');
    if (guest) guest.onclick = () => {
      state.concern = null;
      state.state = '';
      state.household = '';
      navigate('main', 'home');
    };
    const calculator = document.querySelector('[data-action="calculate-trip"]');
    if (calculator) calculator.onclick = () => {
      const km = Number(document.querySelector('#trip-km').value);
      const efficiency = Number(document.querySelector('#trip-eff').value);
      const price = Number(document.querySelector('#trip-price').value);
      const extra = Number(document.querySelector('#trip-extra').value || 0);
      const result = document.querySelector('#trip-result');
      if (!(km > 0) || !(efficiency > 0) || !(price > 0) || extra < 0) {
        result.innerHTML = '<b>Sila lengkapkan jarak, penggunaan dan harga dengan nilai yang sah.</b>';
        return;
      }
      const litres = km * efficiency / 100;
      const fuel = litres * price;
      result.innerHTML = `<small>Anggaran kos sebulan</small><strong>RM${(fuel + extra).toFixed(2)}</strong><span>Bahan api RM${fuel.toFixed(2)} + tol/parkir RM${extra.toFixed(2)}</span>`;
    };
    document.querySelectorAll('[data-auth-result]').forEach(element => {
      element.onclick = () => {
        const result = element.dataset.authResult;
        if (result === 'success') {
          state.verified = true;
          state.authAt = Date.now();
          state.authError = '';
          navigate('consent');
        } else {
          clearSession();
          state.authError = result;
          navigate('auth-error');
        }
      };
    });
    const approve = document.querySelector('[data-action="approve-consent"]');
    if (approve) approve.onclick = () => {
      state.consents = [...document.querySelectorAll('.consent-check:checked')].map(input => input.value);
      navigate('main', 'benefits');
    };
    const skip = document.querySelector('[data-action="skip-consent"]');
    if (skip) skip.onclick = () => { state.consents = []; navigate('main', 'benefits'); };
    document.querySelectorAll('[data-request-consent]').forEach(element => {
      element.onclick = () => navigate('consent');
    });
    document.querySelectorAll('[data-disconnect]').forEach(element => {
      element.onclick = () => { state.consents = state.consents.filter(id => id !== element.dataset.disconnect); render(); };
    });
    document.querySelectorAll('[data-print-checklist]').forEach(element => {
      element.onclick = () => {
        const item = benefitCatalog[Number(element.dataset.printChecklist)];
        if (!item) return;
        const checklist = item.prep.map(entry => `- ${entry}`).join('\n');
        const text = `${item.name}\n\nApa ini:\n${item.summary}\n\nSediakan jika berkaitan:\n${checklist}\n\nNota TenangKITA:\n${item.help}\n\nKeputusan rasmi: ${item.owner}\nPortal: ${item.url}`;
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `checklist-${item.name.toLowerCase().replace(/[^a-z0-9]+/gi, '-')}.txt`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(link.href), 500);
      };
    });
    const returnBenefits = document.querySelector('[data-action="return-benefits"]');
    if (returnBenefits) returnBenefits.onclick = () => navigate('main', 'benefits');
    const logout = document.querySelector('[data-action="logout"]');
    if (logout) logout.onclick = () => { clearSession(); navigate('main', 'me'); };
    const reset = document.querySelector('[data-action="reset"]');
    if (reset) reset.onclick = () => {
      if (confirm('Padam semua pilihan dan sesi prototaip pada peranti ini?')) {
        localStorage.removeItem(LOCAL_KEY);
        sessionStorage.removeItem(SESSION_KEY);
        Object.assign(state, defaults);
        navigate('welcome', 'home', true);
      }
    };
  }

  window.addEventListener('popstate', event => {
    if (event.state?.newtk) {
      state.route = event.state.route;
      state.tab = event.state.tab;
      render();
    }
  });

  document.documentElement.classList.toggle('large-text', state.largeText);
  document.documentElement.classList.toggle('simple-mode', state.simpleMode);
    document.documentElement.classList.toggle('high-contrast', state.highContrast);
  history.replaceState({ newtk: true, route: state.route, tab: state.tab }, '', location.href);
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  }
  render();
})();
