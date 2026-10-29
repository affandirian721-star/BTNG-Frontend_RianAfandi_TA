/**
 * FANBIL SHOWW - Script Utama
 * Tugas Akhir BTNG Kelas Frontend
 * Mengambil data mobil dari API resmi, mengolah respons, dan melakukan manipulasi DOM secara dinamis.
 */

// Endpoint API resmi panitia BTNG
const API_URL = "https://api-web.dnccudinus.org/api/mobil";

// Gambar fallback jika foto API gagal dimuat
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80";

// Global state aplikasi
const appState = {
  cars: [],
  filteredCars: [],
  selectedCar: null,
  isLoading: true,
  error: null,
};

/**
 * Format angka ke format mata uang Rupiah Indonesia (IDR)
 * Contoh: 719000000 -> Rp 719.000.000
 */
function formatRupiah(amount) {
  if (isNaN(amount)) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Mengambil nilai unik dari kumpulan data mobil berdasarkan atribut tertentu
 */
function getUniqueValues(cars, key) {
  const values = cars.map((car) => car[key]).filter(Boolean);
  return [...new Set(values)].sort();
}

/**
 * Menampilkan skeleton loading animasi shimmer menggunakan Tailwind CSS
 */
function renderSkeletons(container, count = 6) {
  if (!container) return;
  container.innerHTML = "";

  for (let i = 0; i < count; i++) {
    const skeleton = document.createElement("div");
    skeleton.className =
      "bg-slate-900/80 rounded-2xl border border-slate-800/80 overflow-hidden shadow-lg animate-pulse flex flex-col";
    skeleton.innerHTML = `
      <div class="h-48 sm:h-52 bg-slate-800/80 w-full"></div>
      <div class="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div class="space-y-2">
          <div class="flex justify-between items-center">
            <div class="h-4 bg-slate-800 rounded w-1/4"></div>
            <div class="h-5 bg-slate-800 rounded-full w-20"></div>
          </div>
          <div class="h-6 bg-slate-800 rounded w-3/4"></div>
        </div>
        <div class="flex gap-2">
          <div class="h-6 bg-slate-800 rounded-md w-16"></div>
          <div class="h-6 bg-slate-800 rounded-md w-20"></div>
          <div class="h-6 bg-slate-800 rounded-md w-16"></div>
        </div>
        <div class="pt-3 border-t border-slate-800/80 flex items-center justify-between">
          <div class="h-6 bg-slate-800 rounded w-1/3"></div>
          <div class="h-9 bg-slate-800 rounded-xl w-28"></div>
        </div>
      </div>
    `;
    container.appendChild(skeleton);
  }
}

/**
 * Menampilkan pesan status (Error / Kosong)
 */
function renderMessage(container, message, isError = false) {
  if (!container) return;
  container.innerHTML = "";

  const box = document.createElement("div");
  box.className =
    "col-span-full py-16 px-6 text-center bg-slate-900/60 rounded-2xl border border-slate-800 backdrop-blur-sm";

  const iconSvg = isError
    ? `<svg class="w-12 h-12 mx-auto text-rose-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
       </svg>`
    : `<svg class="w-12 h-12 mx-auto text-amber-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
       </svg>`;

  box.innerHTML = `
    ${iconSvg}
    <h3 class="text-lg font-semibold text-white mb-2">${isError ? "Terjadi Kendala Memuat Data" : "Unit Tidak Ditemukan"}</h3>
    <p class="text-slate-400 text-sm max-w-md mx-auto mb-6">${message}</p>
    ${isError
      ? `<button onclick="loadCarsData()" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm transition-all duration-200 shadow-lg shadow-amber-500/20 active:scale-95">
             <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
             Coba Muat Ulang
           </button>`
      : `<button onclick="resetFilters()" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm transition-all border border-slate-700">
             Reset Semua Filter
           </button>`
    }
  `;
  container.appendChild(box);
}

/**
 * Membuat kartu mobil menggunakan DOM Manipulation (createElement + dataset + innerHTML)
 */
function createCarCard(car) {
  const card = document.createElement("article");
  card.className =
    "group relative bg-slate-900/90 rounded-2xl border border-slate-800/90 overflow-hidden shadow-xl hover:border-amber-500/40 hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-300 flex flex-col justify-between";

  const isAvailable = car.status?.toLowerCase() === "tersedia";
  const statusBadge = isAvailable
    ? `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 backdrop-blur-md">
         <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
         Tersedia
       </span>`
    : `<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 backdrop-blur-md">
         Terjual (Sold)
       </span>`;

  card.innerHTML = `
    <!-- Bagian Visual & Badge -->
    <div class="relative h-52 sm:h-56 overflow-hidden bg-slate-950">
      <img
        src="${car.foto || FALLBACK_IMAGE}"
        alt="${car.nama}"
        loading="lazy"
        onerror="this.onerror=null;this.src='${FALLBACK_IMAGE}';"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
      <div class="absolute top-3 left-3">
        <span class="px-2.5 py-1 rounded-lg text-xs font-bold tracking-wider uppercase bg-slate-900/80 text-amber-400 border border-slate-700/80 backdrop-blur-md">
          ${car.brand}
        </span>
      </div>
      <div class="absolute top-3 right-3">
        ${statusBadge}
      </div>
      <div class="absolute bottom-3 left-3 text-xs text-slate-400 font-medium">
        Tahun ${car.tahun}
      </div>
    </div>

    <!-- Konten Informasi Mobil -->
    <div class="p-5 flex-1 flex flex-col justify-between space-y-4">
      <div>
        <h3 class="text-lg font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1 title-font">
          ${car.nama}
        </h3>
        <!-- Spesifikasi Ringkas -->
        <div class="flex flex-wrap gap-2 mt-3">
          <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700/60">
            <svg class="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>
            ${car.transmisi}
          </span>
          <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700/60">
            <svg class="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            ${car.bahan_bakar}
          </span>
        </div>
      </div>

      <!-- Harga & Tombol Aksi -->
      <div class="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
        <div>
          <span class="text-xs text-slate-400 block font-normal">Harga OTR</span>
          <span class="text-lg font-extrabold text-amber-400 tracking-tight">
            ${formatRupiah(car.harga)}
          </span>
        </div>
        <button
          type="button"
          class="btn-detail px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-white transition-all duration-200 border border-slate-700 hover:border-amber-500 active:scale-95 cursor-pointer"
        >
          Lihat Detail
        </button>
      </div>
    </div>
  `;

  // Event listener tombol detail untuk membuka modal
  const detailBtn = card.querySelector(".btn-detail");
  if (detailBtn) {
    detailBtn.addEventListener("click", () => openCarModal(car));
  }

  return card;
}

/**
 * Merender daftar mobil ke elemen target
 */
function renderCarCards(container, cars) {
  if (!container) return;
  container.innerHTML = "";

  if (!cars || cars.length === 0) {
    renderMessage(
      container,
      "Tidak ada unit mobil yang sesuai dengan kriteria pencarian atau filter Anda."
    );
    return;
  }

  const fragment = document.createDocumentFragment();
  cars.forEach((car) => {
    fragment.appendChild(createCarCard(car));
  });
  container.appendChild(fragment);
}

/**
 * Membuka Modal dialog detail mobil
 */
function openCarModal(car) {
  appState.selectedCar = car;
  const modal = document.getElementById("car-modal");
  const modalContent = document.getElementById("modal-detail-content");
  if (!modal || !modalContent) return;

  const isAvailable = car.status?.toLowerCase() === "tersedia";
  const dpEstimate = formatRupiah(Math.round(car.harga * 0.2));
  const waMessage = encodeURIComponent(
    `Halo FANBIL SHOWW, saya tertarik dengan unit *${car.nama}* (${car.brand} - Tahun ${car.tahun}) seharga ${formatRupiah(car.harga)}. Apakah unit ini masih bisa saya jadwalkan untuk test drive / private viewing?`
  );

  modalContent.innerHTML = `
    <!-- Header Modal Gambar -->
    <div class="relative h-64 sm:h-80 bg-slate-950 overflow-hidden">
      <img
        src="${car.foto || FALLBACK_IMAGE}"
        alt="${car.nama}"
        onerror="this.onerror=null;this.src='${FALLBACK_IMAGE}';"
        class="w-full h-full object-cover"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
      
      <!-- Tombol Tutup -->
      <button
        onclick="closeCarModal()"
        aria-label="Tutup Detail"
        class="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center border border-slate-700 backdrop-blur-md transition-all cursor-pointer"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>

      <div class="absolute bottom-4 left-6 right-6">
        <div class="flex items-center gap-2 mb-2">
          <span class="px-2.5 py-0.5 rounded text-xs font-bold tracking-wider uppercase bg-amber-500 text-slate-950">
            ${car.brand}
          </span>
          <span class="px-2.5 py-0.5 rounded text-xs font-semibold ${isAvailable ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
    }">
            ${isAvailable ? "Unit Tersedia di Showroom" : "Sudah Terjual"}
          </span>
        </div>
        <h2 id="modal-title" class="text-2xl sm:text-3xl font-extrabold text-white">
          ${car.nama}
        </h2>
      </div>
    </div>

    <!-- Badan Modal -->
    <div class="p-6 sm:p-8 space-y-6">
      <!-- Info Harga & Estimasi Cicilan -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800">
        <div>
          <span class="text-xs uppercase tracking-wider text-slate-400 block font-medium">Harga Cash OTR</span>
          <span class="text-2xl sm:text-3xl font-extrabold text-amber-400">${formatRupiah(car.harga)}</span>
        </div>
        <div class="sm:border-l sm:border-slate-800 sm:pl-4">
          <span class="text-xs uppercase tracking-wider text-slate-400 block font-medium">Estimasi DP 20%</span>
          <span class="text-lg font-bold text-slate-200">${dpEstimate}</span>
          <span class="text-xs text-slate-500 block">Simulasi tenor hingga 5 tahun</span>
        </div>
      </div>

      <!-- Tabel Spesifikasi Detail -->
      <div>
        <h4 class="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">Spesifikasi Kendaraan</h4>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800">
            <span class="text-xs text-slate-500 block">Tahun Rilis</span>
            <span class="text-sm font-bold text-white">${car.tahun}</span>
          </div>
          <div class="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800">
            <span class="text-xs text-slate-500 block">Transmisi</span>
            <span class="text-sm font-bold text-white">${car.transmisi}</span>
          </div>
          <div class="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800">
            <span class="text-xs text-slate-500 block">Bahan Bakar</span>
            <span class="text-sm font-bold text-white">${car.bahan_bakar}</span>
          </div>
          <div class="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800">
            <span class="text-xs text-slate-500 block">ID Unit API</span>
            <span class="text-sm font-bold text-white">#${car.id}</span>
          </div>
        </div>
      </div>

      <!-- Jaminan FANBIL SHOWW -->
      <div class="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/40 text-xs sm:text-sm text-emerald-300 flex items-start gap-3">
        <svg class="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
        <div>
          <strong class="font-semibold block text-emerald-200">Garansi & Inspeksi 160 Titik</strong>
          Lolos uji bebas banjir, bebas tabrakan fatal, odometer asli, serta kelengkapan dokumen resmi BPKB & STNK.
        </div>
      </div>

      <!-- Tombol Aksi Hubungi / Booking -->
      <div class="pt-3 flex flex-col sm:flex-row gap-3">
        <a
          href="https://api.whatsapp.com/send?phone=6281234567890&text=${waMessage}"
          target="_blank"
          rel="noopener noreferrer"
          class="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/></svg>
          Hubungi Sales via WhatsApp
        </a>
        <a
          href="kontak.html?unit=${encodeURIComponent(car.nama)}"
          class="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm border border-slate-700 transition-all active:scale-95"
        >
          Jadwalkan Test Drive
        </a>
      </div>
    </div>
  `;

  modal.classList.remove("hidden");
  modal.classList.add("flex");
  document.body.classList.add("overflow-hidden");
}

/**
 * Menutup Modal dialog
 */
function closeCarModal() {
  const modal = document.getElementById("car-modal");
  if (!modal) return;
  modal.classList.add("hidden");
  modal.classList.remove("flex");
  document.body.classList.remove("overflow-hidden");
}

/**
 * Mengisi pilihan dropdown secara dinamis dari data mobil API
 */
function populateSelect(selectElement, items, defaultLabel = "Semua") {
  if (!selectElement) return;
  selectElement.innerHTML = `<option value="">${defaultLabel}</option>`;
  items.forEach((item) => {
    const opt = document.createElement("option");
    opt.value = item;
    opt.textContent = item;
    selectElement.appendChild(opt);
  });
}

/**
 * Filter dan sortir data mobil di halaman katalog
 */
function applyCatalogFilters() {
  const searchInput = document.getElementById("search-input");
  const filterBrand = document.getElementById("filter-brand");
  const filterTransmisi = document.getElementById("filter-transmisi");
  const filterFuel = document.getElementById("filter-fuel");
  const filterStatus = document.getElementById("filter-status");
  const sortBy = document.getElementById("sort-by");
  const resultCount = document.getElementById("result-count");
  const catalogGrid = document.getElementById("catalog-grid");

  const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
  const brand = filterBrand ? filterBrand.value : "";
  const transmisi = filterTransmisi ? filterTransmisi.value : "";
  const fuel = filterFuel ? filterFuel.value : "";
  const status = filterStatus ? filterStatus.value : "";
  const sort = sortBy ? sortBy.value : "newest";

  let filtered = appState.cars.filter((car) => {
    const carText = `${car.nama} ${car.brand} ${car.tahun}`.toLowerCase();
    const matchQuery = !query || carText.includes(query);
    const matchBrand = !brand || car.brand === brand;
    const matchTransmisi = !transmisi || car.transmisi === transmisi;
    const matchFuel = !fuel || car.bahan_bakar === fuel;
    const matchStatus = !status || car.status === status;
    return matchQuery && matchBrand && matchTransmisi && matchFuel && matchStatus;
  });

  // Sortir data
  if (sort === "price-asc") {
    filtered.sort((a, b) => a.harga - b.harga);
  } else if (sort === "price-desc") {
    filtered.sort((a, b) => b.harga - a.harga);
  } else if (sort === "name") {
    filtered.sort((a, b) => a.nama.localeCompare(b.nama, "id"));
  } else if (sort === "year-desc") {
    filtered.sort((a, b) => b.tahun - a.tahun);
  } else {
    // default newest by id / tahun
    filtered.sort((a, b) => b.tahun - a.tahun || b.id - a.id);
  }

  appState.filteredCars = filtered;

  if (resultCount) {
    resultCount.textContent = `Menampilkan ${filtered.length} dari ${appState.cars.length} unit mobil`;
  }

  renderCarCards(catalogGrid, filtered);
}

/**
 * Reset filter katalog ke default
 */
function resetFilters() {
  const form = document.getElementById("filter-form");
  if (form) form.reset();
  applyCatalogFilters();
}

/**
 * Inisialisasi halaman Beranda (index.html)
 */
function initHomePage(cars) {
  const featuredGrid = document.getElementById("featured-grid");
  const brandPills = document.getElementById("brand-pills");
  const statTotal = document.getElementById("stat-total");
  const statReady = document.getElementById("stat-ready");
  const statBrands = document.getElementById("stat-brands");

  const brands = getUniqueValues(cars, "brand");
  const readyUnits = cars.filter((c) => c.status?.toLowerCase() === "tersedia");

  if (statTotal) statTotal.textContent = cars.length;
  if (statReady) statReady.textContent = readyUnits.length;
  if (statBrands) statBrands.textContent = `${brands.length}+`;

  // Render pills merek di section Merek
  if (brandPills) {
    brandPills.innerHTML = "";
    brands.forEach((brand) => {
      const a = document.createElement("a");
      a.href = `katalog.html?brand=${encodeURIComponent(brand)}`;
      a.className =
        "px-4 py-2 rounded-xl bg-slate-900/90 hover:bg-amber-500 hover:text-slate-950 text-slate-300 font-medium text-xs sm:text-sm border border-slate-800 hover:border-amber-500 transition-all duration-200 shadow-md backdrop-blur-sm";
      a.textContent = brand;
      brandPills.appendChild(a);
    });
  }

  // Tampilkan 6 mobil unggulan yang tersedia
  if (featuredGrid) {
    const featured = readyUnits.slice(0, 6);
    renderCarCards(featuredGrid, featured.length > 0 ? featured : cars.slice(0, 6));
  }
}

/**
 * Inisialisasi halaman Katalog (katalog.html)
 */
function initCatalogPage(cars) {
  const catalogGrid = document.getElementById("catalog-grid");
  const filterForm = document.getElementById("filter-form");
  if (!catalogGrid || !filterForm) return;

  const brands = getUniqueValues(cars, "brand");
  const transmissions = getUniqueValues(cars, "transmisi");
  const fuels = getUniqueValues(cars, "bahan_bakar");

  populateSelect(document.getElementById("filter-brand"), brands, "Semua Merek");
  populateSelect(document.getElementById("filter-transmisi"), transmissions, "Semua Transmisi");
  populateSelect(document.getElementById("filter-fuel"), fuels, "Semua Bahan Bakar");

  // Periksa apakah ada parameter URL (misal: ?brand=Toyota)
  const urlParams = new URLSearchParams(window.location.search);
  const brandParam = urlParams.get("brand");
  if (brandParam) {
    const brandSelect = document.getElementById("filter-brand");
    if (brandSelect) brandSelect.value = brandParam;
  }

  // Event listener filter dan live search
  filterForm.addEventListener("input", applyCatalogFilters);
  filterForm.addEventListener("change", applyCatalogFilters);

  const resetBtn = document.getElementById("btn-reset-filter");
  if (resetBtn) {
    resetBtn.addEventListener("click", resetFilters);
  }

  applyCatalogFilters();
}

/**
 * Inisialisasi halaman Kontak & Form Booking
 */
function initContactPage() {
  const form = document.getElementById("visit-form");
  const alertBox = document.getElementById("contact-alert");
  const unitInput = document.getElementById("unit-interest");

  // Jika ada query param unit (misal diarahkan dari modal detail mobil)
  const urlParams = new URLSearchParams(window.location.search);
  const requestedUnit = urlParams.get("unit");
  if (requestedUnit && unitInput) {
    unitInput.value = requestedUnit;
  }

  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (alertBox) {
      alertBox.classList.remove("hidden");
      alertBox.innerHTML = `
        <div class="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm">
          <svg class="w-5 h-5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
          <span><strong>Permintaan Terkirim!</strong> Tim floor FANBIL SHOWW akan segera menghubungi Anda untuk konfirmasi jadwal kunjungan.</span>
        </div>
      `;
    }
    form.reset();
  });
}

