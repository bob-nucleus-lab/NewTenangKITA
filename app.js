const NTK_VERSION = '0.8';
const STORAGE_KEY = 'newtenangkita_v08_state';

const OFFICIAL = {
  opendosmDocs: 'https://developer.data.gov.my/static-api/opendosm',
  opendosmApi: 'https://api.data.gov.my/opendosm?id=cpi_core&limit=3',
  pricecatcher: 'https://data.gov.my/data-catalogue/pricecatcher',
  str: 'https://bantuantunai.hasil.gov.my/',
  sara: 'https://sara.gov.my/',
  mydigitalid: 'https://www.digital-id.my/en/support',
  padu: 'https://padu.gov.my/',
  taliankasih: 'https://www.malaysia.gov.my/my/categories/keselamatan-undang-undang/golongan-rentan/talian-kasih-15999',
  whatsappKasih: 'https://wa.me/60192615999'
};

const concerns = [
  {id:'belanja', label:'Belanja dapur'},
  {id:'petrol', label:'Petrol'},
  {id:'bantuan', label:'Bantuan'},
  {id:'kesihatan', label:'Kesihatan'},
  {id:'pendidikan', label:'Pendidikan'},
  {id:'kerja', label:'Kerja'},
  {id:'rumah', label:'Sewa / rumah'},
  {id:'segera', label:'Bantuan segera'}
];

const actionMap = {
  belanja: {title:'Semak harga barang asas', desc:'Mulakan dengan sumber rasmi. Tiada harga contoh dipaparkan.', view:'price', cta:'Semak sumber harga'},
  petrol: {title:'Kira kos perjalanan', desc:'Anggaran dibuat di peranti anda sahaja.', view:'travel', cta:'Kira kos'},
  bantuan: {title:'Semak bantuan berkaitan', desc:'Lihat checklist dahulu, kemudian buka saluran rasmi.', view:'assist', cta:'Lihat bantuan'},
  kesihatan: {title:'Cari sokongan kesihatan', desc:'Sediakan maklumat asas sebelum semakan rasmi.', view:'health', cta:'Lihat sokongan'},
  pendidikan: {title:'Semak bantuan pendidikan', desc:'Fokus kepada dokumen anak dan sekolah dahulu.', view:'education', cta:'Lihat checklist'},
  kerja: {title:'Semak sokongan kerja', desc:'Mulakan dengan profil pekerjaan dan latihan.', view:'work', cta:'Lihat pilihan'},
  rumah: {title:'Semak sokongan perumahan', desc:'Sediakan dokumen sewa, bil dan tanggungan.', view:'housing', cta:'Lihat checklist'},
  segera: {title:'Dapatkan bantuan segera', desc:'Tidak perlu log masuk untuk melihat saluran bantuan.', view:'urgent', cta:'Lihat bantuan segera'}
};

