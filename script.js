/* Mengatur tampilan, pencarian, menu kategori, dan keranjang. Biasanya tidak perlu diubah. */
const $ = id => document.getElementById(id);
const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
const set = (id, t) => { const e = $(id); if (e) e.textContent = t || ""; };
const rp = n => "Rp" + Number(n || 0).toLocaleString("id-ID");
const wa = teks => "https://wa.me/" + String(TOKO.whatsapp).replace(/\D/g, "") + "?text=" + encodeURIComponent(teks);
const halaman = document.body.dataset.halaman;
const params = new URLSearchParams(location.search);
let aktif = params.get("kategori") || "Semua";
let kata = (params.get("q") || "").trim().toLowerCase();
const pembeli = { nama: "", alamat: "", catatan: "" };

const svg = d => '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>';
const IKON = {
  cari: svg('<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>'),
  wa: svg('<path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.7-5.2A8.5 8.5 0 1 1 21 12z"/>'),
  cart: svg('<path d="M3 4h2l2.4 10.2a1 1 0 0 0 1 .8h8.8a1 1 0 0 0 1-.8L20 8H6"/><circle cx="9" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/>'),
  menu: svg('<path d="M4 6h16M4 12h16M4 18h16"/>'),
  tutup: svg('<path d="M6 6l12 12M18 6L6 18"/>')
};

function sepatu(warna) {
  return '<svg viewBox="0 0 200 130" aria-hidden="true"><path d="M14 92c0-8 4-14 10-18l22-14c6-4 10-12 10-20V30c0-5 6-8 10-5l30 26c4 4 10 6 16 6h32c20 0 40 14 40 32v8c0 4-3 7-7 7H21c-4 0-7-3-7-7z" fill="' + warna + '"/><path d="M14 99h172v8c0 3-3 6-6 6H20c-3 0-6-3-6-6z" fill="rgba(0,0,0,.25)"/><path d="M60 38l26 22" stroke="rgba(255,255,255,.7)" stroke-width="4" stroke-linecap="round" fill="none"/></svg>';
}