/**
 * Setup Navigasi Mobile Hamburger Menu
 */
function setupMobileNav() {
  const toggleBtn = document.getElementById("mobile-menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");
  if (!toggleBtn || !mobileMenu) return;

  toggleBtn.addEventListener("click", () => {
    const isHidden = mobileMenu.classList.toggle("hidden");
    toggleBtn.setAttribute("aria-expanded", String(!isHidden));
  });
}

/**
 * Setup Event Listener Modal Backdrop & Escape Key
 */
function setupModalListeners() {
  const modal = document.getElementById("car-modal");
  if (!modal) return;

  // Tutup jika backdrop diklik
  modal.addEventListener("click", (e) => {
    if (e.target === modal || e.target.hasAttribute("data-close-modal")) {
      closeCarModal();
    }
  });

  // Tutup jika tombol ESC ditekan
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeCarModal();
    }
  });
}

/**
 * Fungsi utama untuk mengambil data mobil dari API resmi panitia menggunakan fetch()
 */
async function loadCarsData() {
  const featuredGrid = document.getElementById("featured-grid");
  const catalogGrid = document.getElementById("catalog-grid");
  const targetGrid = featuredGrid || catalogGrid;

  if (targetGrid) {
    renderSkeletons(targetGrid, featuredGrid ? 6 : 8);
  }

  try {
    appState.isLoading = true;
    appState.error = null;

    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    if (!result.success || !Array.isArray(result.data)) {
      throw new Error(result.message || "Struktur data respons API tidak sesuai.");
    }

    appState.cars = result.data;
    appState.filteredCars = result.data;
    appState.isLoading = false;

    // Render ke halaman yang sesuai
    initHomePage(appState.cars);
    initCatalogPage(appState.cars);
  } catch (err) {
    console.error("Gagal memuat API:", err);
    appState.error = err.message;
    appState.isLoading = false;

    if (targetGrid) {
      renderMessage(
        targetGrid,
        `Tidak dapat mengambil data dari endpoint ${API_URL}. Pastikan koneksi internet terhubung dan coba lagi. (${err.message})`,
        true
      );
    }
  }
}

/**
 * Inisialisasi keseluruhan aplikasi saat DOM selesai dimuat
 */
document.addEventListener("DOMContentLoaded", () => {
  setupMobileNav();
  setupModalListeners();
  initContactPage();
  loadCarsData();
});