const assistance = [
  {
    id:'str', title:'Sumbangan Tunai Rahmah (STR)', category:'Sara hidup', owner:'LHDNM / MOF', url:OFFICIAL.str,
    status:'Semak rasmi', tag:'Pautan rasmi',
    intro:'Bantuan tunai kerajaan untuk kumpulan yang berkelayakan. TenangKITA hanya bantu sediakan semakan.',
    prepare:['MyKad pemohon dan pasangan jika berkaitan','Maklumat tanggungan','Maklumat akaun bank jika diminta','Dokumen sokongan jika berlaku perubahan keadaan'],
    cannot:'TenangKITA tidak boleh sahkan kelulusan STR.'
  },
  {
    id:'sara', title:'Sumbangan Asas Rahmah (SARA)', category:'Sara hidup', owner:'MOF / MyKasih', url:OFFICIAL.sara,
    status:'Semak rasmi', tag:'Pautan rasmi',
    intro:'Sokongan pembelian barangan asas melalui saluran rasmi. Baki sebenar memerlukan semakan rasmi.',
    prepare:['MyKad penerima','Kedai terpilih berhampiran','Senarai barangan asas yang diperlukan','Semak baki melalui saluran rasmi'],
    cannot:'TenangKITA tidak memaparkan baki sebenar tanpa API rasmi.'
  },
  {
    id:'budi95', title:'BUDI95 / subsidi petrol', category:'Pengangkutan', owner:'MOF / pemilik sistem berkaitan', url:'',
    status:'Masa hadapan', tag:'Perlu API rasmi',
    intro:'Aliran ini disediakan untuk readiness. Semakan sebenar perlu dibuat melalui sistem rasmi yang ditetapkan.',
    prepare:['MyKad atau pengesahan rasmi yang diperlukan','Maklumat kenderaan jika diminta','Resit petrol untuk kiraan sendiri','Semak kuota melalui saluran rasmi apabila tersedia'],
    cannot:'TenangKITA tidak mengira baki rasmi subsidi petrol.'
  },
  {
    id:'oku', title:'Sokongan OKU dan penjaga', category:'OKU / Kebajikan', owner:'JKM / KPWKM', url:OFFICIAL.taliankasih,
    status:'Bantuan manusia', tag:'Kaunter / telefon',
    intro:'Untuk warga OKU, penjaga, warga emas atau sesiapa yang perlukan bantuan akses.',
    prepare:['Dokumen pengenalan','Maklumat keadaan atau keperluan akses','Dokumen kesihatan atau sokongan jika ada','Maklumat penjaga jika berkaitan'],
    cannot:'TenangKITA tidak menentukan status OKU atau kelayakan bantuan.'
  },
  {
    id:'jkm', title:'Bantuan JKM / kebajikan', category:'Kebajikan', owner:'JKM / KPWKM', url:OFFICIAL.taliankasih,
    status:'Bantuan manusia', tag:'Telefon / WhatsApp',
    intro:'Untuk keadaan rentan, keluarga memerlukan, perlindungan atau sokongan sosial.',
    prepare:['MyKad','Maklumat isi rumah','Dokumen pendapatan jika ada','Ringkasan masalah yang dihadapi'],
    cannot:'Agensi berkaitan sahaja boleh menilai dan meluluskan bantuan.'
  },
  {
    id:'state', title:'Bantuan negeri', category:'Negeri', owner:'Kerajaan Negeri', url:'https://www.malaysia.gov.my/',
    status:'Semak rasmi', tag:'Pautan umum',
    intro:'Program negeri berbeza mengikut lokasi dan syarat semasa.',
    prepare:['Negeri tempat tinggal','Dokumen pengenalan','Bukti alamat jika diminta','Dokumen khusus program'],
    cannot:'TenangKITA belum menyemak semua program negeri secara automatik.'
  }
];

const needs = [
  {id:'sara', title:'Sara hidup', desc:'Harga barang asas, SARA, STR dan Jualan Rahmah.', view:'price'},
  {id:'transport', title:'Pengangkutan', desc:'Kos perjalanan, petrol dan pilihan bantuan.', view:'travel'},
  {id:'health', title:'Kesihatan', desc:'Sokongan kesihatan dan laluan bantuan manusia.', view:'health'},
  {id:'education', title:'Pendidikan', desc:'Bantuan anak, sekolah dan dokumen sokongan.', view:'education'},
  {id:'housing', title:'Perumahan', desc:'Sewa, bil dan sokongan keluarga.', view:'housing'},
  {id:'work', title:'Kerja & pendapatan', desc:'Latihan, pekerjaan dan sokongan ekonomi.', view:'work'}
];

const resources = [
  {title:'OpenDOSM', owner:'DOSM / data.gov.my', type:'API rasmi', status:'Mikro-integrasi v0.8', url:OFFICIAL.opendosmDocs, note:'Digunakan untuk konteks awam, bukan penilaian keluarga.'},
  {title:'PriceCatcher', owner:'KPDN / DOSM', type:'Dataset rasmi', status:'Perlu adapter/cache', url:OFFICIAL.pricecatcher, note:'Tidak dipanggil terus dari telefon dalam prototaip ini.'},
  {title:'STR', owner:'LHDNM / MOF', type:'Portal rasmi', status:'Pautan rasmi', url:OFFICIAL.str, note:'Kelulusan hanya boleh disahkan oleh sistem rasmi.'},
  {title:'SARA', owner:'MOF / MyKasih', type:'Portal rasmi', status:'Pautan rasmi', url:OFFICIAL.sara, note:'Baki sebenar tidak dipaparkan tanpa API rasmi.'},
  {title:'MyDigital ID', owner:'My Digital ID Sdn. Bhd.', type:'Identiti', status:'Simulasi handoff', url:OFFICIAL.mydigitalid, note:'TenangKITA tidak menerima kata laluan atau biometrik.'},
  {title:'PADU', owner:'Pemilik sistem PADU', type:'Masa hadapan', status:'Consent-based', url:OFFICIAL.padu, note:'Bukan open data. Memerlukan izin pengguna dan kelulusan pemilik sistem.'},
  {title:'Talian Kasih', owner:'KPWKM', type:'Bantuan manusia', status:'Telefon / WhatsApp', url:OFFICIAL.taliankasih, note:'Untuk keadaan rentan atau apabila pengguna perlukan bantuan manusia.'}
];