/* ---------- Keranjang (tersimpan di browser pembeli) ---------- */
const KEY = "toko-keranjang-v1";
let keranjang = [];
try { keranjang = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { keranjang = []; }
if (!Array.isArray(keranjang)) keranjang = [];
const simpanK = () => { try { localStorage.setItem(KEY, JSON.stringify(keranjang)); } catch (e) {} };
const cariProduk = nama => PRODUK.find(p => p.nama === nama);

function tambah(p, warna, ukuran) {
  const i = keranjang.find(x => x.nama === p.nama && x.warna === warna && x.ukuran === ukuran);
  if (i) i.qty++; else keranjang.push({ nama: p.nama, warna, ukuran, qty: 1 });
  simpanK(); renderKeranjang(); bukaPanel("Cart");
}

function renderKeranjang() {
  keranjang = keranjang.filter(i => cariProduk(i.nama));
  const list = $("daftarCart"); if (!list) return;
  list.innerHTML = "";
  let total = 0, jumlah = 0;
  keranjang.forEach(i => {
    const p = cariProduk(i.nama), v = (p.varian || []).find(x => x.nama === i.warna);
    total += p.harga * i.qty; jumlah += i.qty;
    const row = el("div", "ci"), th = el("div", "mini");
    const warna = (v && v.warna) || p.warna || "#e8b4c8", src = (v && v.foto) || p.foto;
    th.style.background = warna + "55";
    if (src) { const im = document.createElement("img"); im.alt = ""; im.onerror = () => im.remove(); im.src = src; th.appendChild(im); }
    const mid = el("div");
    mid.append(el("div", "ci-nama", p.nama), el("div", "ci-det", [i.warna, "ukuran " + i.ukuran].filter(Boolean).join(" · ")), el("div", "ci-harga", rp(p.harga)));
    const sisi = el("div", "ci-sisi"), q = el("div", "qty");
    const kurang = el("button", "", "−"), tmb = el("button", "", "+");
    kurang.type = tmb.type = "button";
    kurang.setAttribute("aria-label", "Kurangi " + p.nama); tmb.setAttribute("aria-label", "Tambah " + p.nama);
    kurang.onclick = () => { i.qty--; if (i.qty < 1) keranjang.splice(keranjang.indexOf(i), 1); simpanK(); renderKeranjang(); };
    tmb.onclick = () => { i.qty++; simpanK(); renderKeranjang(); };
    q.append(kurang, el("span", "", String(i.qty)), tmb);
    const hapus = el("button", "link", "Hapus"); hapus.type = "button";
    hapus.onclick = () => { keranjang.splice(keranjang.indexOf(i), 1); simpanK(); renderKeranjang(); };
    sisi.append(q, hapus);
    row.append(th, mid, sisi); list.appendChild(row);
  });
  if (!keranjang.length) list.appendChild(el("p", "kosong", "Keranjang masih kosong. Pilih sepatu lalu tekan “+ Keranjang”."));
  set("totalCart", rp(total));
  const b = $("badge"); b.textContent = jumlah; b.dataset.n = jumlah;
  $("btnCart").setAttribute("aria-label", "Keranjang, " + jumlah + " barang");
  const kirim = $("kirimWA");
  if (keranjang.length) {
    const baris = keranjang.map((i, k) => { const p = cariProduk(i.nama); return (k + 1) + ". " + p.nama + (i.warna ? " | warna " + i.warna : "") + " | ukuran " + i.ukuran + " | " + i.qty + " x " + rp(p.harga) + " = " + rp(p.harga * i.qty); });
    let teks = "Halo " + TOKO.nama + ", saya mau pesan:\n" + baris.join("\n") + "\nTotal: " + rp(total);
    if (pembeli.nama) teks += "\n\nNama: " + pembeli.nama;
    if (pembeli.alamat) teks += "\nAlamat: " + pembeli.alamat;
    if (pembeli.catatan) teks += "\nCatatan: " + pembeli.catatan;
    kirim.href = wa(teks); kirim.removeAttribute("aria-disabled");
  } else { kirim.href = "#"; kirim.setAttribute("aria-disabled", "true"); }
}

/* ---------- Header, menu 3 garis, panel keranjang ---------- */
let terbuka = null, fokusAwal = null;
function bukaPanel(nama) {
  tutupPanel(true);
  fokusAwal = document.activeElement; terbuka = nama;
  const p = $("panel" + nama); p.classList.add("buka"); $("overlay").hidden = false;
  p.querySelector(".tutup").focus();
}
function tutupPanel(diam) {
  if (!terbuka) return;
  $("panel" + terbuka).classList.remove("buka"); $("overlay").hidden = true; terbuka = null;
  if (!diam && fokusAwal && fokusAwal.focus) fokusAwal.focus();
}

function bangunHeader() {
  const kat = [...new Set(PRODUK.map(p => p.kategori).filter(Boolean))];
  $("hdr").innerHTML =
    '<header class="topbar"><div class="wrap bar">' +
    '<a class="logo-top" href="index.html"><img src="images/arabella.jpg" alt="Arabella"></a>' +
    '<nav class="topnav" aria-label="Menu utama"><a href="/">HOME</a><a href="produk.html" data-hal="produk">PRODUCT</a></nav>' +
    '<form class="cari" id="formCari" role="search"><input id="cari" type="search" placeholder="Cari sepatu..." aria-label="Cari sepatu" autocomplete="off"><button type="submit" aria-label="Cari">' + IKON.cari + '</button></form>' +
    '<div class="ikon">' +
    '<a class="ib" id="waTop" href="#" target="_blank" rel="noopener" aria-label="Chat WhatsApp">' + IKON.wa + '</a>' +
    '<button class="ib" id="btnCart" type="button" aria-label="Keranjang">' + IKON.cart + '<span class="badge" id="badge" data-n="0">0</span></button>' +
    '<button class="ib" id="btnMenu" type="button" aria-label="Menu kategori">' + IKON.menu + '</button>' +
    '</div></div><div class="wrap" id="pengumumanWrap"></div></header>' +
    '<div class="overlay" id="overlay" hidden></div>' +
    '<aside class="panel" id="panelMenu" aria-label="Menu kategori"><div class="panel-head"><h2>Menu</h2><button class="tutup" type="button" aria-label="Tutup menu">' + IKON.tutup + '</button></div><div class="panel-body"><div class="mlist" id="isiMenu"></div></div></aside>' +
    '<aside class="panel" id="panelCart" aria-label="Keranjang belanja"><div class="panel-head"><h2>Keranjang</h2><button class="tutup" type="button" aria-label="Tutup keranjang">' + IKON.tutup + '</button></div>' +
    '<div class="panel-body"><div id="daftarCart"></div>' +
    '<div class="fld"><label for="fNama">Nama penerima</label><input id="fNama" type="text" autocomplete="name">' +
    '<label for="fAlamat">Alamat pengiriman</label><textarea id="fAlamat" rows="2" autocomplete="street-address"></textarea>' +
    '<label for="fCatatan">Catatan untuk penjual (opsional)</label><input id="fCatatan" type="text"></div></div>' +
    '<div class="panel-foot"><div class="total"><span>Total</span><span id="totalCart">Rp0</span></div>' +
    '<a class="btn" id="kirimWA" href="#" target="_blank" rel="noopener" aria-disabled="true" style="text-align:center">Pesan lewat WhatsApp</a>' +
    '<p class="catatan-kecil">Pesanan dikirim ke WhatsApp toko untuk konfirmasi stok, ongkir, dan pembayaran.</p>' +
    '<button class="link" id="kosongkan" type="button">Kosongkan keranjang</button></div></aside>';

  const m = $("isiMenu");
  const tautan = (href, teks, jml) => { const a = el("a", "", teks); a.href = href; if (jml != null) a.appendChild(el("span", "", String(jml))); return a; };
  m.appendChild(tautan("index.html", "Home"));
  m.appendChild(tautan("produk.html", "Semua produk", PRODUK.length));
  m.appendChild(el("h3", "", "Kategori produk"));
  kat.forEach(k => m.appendChild(tautan("produk.html?kategori=" + encodeURIComponent(k), k, PRODUK.filter(p => p.kategori === k).length)));
  m.appendChild(el("h3", "", "Hubungi kami"));
  const w = tautan(wa("Halo " + TOKO.nama + ", saya mau tanya soal sepatu."), "Chat WhatsApp"); w.target = "_blank"; w.rel = "noopener"; m.appendChild(w);

  document.querySelectorAll(".topnav a").forEach(a => { if (a.dataset.hal === halaman) a.setAttribute("aria-current", "page"); });
  $("btnMenu").onclick = () => bukaPanel("Menu");
  $("btnCart").onclick = () => bukaPanel("Cart");
  document.querySelectorAll(".tutup").forEach(b => b.onclick = () => tutupPanel());
  $("overlay").onclick = () => tutupPanel();
  document.addEventListener("keydown", e => { if (e.key === "Escape") tutupPanel(); });
  $("kosongkan").onclick = () => { keranjang = []; simpanK(); renderKeranjang(); };
  [["fNama", "nama"], ["fAlamat", "alamat"], ["fCatatan", "catatan"]].forEach(([id, k]) => { $(id).addEventListener("input", e => { pembeli[k] = e.target.value.trim(); renderKeranjang(); }); });

  const cari = $("cari"); cari.value = params.get("q") || "";
  $("formCari").addEventListener("submit", e => {
    e.preventDefault();
    const q = cari.value.trim();
    if (halaman === "produk") { kata = q.toLowerCase(); tampilGrid(); }
    else location.href = "produk.html" + (q ? "?q=" + encodeURIComponent(q) : "");
  });
  if (halaman === "produk") cari.addEventListener("input", () => { kata = cari.value.trim().toLowerCase(); tampilGrid(); });

  if (TOKO.pengumuman) {
    const b = el("div", "info-bar"), x = el("button"); x.type = "button"; x.setAttribute("aria-label", "Tutup pengumuman"); x.innerHTML = IKON.tutup;
    x.onclick = () => b.remove();
    b.append(el("span", "", TOKO.pengumuman), x); $("pengumumanWrap").appendChild(b);
  }
}

/* ---------- Isi halaman ---------- */
function tampilToko() {
  set("nama", TOKO.nama); set("judul", TOKO.judul); set("sub", TOKO.sub);
  set("alamat", TOKO.alamat); set("jam", TOKO.jam);
  set("ig", "Instagram: " + TOKO.instagram);
  set("tiktok", TOKO.tiktok ? "TikTok: " + TOKO.tiktok : "");
  set("catatanToko", TOKO.catatan);
  document.title = halaman === "produk" ? "Product – " + TOKO.nama : TOKO.nama + " – Sepatu Wanita";
  const w = $("waTop"); if (w) w.href = wa("Halo " + TOKO.nama + ", saya mau tanya soal sepatu.");
  const ha = $("heroArt");
  if (ha) {
    if (TOKO.fotoUtama) {
      const im = document.createElement("img"); im.alt = TOKO.nama;
      im.onerror = () => { ha.classList.remove("ada-foto"); ha.innerHTML = sepatu("#fff"); };
      im.src = TOKO.fotoUtama; ha.classList.add("ada-foto"); ha.appendChild(im);
    } else ha.innerHTML = sepatu("#fff");
  }
  const ab = $("about");
  if (ab && TOKO.keunggulan) TOKO.keunggulan.forEach(k => { const d = el("div"); d.append(el("h3", "", k.judul), el("p", "", k.isi)); ab.appendChild(d); });
}

function kartu(p) {
  const c = el("article", "card");
  c.innerHTML = '<div class="thumb"></div><div class="info"><h3></h3><div class="price"></div><p class="desc"></p><p class="catatan"></p><div class="swatches"></div><div class="row"><select aria-label="Pilih ukuran"></select><button class="btn tambah" type="button">+ Keranjang</button></div><a class="btn alt wa-link" href="#" target="_blank" rel="noopener">Pesan via WhatsApp</a></div>';
  const th = c.querySelector(".thumb"), sw = c.querySelector(".swatches");
  const sel = c.querySelector("select"), a = c.querySelector(".wa-link");
  const varian = p.varian || [];
  let pilih = varian[0] || null;

  const ilustrasi = () => { const w = (pilih && pilih.warna) || p.warna || "#e8b4c8"; th.innerHTML = sepatu(w); th.style.background = w + "33"; };
  const foto = () => {
    th.innerHTML = ""; th.style.background = "";
    const src = (pilih && pilih.foto) || p.foto;
    if (src) { const im = document.createElement("img"); im.alt = p.nama + (pilih ? " " + pilih.nama : ""); im.onerror = ilustrasi; im.src = src; th.appendChild(im); }
    else ilustrasi();
  };
  const pesan = () => { a.href = wa("Halo " + TOKO.nama + ", saya mau pesan " + p.nama + (pilih ? " warna " + pilih.nama : "") + " ukuran " + (sel.value || "-") + " (" + rp(p.harga) + ")."); };

  c.querySelector("h3").textContent = p.nama;
  c.querySelector(".desc").textContent = p.deskripsi || "";
  const ct = c.querySelector(".catatan"), isiCt = p.catatan || p.note;
  if (isiCt) ct.textContent = "Catatan: " + isiCt; else ct.remove();
  const pr = c.querySelector(".price"); pr.textContent = rp(p.harga);
  if (p.hargaCoret > 0) pr.appendChild(el("span", "old", rp(p.hargaCoret)));
  (p.ukuran || []).forEach(u => { const o = el("option", "", String(u)); o.value = u; sel.appendChild(o); });

  if (varian.length) {
    const label = el("span", "warna-nama", pilih.nama);
    const tombol = varian.map(v => {
      const b = el("button", "sw"); b.type = "button"; b.style.background = v.warna; b.title = v.nama;
      b.setAttribute("aria-label", "Warna " + v.nama); b.setAttribute("aria-pressed", String(v === pilih));
      b.onclick = () => { pilih = v; label.textContent = v.nama; tombol.forEach(t => t.setAttribute("aria-pressed", String(t === b))); foto(); pesan(); };
      sw.appendChild(b); return b;
    });
    sw.appendChild(label);
  }
  c.querySelector(".tambah").onclick = () => tambah(p, pilih ? pilih.nama : "", sel.value || "-");
  sel.onchange = pesan; foto(); pesan();
  return c;
}

function isiGrid(g, daftar) { g.innerHTML = ""; daftar.forEach(p => g.appendChild(kartu(p))); }

function tampilFilter() {
  const f = $("filters"); if (!f) return;
  const kat = ["Semua", ...new Set(PRODUK.map(p => p.kategori).filter(Boolean))];
  if (!kat.includes(aktif)) aktif = "Semua";
  f.innerHTML = "";
  kat.forEach(k => {
    const b = el("button", "chip", k); b.type = "button"; b.setAttribute("aria-pressed", String(k === aktif));
    b.onclick = () => { aktif = k; tampilFilter(); tampilGrid(); };
    f.appendChild(b);
  });
}
function tampilGrid() {
  const g = $("grid"); if (!g) return;
  const daftar = PRODUK.filter(p => (aktif === "Semua" || p.kategori === aktif) && (!kata || (p.nama + " " + p.kategori + " " + (p.deskripsi || "")).toLowerCase().includes(kata)));
  isiGrid(g, daftar);
  set("infoCari", kata ? daftar.length + " hasil untuk “" + kata + "”" : "");
  if (!daftar.length) g.appendChild(el("p", "kosong", "Produk tidak ditemukan. Coba kata lain atau pilih kategori Semua."));
}
function tampilHome() {
  const g = $("gridHome"); if (!g) return;
  let pilihan = PRODUK.filter(p => p.unggulan);
  if (!pilihan.length) pilihan = PRODUK.slice(0, TOKO.jumlahHome || 4);
  isiGrid(g, pilihan);
}

bangunHeader(); tampilToko(); tampilFilter(); tampilGrid(); tampilHome(); renderKeranjang();
