(() => {
  'use strict';

  const LOCAL_KEY = 'newtk-v03-preferences';
  const SESSION_KEY = 'newtk-v03-session';
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
    authError: ''
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
    }
  };

  const needsData = {
    living: { icon: '◫', label: 'Kos sara hidup', desc: 'Harga asas, jualan berhemah dan bantuan tunai.', link: 'https://www.malaysia.gov.my/categories/bantuan-kebajikan--kemudahan/bantuan-kewangan' },
    transport: { icon: '◎', label: 'Pengangkutan', desc: 'Anggar kos perjalanan dan semak bantuan bahan api.', link: 'https://www.budi95.gov.my/' },
    health: { icon: '+', label: 'Kesihatan', desc: 'Cari saluran kesihatan dan sokongan berkaitan.', link: 'https://www.malaysia.gov.my/categories/kesihatan' },
    education: { icon: '☆', label: 'Pendidikan', desc: 'Bantuan persekolahan, pengajian dan latihan.', link: 'https://www.malaysia.gov.my/my/categories/bantuan-kebajikan--kemudahan/bantuan-pendidikan' },
    housing: { icon: '⌂', label: 'Perumahan', desc: 'Program rumah dan sokongan tempat tinggal.', link: 'https://www.malaysia.gov.my/my/categories/bantuan-kebajikan--kemudahan/bantuan-perumahan' },
    work: { icon: '◇', label: 'Kerja & pendapatan', desc: 'Pekerjaan, latihan dan perlindungan pendapatan.', link: 'https://www.malaysia.gov.my/categories/bantuan-kebajikan--kemudahan/bantuan-pekerjaan' }
  };

  const priceSamples = ['Beras putih tempatan', 'Telur ayam', 'Minyak masak'];

  const benefitCatalog = [
    { name: 'Sumbangan Asas Rahmah (SARA)', need: 'living', summary: 'Kredit barangan asas untuk penerima yang disahkan melalui saluran rasmi.', prep: ['MyKad', 'Telefon untuk menerima maklumat', 'Senarai barang asas yang diperlukan'], url: 'https://sara.gov.my/' },
    { name: 'Sumbangan Tunai Rahmah (STR)', need: 'living', summary: 'Semakan permohonan dan bayaran bantuan tunai melalui HASiL.', prep: ['MyKad', 'Maklumat pasangan dan tanggungan, jika berkaitan', 'Maklumat akaun bank, jika diminta'], url: 'https://bantuantunai.hasil.gov.my/' },
    { name: 'BUDI95', need: 'transport', summary: 'Maklumat rasmi berkaitan subsidi dan penggunaan bahan api.', prep: ['MyKad', 'Maklumat kenderaan, jika diminta', 'Aplikasi MyDigital ID untuk semakan peribadi'], url: 'https://www.budi95.gov.my/' },
    { name: 'Bantuan pendidikan', need: 'education', summary: 'Pintu masuk rasmi untuk program pendidikan yang mungkin berkaitan.', prep: ['MyKad penjaga dan anak', 'Surat atau bukti pendaftaran institusi', 'Maklumat pendapatan jika program memerlukannya'], url: needsData.education.link },
    { name: 'Bantuan perumahan', need: 'housing', summary: 'Pintu masuk rasmi untuk program rumah dan tempat tinggal.', prep: ['MyKad pemohon', 'Maklumat isi rumah', 'Bukti pendapatan atau tempat tinggal jika diminta'], url: needsData.housing.link },
    { name: 'Bantuan pekerjaan', need: 'work', summary: 'Program pekerjaan, latihan dan perlindungan pendapatan.', prep: ['MyKad', 'Maklumat pekerjaan terkini', 'Resume ringkas jika ada'], url: needsData.work.link },
    { name: 'Perkhidmatan kesihatan', need: 'health', summary: 'Maklumat perkhidmatan dan saluran kesihatan kerajaan.', prep: ['MyKad atau dokumen pengenalan', 'Surat rujukan jika ada', 'Senarai ubat atau rekod berkaitan jika ada'], url: needsData.health.link }
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
      simpleMode: state.simpleMode
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
  }

  function phase() {
    return `<div class="phase"><b>PROTOTAIP v0.3</b> Nilai demo dan anggaran bukan rekod rasmi. <a href="#" data-action="about-demo">Ketahui batas prototaip</a></div>`;
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
      ['me', '○', 'Saya']
    ];
    return `<nav class="tabs" aria-label="Navigasi utama">${items.map(([id, icon, label]) => `<button class="tab ${state.tab === id ? 'active' : ''}" data-tab="${id}" ${state.tab === id ? 'aria-current="page"' : ''}><span aria-hidden="true">${icon}</span>${label}</button>`).join('')}</nav>`;
  }

  function welcome() {
    return shell(`<section class="card hero"><div class="hero-symbol" aria-hidden="true">♥</div><p class="eyebrow">Untuk rakyat Malaysia</p><h1>Apa yang boleh kita ringankan hari ini?</h1><p>TenangKITA membantu anda memahami bantuan, kos harian dan tindakan praktikal tanpa bahasa yang menghukum.</p><div class="button-row"><button class="button full" data-route="concern">Pilih keutamaan saya</button><button class="button-secondary full" data-action="guest">Teroka maklumat umum</button></div></section><section class="card"><h2>Apa yang TenangKITA lakukan</h2><div class="action-list"><article class="action"><span class="action-icon">1</span><div><b>Ringkaskan keadaan</b><small>Tunjukkan perkara paling penting dahulu.</small></div></article><article class="action"><span class="action-icon">2</span><div><b>Cadangkan tindakan kecil</b><small>Fokus pada apa yang boleh dibuat hari ini atau minggu ini.</small></div></article><article class="action"><span class="action-icon">3</span><div><b>Hubungkan sumber rasmi</b><small>Anda mengawal sumber yang disambungkan.</small></div></article></div></section>`, false);
  }

  function concern() {
    const places = ['', 'Selangor', 'Johor', 'Kedah', 'Sabah', 'Sarawak', 'W.P. Kuala Lumpur', 'Pulau Pinang', 'Perak', 'Kelantan', 'Terengganu', 'Negeri Sembilan', 'Melaka', 'Pahang', 'Perlis', 'W.P. Putrajaya', 'W.P. Labuan'];
    const households = ['', '1', '2', '3', '4', '5', '6+'];
    return shell(`${backBar()}<section class="card"><p class="eyebrow">Pilihan anda</p><h1>Apa yang paling membimbangkan anda?</h1><p>Pilih satu dahulu. Anda boleh menukarnya kemudian.</p><div class="choice-grid">${Object.entries(concerns).map(([id, item]) => `<button class="choice ${state.concern === id ? 'selected' : ''}" data-concern="${id}" aria-pressed="${state.concern === id}"><span aria-hidden="true">${item.icon}</span><span><b>${item.label}</b><small>${item.desc}</small></span></button>`).join('')}</div><label class="field">Negeri atau wilayah (pilihan)<select id="state-select">${places.map(place => `<option value="${place}" ${place === state.state ? 'selected' : ''}>${place || 'Tidak mahu nyatakan'}</option>`).join('')}</select></label><label class="field">Bilangan ahli isi rumah (pilihan)<select id="household-select">${households.map(value => `<option value="${value}" ${value === state.household ? 'selected' : ''}>${value || 'Tidak mahu nyatakan'}</option>`).join('')}</select></label><div class="privacy">TenangKITA tidak memerlukan lokasi tepat atau pendapatan untuk meneruskan.</div><button class="button full" data-action="finish-setup" ${state.concern ? '' : 'disabled'}>Lihat cadangan saya</button></section>`, false);
  }

  function guestHome() {
    return `<section class="card hero"><p class="eyebrow">Teroka tanpa log masuk</p><h1>Mulakan dengan maklumat umum.</h1><p>Tiada lokasi, saiz isi rumah atau identiti diandaikan untuk anda.</p><button class="button" data-route="concern">Pilih keutamaan jika mahu</button></section><section class="card"><h2>Boleh dibuat sekarang</h2><div class="action-list"><article class="action"><span class="action-icon">1</span><div><b>Teroka bantuan awam</b><small>Lihat SARA, STR dan program lain tanpa menentukan kelayakan.</small></div></article><article class="action"><span class="action-icon">2</span><div><b>Semak sumber rasmi</b><small>Buka portal agensi untuk syarat dan maklumat terkini.</small></div></article><article class="action"><span class="action-icon">3</span><div><b>Dapatkan bantuan manusia</b><small>Saluran bantuan kekal tersedia tanpa pengesahan identiti.</small></div></article></div></section>`;
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
    return `<section class="card hero"><p class="eyebrow">Ringkasan anda hari ini</p><h1>Kita fokus pada ${current.label.toLowerCase()} dahulu.</h1><p>Tidak perlu semak semuanya sekarang. Mulakan dengan satu tindakan kecil.</p><button class="button full" data-open-need="${primary[0]}">${primary[1]}</button></section><section class="card"><h2>Tindakan minggu ini</h2><p class="detail-extra">Tekan mana-mana tindakan untuk terus ke langkah seterusnya.</p><div class="action-list">${weeklyActions().map((item, index) => `<button class="action action-button" ${item[2] === 'benefits' ? 'data-tab-jump="benefits"' : `data-open-need="${item[2]}"`}><span class="action-icon">${index + 1}</span><span><b>${item[0]}</b><small>${item[1]}</small></span><span class="action-arrow" aria-hidden="true">›</span></button>`).join('')}</div></section><section class="card secondary-card"><h2>Status ringkas</h2><div class="status-grid"><article class="mini-card"><span>Lokasi umum</span><b>${state.state || 'Tidak dinyatakan'}</b></article><article class="mini-card"><span>Ahli isi rumah</span><b>${state.household || 'Tidak dinyatakan'}</b></article><article class="mini-card"><span>Sumber yang anda benarkan</span><b>${state.consents.length}</b></article></div><div class="notice">Semak portal rasmi sebelum membuat keputusan kewangan.</div></section>`;
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
    return `<div class="demo-banner">PENGESAHAN & DATA DEMO — Bukan identiti, baki, transaksi atau keputusan sebenar.</div><section class="card"><h1>Bantuan saya</h1><p>Hanya sumber yang anda izinkan dipaparkan. Sesi simulasi tamat selepas 15 minit.</p>${Object.keys(sources).map(benefitCard).join('')}</section>${benefitDiscovery()}`;
  }

  function benefitDiscovery() {
    const mapped = { groceries: 'living', fuel: 'transport', bills: 'housing', children: 'education', income: 'work' }[state.concern];
    const ordered = [...benefitCatalog].sort((a, b) => Number(b.need === mapped) - Number(a.need === mapped));
    return `<section class="card"><p class="eyebrow">Teroka tanpa log masuk</p><h2>Bantuan yang mungkin berkaitan</h2><p>Senarai ini membantu anda bersedia. Agensi berkenaan menentukan kelayakan.</p><div class="catalog">${ordered.map(item => `<article class="catalog-item"><div><span class="tag official">Pautan rasmi</span>${item.need === mapped ? '<span class="tag relevant">Berkaitan pilihan anda</span>' : ''}<h3>${item.name}</h3><p>${item.summary}</p></div><details class="prep"><summary>Sebelum membuka portal</summary><p>Sediakan jika berkaitan:</p><ul>${item.prep.map(entry => `<li>${entry}</li>`).join('')}</ul><small>Dokumen sebenar bergantung pada syarat program semasa.</small></details><div class="truth-row"><span><b>Jenis</b>Panduan TenangKITA</span><span><b>Keputusan</b>Oleh agensi</span></div><a class="button-secondary" href="${item.url}" target="_blank" rel="noopener noreferrer">Buka portal rasmi</a></article>`).join('')}</div></section>`;
  }

  function publicBenefits() {
    return `<section class="card" id="official-list"><h2>Semakan rasmi tanpa log masuk TenangKITA</h2><p>Pilih portal yang berkaitan. Portal agensi mungkin mempunyai kaedah pengesahan sendiri.</p><div class="official-grid">${Object.values(sources).map(source => `<a class="official-card" href="${source.url}" target="_blank" rel="noopener noreferrer"><b>${source.name}</b><small>${source.scope}</small><span>Semak rasmi ›</span></a>`).join('')}<a class="official-card" href="https://www.malaysia.gov.my/" target="_blank" rel="noopener noreferrer"><b>Program lain</b><small>Perkhidmatan dan maklumat kerajaan Malaysia.</small><span>Teroka ›</span></a></div></section>`;
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

  function humanSupport() {
    return `<section class="card"><h2>Saluran bantuan manusia</h2><p>Anda boleh mendapatkan bantuan tanpa menyelesaikan semuanya secara digital.</p><div class="support-list"><article class="support-card"><span class="action-icon">☎</span><div><b>Talian Kasih 15999</b><small>24 jam untuk kebajikan, perlindungan dan isu sosial.</small><div class="inline-actions"><a class="link" href="tel:15999">Telefon</a><a class="link" href="https://wa.me/60192615999" target="_blank" rel="noopener noreferrer">WhatsApp</a></div></div></article><article class="support-card"><span class="action-icon">!</span><div><b>Kecemasan 999</b><small>Untuk bahaya atau kecemasan yang memerlukan tindakan segera.</small><a class="link" href="tel:999">Hubungi 999</a></div></article></div><div class="truth-note"><b>Sumber: Portal Rasmi Kerajaan Malaysia</b><span>Semak semula nombor jika maklumat pada portal rasmi berubah.</span></div></section>`;
  }

  function urgent() {
    return shell(`${backBar()}${urgentSummary(false)}${humanSupport()}`, false);
  }

  function me() {
    return `<section class="card"><h1>Saya & privasi</h1><div class="setting-row"><div><b>Paparan mudah</b><small>Kurangkan maklumat dan tunjuk tindakan utama.</small></div><button class="button-secondary" data-action="toggle-simple">${state.simpleMode ? 'Tutup' : 'Aktifkan'}</button></div><div class="setting-row"><div><b>Saiz teks lebih besar</b><small>Mudahkan pembacaan pada peranti kecil.</small></div><button class="button-secondary" data-action="toggle-text">${state.largeText ? 'Tutup' : 'Aktifkan'}</button></div><div class="setting-row"><div><b>Bacakan halaman</b><small>Gunakan suara yang tersedia pada peranti.</small></div><button class="button-secondary" data-action="read-page">Dengar</button></div><div class="setting-row"><div><b>Keutamaan utama</b><small>${state.concern ? concerns[state.concern].label : 'Belum dipilih'}</small></div><button class="text-button" data-route="concern">Tukar</button></div><div class="setting-row"><div><b>Status identiti</b><small>${state.verified ? 'Pengesahan simulasi aktif' : 'Belum disahkan'}</small></div><span class="tag ${state.verified ? 'connected' : ''}">${state.verified ? 'Demo aktif' : 'Tetamu'}</span></div>${state.verified ? `<button class="button-secondary full" data-action="logout">Keluar daripada sesi demo</button>` : ''}</section><section class="card secondary-card"><h2>Sumber & ketelusan</h2><p>Lihat dari mana maklumat datang, cara ia digunakan dan batasnya.</p><button class="button-secondary full" data-route="data-trust">Lihat sumber & kaedah</button></section><section class="card secondary-card"><h2>Pusat kebenaran</h2>${Object.entries(sources).map(([id, source]) => `<div class="setting-row"><div><b>${source.name}</b><small>${state.consents.includes(id) ? 'Kebenaran melihat maklumat aktif' : 'Tidak disambungkan'}</small></div>${state.consents.includes(id) ? `<button class="text-button" data-disconnect="${id}">Tarik balik</button>` : '<span class="tag">Tiada akses</span>'}</div>`).join('')}</section><section class="card secondary-card"><h2>Kawalan data</h2><p>Pilihan umum disimpan pada peranti ini. Pengesahan dan kebenaran tamat bersama sesi.</p><button class="button-secondary danger-button full" data-action="reset">Padam semua data prototaip</button></section>`;
  }

  function dataTrust() {
    const rows = [
      ['Harga barang', 'Belum disambungkan', 'Tiada angka dipaparkan. Prototaip membuka PriceCatcher untuk harga semasa.'],
      ['Jualan Rahmah', 'Belum disambungkan', 'Prototaip membuka jadual rasmi KPDN tanpa menyalin acara.'],
      ['Kalkulator perjalanan', 'Anggaran tempatan', 'Formula: bahan api + tol/parkir berdasarkan input pengguna. Input tidak disimpan.'],
      ['SARA, BUDI95 & STR', 'Data demo selepas izin', 'Tiada API sebenar. Baki, status dan penggunaan hanyalah simulasi.'],
      ['Katalog bantuan', 'Pautan portal rasmi', 'TenangKITA membantu mencari; agensi menentukan syarat dan kelayakan.']
    ];
    return shell(`${backBar()}<section class="card"><p class="eyebrow">Sumber & ketelusan</p><h1>Kenali setiap maklumat.</h1><p>Setiap modul menyatakan sama ada maklumat itu rasmi, demo, anggaran atau belum disambungkan.</p><div class="source-list">${rows.map(row => `<article class="source-card"><div><h3>${row[0]}</h3><span class="tag">${row[1]}</span></div><p>${row[2]}</p></article>`).join('')}</div></section><section class="card"><h2>Prinsip prototaip</h2><ul class="plain-list"><li>Tidak mengisytiharkan kelayakan bantuan.</li><li>Tidak mereka baki, lokasi acara atau harga sebagai data semasa.</li><li>Membuka portal rasmi untuk pengesahan akhir.</li><li>Mengutamakan tindakan mudah tanpa memalukan pengguna.</li></ul></section>`, false);
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
    return shell(`${backBar()}<section class="card"><p class="eyebrow">Pengesahan berjaya — simulasi</p><h1>Pilih maklumat yang boleh dilihat</h1><p>Anda tentukan sumber yang boleh dibaca. TenangKITA tidak mengubah permohonan atau rekod.</p>${Object.entries(sources).map(([id, source]) => `<article class="consent-item"><label><input type="checkbox" value="${id}" class="consent-check" ${state.consents.includes(id) ? 'checked' : ''}><span>${source.name}<small>${source.scope}. TenangKITA hanya melihat maklumat yang anda benarkan.</small></span></label></article>`).join('')}<div class="privacy">Anda boleh menarik balik kebenaran pada bila-bila masa dalam “Saya & privasi”.</div><button class="button full" data-action="approve-consent">Simpan pilihan dan teruskan</button><button class="button-secondary full" data-action="skip-consent">Terus tanpa sambungan</button></section>`, false);
  }

  function main() {
    const view = { home, benefits, needs, me }[state.tab] || home;
    return shell(view());
  }

  function about() {
    alert('NewTenangKITA v0.3 ialah prototaip. MyDigital ID dan data manfaat adalah simulasi. Harga sebenar tidak dipaparkan; kalkulator menghasilkan anggaran pada peranti. Tiada kelayakan, baki atau transaksi sebenar diproses.');
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
  history.replaceState({ newtk: true, route: state.route, tab: state.tab }, '', location.href);
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  }
  render();
})();