const defaultState = {
  tab:'home', view:null, concern:null, simple:false, largeText:false, highContrast:false,
  caregiver:false, accessNeeds:[], verified:false, consent:{str:false,sara:false,budi95:false,padu:false},
  opendosm:null, opendosmError:null, lastOpened:null
};
let state = loadState();
let historyStack = [];

function loadState(){
  try { return {...defaultState, ...(JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}'))}; }
  catch { return {...defaultState}; }
}
function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function $(sel){ return document.querySelector(sel); }
function escapeHtml(value){ return String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function openOfficial(url){ if(!url){ toast('Pautan rasmi belum ditetapkan untuk prototaip ini.'); return; } window.open(url, '_blank', 'noopener,noreferrer'); }
function setTab(tab){ historyStack = []; state.tab = tab; state.view = null; saveState(); render(); }
function go(view){ historyStack.push({tab:state.tab, view:state.view}); state.view = view; saveState(); render(); window.scrollTo({top:0, behavior:'smooth'}); }
function back(){ const prev = historyStack.pop(); if(prev){ state.tab=prev.tab; state.view=prev.view; } else { state.view=null; } saveState(); render(); }
function toast(message){ const el=$('#toast'); el.textContent=message; el.classList.add('show'); clearTimeout(window.__toast); window.__toast=setTimeout(()=>el.classList.remove('show'),2600); }
function applyModes(){ const shell=$('#shell'); shell.classList.toggle('easy', state.simple); shell.classList.toggle('large-text', state.largeText); shell.classList.toggle('high-contrast', state.highContrast); $('#easyBtn').textContent = state.simple ? 'Paparan Biasa' : 'Paparan Mudah'; }
function truth({source='Sumber rasmi', type='Panduan', updated='Semak di sumber', unknown='Maklumat peribadi'}){
  return `<div class="truth-grid" aria-label="Label amanah data">
    <div class="truth-item"><span>Sumber</span><strong>${escapeHtml(source)}</strong></div>
    <div class="truth-item"><span>Jenis</span><strong>${escapeHtml(type)}</strong></div>
    <div class="truth-item"><span>Dikemas kini</span><strong>${escapeHtml(updated)}</strong></div>
    <div class="truth-item"><span>Belum diketahui</span><strong>${escapeHtml(unknown)}</strong></div>
  </div>`;
}
function checklist(items){ return `<ul class="checklist">${items.map(i=>`<li>${escapeHtml(i)}</li>`).join('')}</ul>`; }
function button(label, attrs=''){ return `<button class="primary-btn" type="button" ${attrs}>${escapeHtml(label)}</button>`; }
function secondary(label, attrs=''){ return `<button class="secondary-btn" type="button" ${attrs}>${escapeHtml(label)}</button>`; }

function render(){
  applyModes();
  document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('is-active', b.dataset.tab===state.tab));
  $('#backBtn').hidden = !state.view;
  const app=$('#app');
  if(state.view){ app.innerHTML = renderView(state.view); bindView(state.view); app.focus({preventScroll:true}); return; }
  if(state.tab==='home') app.innerHTML = renderHome();
  if(state.tab==='help') app.innerHTML = renderHelp();
  if(state.tab==='needs') app.innerHTML = renderNeeds();
  if(state.tab==='access') app.innerHTML = renderAccess();
  if(state.tab==='me') app.innerHTML = renderMe();
  bindCommon();
  app.focus({preventScroll:true});
}

function renderHome(){
  const selected = state.concern || 'belanja';
  const action = actionMap[selected];
  return `<section class="stack">
    <div class="hero">
      <p class="eyebrow">Untuk rakyat Malaysia</p>
      <h1>Apa yang membimbangkan anda hari ini?</h1>
      <p class="lead optional-copy">Pilih satu perkara dahulu. NewTenangKITA bantu ringkaskan langkah seterusnya.</p>
      <div class="chips" role="listbox" aria-label="Pilihan kebimbangan">
        ${concerns.map(c=>`<button class="pill ${selected===c.id?'is-active':''}" data-concern="${c.id}" role="option" aria-selected="${selected===c.id}">${c.label}</button>`).join('')}
      </div>
    </div>
    <div class="card soft">
      <span class="badge blue">Cadangan hari ini</span>
      <h2>${escapeHtml(action.title)}</h2>
      <p>${escapeHtml(action.desc)}</p>
      ${button(action.cta, `data-go="${action.view}"`)}
    </div>
    <div class="action-list" aria-label="Langkah ringkas">
      ${homeRows(selected)}
    </div>
    <div class="card">
      <div class="row"><span class="badge">Prototaip</span><span class="tiny">Tiada data peribadi disimpan</span></div>
    </div>
  </section>`;
}
function homeRows(selected){
  const rows = selected === 'segera' ? [
    ['Hubungi bantuan manusia','Talian Kasih, WhatsApp atau 999 jika kecemasan.','urgent'],
    ['Saya perlukan bantuan akses','Aktifkan teks besar, kontras atau bantuan penjaga.','access'],
    ['Lihat status prototaip','Fahami had data sebelum guna.','prototype']
  ] : [
    ['Sediakan dokumen dahulu','Checklist ringkas sebelum buka portal rasmi.','assist'],
    ['Semak sumber rasmi','Lihat sumber, jenis data dan had maklumat.','data'],
    ['Saya perlukan bantuan akses','Paparan mudah, teks besar, kontras dan penjaga.','access']
  ];
  return rows.map(r=>`<button type="button" class="action-row" data-go="${r[2]}"><span><strong>${r[0]}</strong><span>${r[1]}</span></span><span class="chev">›</span></button>`).join('');
}

function renderHelp(filter=''){
  return `<section class="stack">
    <div class="hero">
      <p class="eyebrow">Katalog Bantuan Malaysia</p>
      <h1>Semak bantuan tanpa rasa dihukum.</h1>
      <p class="lead optional-copy">TenangKITA tidak menentukan kelayakan. Ia bantu anda bersedia sebelum ke saluran rasmi.</p>
    </div>
    <div class="chips" aria-label="Kategori bantuan">
      ${['Semua','Sara hidup','Pengangkutan','OKU / Kebajikan','Kebajikan','Negeri'].map(x=>`<button class="pill" data-filter="${x}">${x}</button>`).join('')}
    </div>
    <div class="stack" id="assistanceList">${assistanceCards(assistance)}</div>
  </section>`;
}
function assistanceCards(list){
  return list.map(item=>`<article class="card">
    <div class="row"><span class="badge blue">${escapeHtml(item.tag)}</span><span class="tiny">${escapeHtml(item.owner)}</span></div>
    <h2>${escapeHtml(item.title)}</h2>
    <p>${escapeHtml(item.intro)}</p>
    ${truth({source:item.owner,type:item.status,updated:'Semak di sumber rasmi',unknown:'Kelayakan individu'})}
    <details class="accordion"><summary>Apa perlu sediakan?</summary><div class="inside">${checklist(item.prepare)}<p><strong>Had:</strong> ${escapeHtml(item.cannot)}</p></div></details>
    <div class="grid-2" style="margin-top:12px">
      ${secondary('Buka rasmi', `data-open="${escapeHtml(item.url)}"`)}
      ${secondary('Bantuan manusia', `data-open="${OFFICIAL.taliankasih}"`)}
    </div>
  </article>`).join('');
}

function renderNeeds(){
  return `<section class="stack">
    <div class="hero">
      <p class="eyebrow">Keperluan keluarga</p>
      <h1>Pilih satu keperluan dahulu.</h1>
      <p class="lead optional-copy">Setiap pilihan membawa kepada langkah ringkas, bukan dashboard yang panjang.</p>
    </div>
    <div class="stack">
      ${needs.map(n=>`<button type="button" class="action-row" data-go="${n.view}"><span><strong>${escapeHtml(n.title)}</strong><span>${escapeHtml(n.desc)}</span></span><span class="chev">›</span></button>`).join('')}
    </div>
  </section>`;
}

function renderAccess(){
  return `<section class="stack">
    <div class="hero">
      <p class="eyebrow">Akses untuk semua</p>
      <h1>Adakah anda perlukan paparan lebih sesuai?</h1>
      <p class="lead optional-copy">Pilihan ini disimpan di peranti anda sahaja.</p>
    </div>
    <div class="card">
      ${toggleRow('Paparan Mudah','Ayat lebih pendek dan kurang maklumat teknikal.','simple', state.simple)}
      ${toggleRow('Teks besar','Besarkan teks untuk bacaan lebih selesa.','largeText', state.largeText)}
      ${toggleRow('Kontras tinggi','Paparan lebih jelas untuk sesetengah pengguna.','highContrast', state.highContrast)}
      ${toggleRow('Saya membantu ahli keluarga','Mod penjaga dengan peringatan izin individu.','caregiver', state.caregiver)}
    </div>
    <div class="card soft">
      <h2>Sokongan OKU / penjaga</h2>
      <p>Pilih bantuan akses tanpa perlu mengisytihar status peribadi.</p>
      ${checklist(['Pembaca skrin atau label yang jelas','Teks besar dan kontras tinggi','Bantuan penjaga dengan izin','Saluran telefon, WhatsApp atau kaunter'])}
      <div class="grid-2" style="margin-top:12px">
        ${secondary('Talian Kasih', `data-open="${OFFICIAL.taliankasih}"`)}
        ${secondary('WhatsApp', `data-open="${OFFICIAL.whatsappKasih}"`)}
      </div>
    </div>
    <div class="card">
      <h2>Baca kepada saya</h2>
      <p class="small">Baca ringkasan tindakan semasa menggunakan suara peranti.</p>
      ${secondary('Baca ringkasan', 'id="speakBtn"')}
    </div>
  </section>`;
}
function toggleRow(title, desc, key, checked){
  return `<div class="switch-row" style="margin:10px 0"><div><strong>${escapeHtml(title)}</strong><p class="tiny">${escapeHtml(desc)}</p></div><label class="switch"><input type="checkbox" data-toggle="${key}" ${checked?'checked':''}/><span class="slider"></span></label></div>`;
}

function renderMe(){
  return `<section class="stack">
    <div class="hero">
      <p class="eyebrow">Saya & privasi</p>
      <h1>Anda kawal apa yang disambungkan.</h1>
      <p class="lead optional-copy">Prototaip ini tidak mempunyai pangkalan data dan tidak menyimpan data peribadi rakyat.</p>
    </div>
    <div class="card">
      <div class="row"><div><h2>MyDigital ID</h2><p class="small">Simulasi handoff sahaja. Tiada kata laluan diminta.</p></div><span class="badge ${state.verified?'green':'amber'}">${state.verified?'Simulasi sah':'Belum'}</span></div>
      <div class="grid-2" style="margin-top:12px">
        ${secondary(state.verified?'Sahkan semula':'Log masuk simulasi', 'data-go="myid"')}
        ${secondary('Terus tanpa log masuk', 'data-noop="guest"')}
      </div>
    </div>
    <div class="card">
      <h2>Sambungan demo</h2>
      <p class="small">Baki sebenar tidak dipaparkan. Ini hanya latihan aliran izin.</p>
      ${consentRow('STR','str')}${consentRow('SARA','sara')}${consentRow('BUDI95','budi95')}${consentRow('PADU masa hadapan','padu')}
    </div>
    <div class="action-list">
      <button type="button" class="action-row" data-go="data"><span><strong>Amanah Data</strong><span>Sumber rasmi, OpenDOSM dan had maklumat.</span></span><span class="chev">›</span></button>
      <button type="button" class="action-row" data-go="prototype"><span><strong>Status prototaip</strong><span>GitHub sahaja, tiada database, future AWS selepas persetujuan.</span></span><span class="chev">›</span></button>
      <button type="button" class="action-row" id="clearBtn"><span><strong>Padam data tempatan</strong><span>Padam pilihan prototaip di pelayar ini.</span></span><span class="chev">›</span></button>
    </div>
  </section>`;
}
function consentRow(label,key){ return `<div class="switch-row" style="margin:12px 0"><div><strong>${label}</strong><p class="tiny">${key==='padu'?'Readiness masa hadapan':'Demo izin sahaja'}</p></div><label class="switch"><input type="checkbox" data-consent="${key}" ${state.consent[key]?'checked':''} ${state.verified?'':'disabled'}/><span class="slider"></span></label></div>`; }

function renderView(view){
  if(view==='price') return viewPrice();
  if(view==='travel') return viewTravel();
  if(view==='assist') return viewAssist('Semua');
  if(view==='health') return genericSupport('Kesihatan','Sediakan ringkasan keadaan, klinik/hospital berkaitan dan dokumen sokongan.','Bantuan manusia tersedia jika proses digital sukar.');
  if(view==='education') return genericSupport('Pendidikan','Sediakan maklumat anak, sekolah, dokumen penjaga dan bukti keperluan jika diminta.','Semak portal rasmi atau pejabat berkaitan.');
  if(view==='work') return genericSupport('Kerja & pendapatan','Sediakan resume ringkas, kemahiran, sektor minat dan status pekerjaan.','Gunakan saluran rasmi latihan/pekerjaan apabila disahkan.');
  if(view==='housing') return genericSupport('Perumahan','Sediakan dokumen sewa, bil, alamat dan tanggungan.','Semak program negeri atau agensi berkaitan.');
  if(view==='urgent') return viewUrgent();
  if(view==='access') return renderAccess();
  if(view==='myid') return viewMyID();
  if(view==='data') return viewData();
  if(view==='prototype') return viewPrototype();
  return `<section class="stack"><div class="card"><h2>Tiada paparan</h2></div></section>`;
}
function viewPrice(){
  return `<section class="stack">
    <div class="hero"><p class="eyebrow">Belanja dapur</p><h1>Semak harga melalui sumber rasmi.</h1><p class="lead optional-copy">Prototaip ini tidak memaparkan harga contoh supaya rakyat tidak tersalah anggap.</p></div>
    <div class="card soft"><h2>Langkah ringkas</h2>${checklist(['Pilih barang yang ingin disemak','Semak lokasi atau kawasan','Buka sumber rasmi','Bandingkan sebelum bergerak'])}${truth({source:'PriceCatcher / data.gov.my',type:'Pautan rasmi',updated:'Semak di sumber',unknown:'Harga berhampiran secara terus'})}<div class="grid-2" style="margin-top:12px">${secondary('Buka PriceCatcher', `data-open="${OFFICIAL.pricecatcher}"`)}${secondary('Amanah Data', 'data-go="data"')}</div></div>
    <div class="card"><h2>Kenapa tiada harga contoh?</h2><p class="small">Harga yang tidak disambungkan secara rasmi boleh mengelirukan. Untuk fasa GitHub, TenangKITA hanya tunjuk laluan semakan dan readiness adapter.</p></div>
  </section>`;
}
function viewTravel(){
  return `<section class="stack">
    <div class="hero"><p class="eyebrow">Petrol & perjalanan</p><h1>Kira anggaran kos sendiri.</h1><p class="lead optional-copy">Kiraan ini berlaku dalam pelayar anda sahaja.</p></div>
    <div class="card">
      <div class="form-grid">
        <div class="field"><label for="km">Jarak pergi balik (km)</label><input id="km" inputmode="decimal" placeholder="Contoh: 24" /></div>
        <div class="field"><label for="eff">Penggunaan petrol (L/100km)</label><input id="eff" inputmode="decimal" placeholder="Contoh: 7.5" /></div>
        <div class="field"><label for="price">Harga petrol per liter (RM)</label><input id="price" inputmode="decimal" placeholder="Masukkan harga semasa" /></div>
        ${button('Kira anggaran', 'id="calcBtn"')}
      </div>
      <div id="calcOutput" class="card soft" style="margin-top:12px" hidden></div>
    </div>
    <div class="card warning"><h2>BUDI95</h2><p class="small">Baki atau kuota rasmi memerlukan integrasi rasmi. Prototaip ini tidak memaparkan baki sebenar.</p>${truth({source:'Pemilik sistem berkaitan',type:'Masa hadapan',updated:'Tertakluk API rasmi',unknown:'Kelayakan dan baki individu'})}</div>
  </section>`;
}
function viewAssist(){
  return `<section class="stack"><div class="hero"><p class="eyebrow">Bantuan</p><h1>Pilih bantuan, lihat checklist, kemudian semak rasmi.</h1></div><div class="stack">${assistanceCards(assistance)}</div></section>`;
}
function genericSupport(title, lead, note){
  return `<section class="stack"><div class="hero"><p class="eyebrow">${escapeHtml(title)}</p><h1>Mulakan dengan dokumen dan saluran rasmi.</h1><p class="lead">${escapeHtml(lead)}</p></div><div class="card soft"><h2>Checklist</h2>${checklist(['Dokumen pengenalan','Maklumat isi rumah jika berkaitan','Dokumen sokongan yang mudah dicari','Catat soalan sebelum menghubungi agensi'])}<p class="small">${escapeHtml(note)}</p><div class="grid-2" style="margin-top:12px">${secondary('Katalog bantuan', 'data-tabgo="help"')}${secondary('Talian Kasih', `data-open="${OFFICIAL.taliankasih}"`)}</div></div></section>`;
}
function viewUrgent(){
  return `<section class="stack"><div class="hero"><p class="eyebrow">Bantuan segera</p><h1>Jika keselamatan terancam, hubungi bantuan sekarang.</h1><p class="lead">Laluan ini tidak perlukan log masuk.</p></div><div class="card danger"><h2>Kecemasan</h2><p>Untuk kecemasan keselamatan, hubungi 999.</p><a class="primary-btn" href="tel:999">Hubungi 999</a></div><div class="card soft"><h2>Talian Kasih</h2><p>Pertanyaan, aduan, perlindungan atau sokongan kebajikan.</p><div class="grid-2"><a class="secondary-btn" href="tel:15999">15999</a><button class="secondary-btn" data-open="${OFFICIAL.whatsappKasih}">WhatsApp</button></div></div></section>`;
}
function viewMyID(){
  return `<section class="stack"><div class="hero"><p class="eyebrow">MyDigital ID</p><h1>Simulasi pengesahan identiti.</h1><p class="lead">TenangKITA tidak menerima kata laluan atau biometrik anda.</p></div><div class="card"><h2>Aliran ringkas</h2>${checklist(['Buka aplikasi MyDigital ID','Sahkan di aplikasi tersebut','Kembali ke TenangKITA','Pilih sumber yang anda izinkan'])}<div class="grid-2" style="margin-top:12px">${button('Simulasi berjaya', 'id="myidSuccess"')}${secondary('Batal', 'id="myidCancel"')}</div></div><div class="card"><h2>Tiada aplikasi?</h2><p class="small">Gunakan saluran rasmi, kiosk atau bantuan manusia. Anda masih boleh guna maklumat umum tanpa log masuk.</p>${secondary('Bantuan MyDigital ID', `data-open="${OFFICIAL.mydigitalid}"`)}</div></section>`;
}
function viewData(){
  return `<section class="stack"><div class="hero"><p class="eyebrow">Amanah Data</p><h1>Fakta mesti jelas sumbernya.</h1><p class="lead optional-copy">OpenDOSM digunakan untuk konteks awam, bukan untuk menilai keluarga anda.</p></div>${viewOpenDOSMCard()}<div class="card"><h2>Sumber disahkan</h2><div class="stack">${resources.map(r=>`<button type="button" class="action-row" data-open="${escapeHtml(r.url)}"><span><strong>${escapeHtml(r.title)}</strong><span>${escapeHtml(r.owner)} · ${escapeHtml(r.status)}</span></span><span class="chev">↗</span></button>`).join('')}</div></div><details class="accordion"><summary>Apa TenangKITA tidak tahu?</summary><div class="inside"><p>Kelayakan rasmi, baki bantuan, transaksi dan profil PADU tidak diketahui tanpa izin pengguna dan API rasmi.</p></div></details></section>`;
}
function viewOpenDOSMCard(){
  const data = state.opendosm;
  const err = state.opendosmError;
  const result = data ? `<div class="card success"><h2>OpenDOSM berjaya diuji</h2><p class="small">Dataset: <strong>cpi_core</strong></p><pre style="white-space:pre-wrap;font-size:.78rem;background:#fff;border:1px solid var(--line);border-radius:16px;padding:10px;overflow:auto">${escapeHtml(JSON.stringify(data.sample,null,2))}</pre><p class="tiny">Retrieved: ${escapeHtml(data.retrievedAt)}</p></div>` : '';
  const error = err ? `<div class="card warning"><h2>API belum dapat dicapai</h2><p class="small">${escapeHtml(err)}</p><p class="tiny">Paparan ini kekal selamat kerana tiada data palsu dipaparkan.</p></div>` : '';
  return `<div class="card soft"><div class="row"><div><h2>OpenDOSM micro-test</h2><p class="small">Uji sambungan awam menggunakan dataset <strong>cpi_core</strong>.</p></div><span class="badge blue">v0.8</span></div>${truth({source:'OpenDOSM API',type:'Data rasmi awam',updated:data?data.retrievedAt:'Belum diuji',unknown:'Kesan peribadi keluarga'})}<div class="grid-2" style="margin-top:12px">${button('Uji OpenDOSM', 'id="opendosmBtn"')}${secondary('Dokumentasi', `data-open="${OFFICIAL.opendosmDocs}"`)}</div></div>${result}${error}`;
}
function viewPrototype(){
  return `<section class="stack"><div class="hero"><p class="eyebrow">Status prototaip</p><h1>GitHub sahaja buat masa ini.</h1><p class="lead">Tiada database, tiada backend dan tiada data peribadi rakyat.</p></div><div class="card"><h2>Current state</h2>${checklist(['Static HTML / CSS / JavaScript','Static catalogue dan pautan rasmi','localStorage untuk pilihan paparan sahaja','OpenDOSM micro-test awam'])}</div><div class="card"><h2>Future state selepas persetujuan</h2>${checklist(['AWS/cloud POC','API gateway dan adapter data','Consent management dan audit log','Integrasi rasmi PADU, SARA, STR, BUDI95 tertakluk kelulusan'])}</div></section>`;
}

function bindCommon(){
  document.querySelectorAll('[data-concern]').forEach(b=>b.addEventListener('click',()=>{ state.concern=b.dataset.concern; saveState(); render(); }));
  document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.go)));
  document.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>openOfficial(b.dataset.open)));
  document.querySelectorAll('[data-toggle]').forEach(i=>i.addEventListener('change',()=>{ state[i.dataset.toggle]=i.checked; saveState(); render(); }));
  document.querySelectorAll('[data-consent]').forEach(i=>i.addEventListener('change',()=>{ state.consent[i.dataset.consent]=i.checked; saveState(); toast(i.checked?'Izin demo disambungkan.':'Izin demo diputuskan.'); render(); }));
  document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{ const f=b.dataset.filter; const list=f==='Semua'?assistance:assistance.filter(x=>x.category===f); $('#assistanceList').innerHTML=assistanceCards(list); bindCommon(); }));
  document.querySelectorAll('[data-tabgo]').forEach(b=>b.addEventListener('click',()=>setTab(b.dataset.tabgo)));
  const clear=$('#clearBtn'); if(clear) clear.addEventListener('click',()=>{ localStorage.removeItem(STORAGE_KEY); state={...defaultState}; toast('Data tempatan dipadam.'); render(); });
  const speak=$('#speakBtn'); if(speak) speak.addEventListener('click',speakSummary);
}
function bindView(view){ bindCommon(); if(view==='travel') bindCalc(); if(view==='myid') bindMyID(); if(view==='data') bindOpenDOSM(); }
function bindCalc(){ const btn=$('#calcBtn'); if(!btn) return; btn.addEventListener('click',()=>{ const km=parseFloat($('#km').value); const eff=parseFloat($('#eff').value); const price=parseFloat($('#price').value); const out=$('#calcOutput'); if(!km||!eff||!price){ toast('Masukkan jarak, penggunaan petrol dan harga semasa.'); return; } const litres=km*eff/100; const cost=litres*price; out.hidden=false; out.innerHTML=`<p class="tiny">Anggaran tempatan</p><div class="calc-result">RM ${cost.toFixed(2)}</div><p class="small">${litres.toFixed(2)} liter untuk ${km.toFixed(1)} km. Ini bukan baki atau kelayakan subsidi rasmi.</p>`; }); }
function bindMyID(){ $('#myidSuccess')?.addEventListener('click',()=>{ state.verified=true; saveState(); toast('Simulasi MyDigital ID berjaya.'); setTab('me'); }); $('#myidCancel')?.addEventListener('click',()=>{ toast('Pengesahan dibatalkan. Anda masih boleh guna maklumat umum.'); back(); }); }
function bindOpenDOSM(){ const btn=$('#opendosmBtn'); if(!btn) return; btn.addEventListener('click', async ()=>{ btn.disabled=true; btn.textContent='Menguji...'; state.opendosmError=null; saveState(); try{ const res=await fetch(OFFICIAL.opendosmApi, {headers:{'accept':'application/json'}}); if(!res.ok) throw new Error(`Status ${res.status}`); const json=await res.json(); const sample = Array.isArray(json) ? json.slice(0,3) : (json.data ? json.data.slice?.(0,3) || json.data : json); state.opendosm={sample, retrievedAt:new Date().toLocaleString('ms-MY')}; state.opendosmError=null; toast('OpenDOSM berjaya diuji.'); }catch(e){ state.opendosm=null; state.opendosmError='Sambungan gagal atau disekat pelayar. Cuba semula kemudian atau buka dokumentasi rasmi.'; toast('OpenDOSM belum dapat dicapai.'); } finally{ saveState(); render(); } }); }
function speakSummary(){ const text='NewTenangKITA membantu anda faham, semak dan bertindak. Pilih satu kebimbangan, lihat checklist, kemudian gunakan saluran rasmi atau bantuan manusia.'; if(!('speechSynthesis' in window)){ toast('Fungsi baca tidak disokong peranti ini.'); return; } speechSynthesis.cancel(); speechSynthesis.speak(new SpeechSynthesisUtterance(text)); }

$('#backBtn').addEventListener('click', back);
$('#easyBtn').addEventListener('click',()=>{ state.simple=!state.simple; saveState(); render(); });
document.querySelectorAll('.nav-item').forEach(b=>b.addEventListener('click',()=>setTab(b.dataset.tab)));
window.addEventListener('popstate',()=>{ if(state.view) back(); });
render();
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  });
}
