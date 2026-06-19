(() => {
  'use strict';

  const LOCAL_KEY = 'newtk-v011-preferences';
  const SESSION_KEY = 'newtk-v011-session';
  const SESSION_MS = 15 * 60 * 1000;
  const defaults = {
    route: 'welcome',
    tab: 'home',
    concern: null,
    state: '',
    household: '',
    largeText: false,
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

  function persist() {
    localStorage.setItem(LOCAL_KEY, JSON.stringify({
      route: state.route,
      tab: state.tab,
      concern: state.concern,
      state: state.state,
      household: state.household,
      largeText: state.largeText
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
  }

  function phase() {
    return `<div class="phase"><b>PROTOTAIP v0.1.1</b> Baki dan status selepas pengesahan ialah simulasi. <a href="#" data-action="about-demo">Ketahui batas prototaip</a></div>`;
  }

  function top() {
    return `<header class="topbar"><div class="brand"><div class="brand-mark" aria-hidden="true">TK</div><div><b>TenangKITA</b><small>Ringkaskan bantuan. Kecilkan beban.</small></div></div><button class="icon-button" data-action="toggle-text" aria-label="Tukar saiz teks">Aa</button></header>`;
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
    const connected = state.verified && state.consents.length > 0;
    return `<section class="card hero"><p class="eyebrow">Ringkasan anda hari ini</p><h1>Kita fokus pada ${current.label.toLowerCase()} dahulu.</h1><p>Tidak perlu semak semuanya sekarang. Mulakan dengan satu tindakan kecil yang paling sesuai.</p><button class="button" data-tab-jump="benefits">${connected ? 'Lihat bantuan saya' : 'Semak bantuan berkaitan'}</button></section><section class="card"><h2>Tindakan minggu ini</h2><div class="action-list">${weeklyActions().map((item, index) => `<article class="action"><span class="action-icon">${index + 1}</span><div><b>${item[0]}</b><small>${item[1]}</small></div></article>`).join('')}</div></section><section class="card"><h2>Status ringkas</h2><div class="status-grid"><article class="mini-card"><span>Lokasi umum</span><b>${state.state || 'Tidak dinyatakan'}</b></article><article class="mini-card"><span>Ahli isi rumah</span><b>${state.household || 'Tidak dinyatakan'}</b></article><article class="mini-card"><span>Sumber disambung</span><b>${state.consents.length}</b></article></div><div class="notice">Cadangan perlu disahkan melalui sumber rasmi sebelum membuat keputusan kewangan.</div></section>`;
  }

  function urgentSummary(showMore = true) {
    return `<section class="card urgent-card"><p class="eyebrow">Bantuan segera</p><h1>Utamakan keselamatan dan bantuan manusia.</h1><p>Anda tidak perlu log masuk untuk mendapatkan saluran bantuan.</p><div class="button-row"><a class="button danger-action full" href="tel:999">Hubungi kecemasan 999</a><a class="button-secondary full" href="tel:15999">Hubungi Talian Kasih 15999</a>${showMore ? '<button class="button-secondary full" data-route="urgent">Lihat saluran lain</button>' : ''}</div></section><section class="card"><h2>Langkah kecil sekarang</h2><div class="action-list"><article class="action"><span class="action-icon">1</span><div><b>Pastikan anda berada di tempat selamat</b><small>Jangan tunggu aplikasi jika terdapat bahaya segera.</small></div></article><article class="action"><span class="action-icon">2</span><div><b>Maklumkan orang dipercayai</b><small>Kongsi keadaan dan lokasi apabila selamat berbuat demikian.</small></div></article></div></section>`;
  }

  function weeklyActions() {
    const hasSara = state.verified && state.consents.includes('sara');
    const hasBudi = state.verified && state.consents.includes('budi');
    const common = ['Semak bantuan berkaitan', 'Lihat program yang mungkin berkaitan tanpa membuat andaian kelayakan.'];
    const maps = {
      groceries: [
        hasSara ? ['Rancang menggunakan baki SARA demo', 'Semak baki dan barangan layak sebelum menggunakan tunai.'] : ['Semak sama ada SARA berkaitan', 'Sambungkan sumber atau gunakan portal rasmi untuk melihat status dan baki.'],
        ['Bandingkan sebelum bergerak', 'Semak harga dan jadual Jualan Rahmah melalui sumber terkini.'],
        common
      ],
      fuel: [
        hasBudi ? ['Semak penggunaan BUDI95 demo', 'Gunakan rekod yang disahkan untuk merancang perjalanan minggu ini.'] : ['Semak status BUDI95', 'Sambungkan sumber atau gunakan portal rasmi sebelum membuat anggaran.'],
        ['Gabungkan perjalanan', 'Kurangkan perjalanan berulang jika praktikal dan selamat.'],
        common
      ],
      bills: [['Susun bil mengikut tarikh', 'Mulakan dengan bil yang mempunyai tarikh paling hampir.'], common, ['Simpan sedikit ruang kecemasan', 'Anggaran kecil tetap boleh membantu apabila ada perubahan.']],
      children: [['Fokus keperluan minggu ini', 'Asingkan keperluan sekolah yang perlu didahulukan.'], common, ['Semak bantuan negeri', 'Program pendidikan boleh berbeza mengikut negeri.']],
      income: [['Semak program berkaitan kerja', 'Cari latihan atau insentif mengikut keadaan pekerjaan.'], common, ['Pilih satu tindakan', 'Kemas kini satu permohonan atau dokumen dahulu.']]
    };
    return maps[state.concern] || maps.groceries;
  }

  function benefits() {
    if (!state.verified) {
      return `<section class="card hero"><p class="eyebrow">Bantuan peribadi</p><h1>Lihat maklumat anda dengan selamat.</h1><p>Log masuk hanya diperlukan untuk melihat status, baki atau penggunaan yang berkaitan dengan diri anda.</p><div class="privacy"><b>TenangKITA tidak meminta kata laluan MyDigital ID.</b><br>Pengesahan berlaku dalam aplikasi MyDigital ID.</div><button class="button full" data-route="auth-intro">Log masuk dengan MyDigital ID</button><a class="button-secondary full official-jump" href="#official-list">Lihat pilihan semakan rasmi</a></section>${publicBenefits()}`;
    }
    return `<div class="demo-banner">PENGESAHAN & DATA DEMO — Bukan identiti, baki, transaksi atau keputusan sebenar.</div><section class="card"><h1>Bantuan saya</h1><p>Hanya sumber yang anda izinkan dipaparkan. Sesi simulasi tamat selepas 15 minit.</p>${Object.keys(sources).map(benefitCard).join('')}</section>`;
  }

  function publicBenefits() {
    return `<section class="card" id="official-list"><h2>Semakan rasmi tanpa log masuk TenangKITA</h2><p>Pilih portal yang berkaitan. Portal agensi mungkin mempunyai kaedah pengesahan sendiri.</p><div class="official-grid">${Object.values(sources).map(source => `<a class="official-card" href="${source.url}" target="_blank" rel="noopener noreferrer"><b>${source.name}</b><small>${source.scope}</small><span>Semak rasmi ›</span></a>`).join('')}<a class="official-card" href="https://www.malaysia.gov.my/" target="_blank" rel="noopener noreferrer"><b>Program lain</b><small>Perkhidmatan dan maklumat kerajaan Malaysia.</small><span>Teroka ›</span></a></div></section>`;
  }

  function benefitCard(id) {
    const source = sources[id];
    const connected = state.consents.includes(id);
    const demo = {
      sara: ['Baki demo', 'RM84.50', 'Dikemas kini: simulasi hari ini'],
      budi: ['Penggunaan demo', '42 L bulan ini', 'Had dan kaedah sebenar tertakluk sumber rasmi'],
      str: ['Status demo', 'Bayaran dikreditkan', 'Tarikh dan jumlah sebenar melalui HASiL']
    }[id];
    return `<article class="benefit"><div class="benefit-head"><div><h3>${source.name}</h3><span class="tag ${connected ? 'connected' : ''}">${connected ? 'Izin aktif' : 'Belum diizinkan'}</span></div><span class="tag demo">Demo</span></div>${connected ? `<div class="benefit-data"><small>${demo[0]}</small><strong>${demo[1]}</strong><small>${demo[2]}</small></div>` : `<p>${source.scope}</p>`}<div class="meta">Sumber: ${source.name} · Akses: ${connected ? 'baca sahaja, data simulasi' : 'tiada akses'}</div><div class="inline-actions">${connected ? `<button class="text-button" data-disconnect="${id}">Tarik balik izin</button>` : `<button class="button-secondary" data-request-consent="${id}">Semak skop & beri izin</button>`}<a class="link button-secondary" href="${source.url}" target="_blank" rel="noopener noreferrer">Semak rasmi</a></div></article>`;
  }

  function needs() {
    return `<section class="card"><h1>Keperluan harian</h1><p>Maklumat awam dan alat mudah yang tidak memerlukan identiti anda.</p><div class="choice-grid"><article class="choice"><span aria-hidden="true">▣</span><span><b>Harga barang asas</b><small>Lapisan data harga memerlukan sumber langsung dan masa kemas kini.</small></span></article><article class="choice"><span aria-hidden="true">◎</span><span><b>Jualan Rahmah</b><small>Jadual mengikut lokasi akan dipaparkan selepas integrasi rasmi.</small></span></article><article class="choice"><span aria-hidden="true">◇</span><span><b>Kalkulator perjalanan</b><small>Anggaran sahaja; tiada data perjalanan disimpan dalam v0.1.1.</small></span></article></div></section>${humanSupport()}`;
  }

  function humanSupport() {
    return `<section class="card"><h2>Saluran bantuan manusia</h2><p>TenangKITA tidak memaksa rakyat menyelesaikan semuanya secara digital.</p><div class="action-list"><article class="action"><span class="action-icon">☎</span><div><b>Talian Kasih 15999</b><small>Sokongan kebajikan dan isu sosial.</small><a class="link" href="tel:15999">Hubungi 15999</a></div></article><article class="action"><span class="action-icon">!</span><div><b>Kecemasan 999</b><small>Untuk bahaya atau kecemasan segera.</small><a class="link" href="tel:999">Hubungi 999</a></div></article></div></section>`;
  }

  function urgent() {
    return shell(`${backBar()}${urgentSummary(false)}${humanSupport()}`, false);
  }

  function me() {
    return `<section class="card"><h1>Saya & privasi</h1><div class="setting-row"><div><b>Saiz teks lebih besar</b><small>Mudahkan pembacaan pada peranti kecil.</small></div><button class="button-secondary" data-action="toggle-text">${state.largeText ? 'Tutup' : 'Aktifkan'}</button></div><div class="setting-row"><div><b>Keutamaan utama</b><small>${state.concern ? concerns[state.concern].label : 'Belum dipilih'}</small></div><button class="text-button" data-route="concern">Tukar</button></div><div class="setting-row"><div><b>Status identiti</b><small>${state.verified ? 'Pengesahan simulasi aktif' : 'Belum disahkan'}</small></div><span class="tag ${state.verified ? 'connected' : ''}">${state.verified ? 'Demo aktif' : 'Tetamu'}</span></div>${state.verified ? `<button class="button-secondary full" data-action="logout">Keluar daripada sesi demo</button>` : ''}</section><section class="card"><h2>Pusat izin</h2>${Object.entries(sources).map(([id, source]) => `<div class="setting-row"><div><b>${source.name}</b><small>${state.consents.includes(id) ? 'Izin baca sahaja aktif' : 'Tidak disambungkan'}</small></div>${state.consents.includes(id) ? `<button class="text-button" data-disconnect="${id}">Tarik balik</button>` : '<span class="tag">Tiada akses</span>'}</div>`).join('')}</section><section class="card"><h2>Kawalan data</h2><p>Pilihan umum disimpan pada peranti; pengesahan dan izin hanya disimpan untuk sesi semasa.</p><button class="button-secondary danger-button full" data-action="reset">Padam semua data prototaip</button></section>`;
  }

  function authIntro() {
    return shell(`${backBar()}<section class="card"><div class="auth-logo" aria-hidden="true">ID</div><p class="eyebrow">Pengesahan identiti</p><h1>Log masuk melalui MyDigital ID</h1><p>Anda akan dibawa ke aplikasi MyDigital ID. Selepas pengesahan, anda akan kembali ke TenangKITA.</p><div class="privacy"><b>Maklumat yang diperlukan:</b><br>Pengenal bertoken dan status pengesahan. Kata laluan atau biometrik tidak diberikan kepada TenangKITA.</div><div class="button-row"><button class="button full" data-route="auth-progress">Teruskan ke MyDigital ID</button><button class="button-secondary full" data-action="back">Batal</button></div></section>`, false);
  }

  function authProgress() {
    return shell(`${backBar('Batal')}<section class="card auth-progress"><div class="auth-logo" aria-hidden="true">ID</div><h1>Simulasi MyDigital ID</h1><p>Dalam pengalaman sebenar, pengesahan berlaku dalam aplikasi MyDigital ID sebelum kembali ke TenangKITA.</p><div class="demo-banner">SIMULASI — Pilih hasil untuk menguji perjalanan pengguna.</div><div class="button-row"><button class="button full" data-auth-result="success">Simulasi pengesahan berjaya</button><button class="button-secondary full" data-auth-result="cancelled">Simulasi pengguna membatalkan</button><button class="button-secondary full" data-auth-result="unavailable">Simulasi aplikasi tidak tersedia</button></div></section>`, false);
  }

  function authError() {
    const unavailable = state.authError === 'unavailable';
    return shell(`${backBar()}<section class="card"><div class="hero-symbol error-symbol" aria-hidden="true">!</div><p class="eyebrow">Pengesahan tidak selesai</p><h1>${unavailable ? 'MyDigital ID tidak tersedia.' : 'Anda membatalkan pengesahan.'}</h1><p>${unavailable ? 'Anda masih boleh menggunakan maklumat umum atau mencuba semula kemudian.' : 'Tiada data dikongsi. Anda boleh mencuba semula apabila bersedia.'}</p><div class="button-row"><button class="button full" data-route="auth-progress">Cuba semula</button><button class="button-secondary full" data-action="return-benefits">Terus tanpa log masuk</button></div></section>`, false);
  }

  function consent() {
    return shell(`${backBar()}<section class="card"><p class="eyebrow">Pengesahan berjaya — simulasi</p><h1>Pilih maklumat yang boleh dibaca</h1><p>MyDigital ID mengesahkan identiti. Izin data manfaat diberikan secara berasingan kepada setiap sumber.</p>${Object.entries(sources).map(([id, source]) => `<article class="consent-item"><label><input type="checkbox" value="${id}" class="consent-check" ${state.consents.includes(id) ? 'checked' : ''}><span>${source.name}<small>${source.scope}. Akses baca sahaja; tiada permohonan atau rekod diubah.</small></span></label></article>`).join('')}<div class="privacy">Anda boleh menarik balik izin kemudian dalam “Saya & privasi”.</div><button class="button full" data-action="approve-consent">Simpan pilihan dan teruskan</button><button class="button-secondary full" data-action="skip-consent">Terus tanpa sambungan</button></section>`, false);
  }

  function main() {
    const view = { home, benefits, needs, me }[state.tab] || home;
    return shell(view());
  }

  function about() {
    alert('NewTenangKITA v0.1.1 ialah prototaip. MyDigital ID dan data manfaat adalah simulasi; tiada kelayakan, baki atau transaksi sebenar diproses.');
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
    document.querySelectorAll('[data-action="toggle-text"]').forEach(element => {
      element.onclick = () => { state.largeText = !state.largeText; render(); };
    });
    document.querySelectorAll('[data-action="about-demo"]').forEach(element => {
      element.onclick = event => { event.preventDefault(); about(); };
    });
    const setup = document.querySelector('[data-action="finish-setup"]');
    if (setup) setup.onclick = () => {
      state.state = document.querySelector('#state-select').value;
      state.household = document.querySelector('#household-select').value;
      navigate(state.concern === 'urgent' ? 'urgent' : 'main', 'home');
    };
    const guest = document.querySelector('[data-action="guest"]');
    if (guest) guest.onclick = () => {
      state.concern = null;
      state.state = '';
      state.household = '';
      navigate('main', 'home');
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
  history.replaceState({ newtk: true, route: state.route, tab: state.tab }, '', location.href);
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  }
  render();
})();
