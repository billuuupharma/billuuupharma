const ADMIN_PASSWORD = "BilalAnsariNaziyaSalmani";
let medicineData = []; let categories = []; let cart = []; let editId = null; let isAdmin = false; let selectedImages = []; let lastScrollPos = 0; let currentView = 'home'; let activeCategory = "";

const PLACEHOLDER_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='14' fill='%23f1f5f9'/%3E%3Cellipse cx='50' cy='45' rx='22' ry='10' fill='%23b2ebf2' transform='rotate(-35 50 45)'/%3E%3Cellipse cx='50' cy='45' rx='22' ry='10' fill='%23008296' opacity='.5' transform='rotate(-35 50 45)' clip-path='url(%23half)'/%3E%3CclipPath id='half'%3E%3Crect x='0' y='0' width='50' height='100'/%3E%3C/clipPath%3E%3Cellipse cx='50' cy='45' rx='22' ry='10' fill='none' stroke='%23008296' stroke-width='2.5' transform='rotate(-35 50 45)'/%3E%3Ctext x='50' y='82' text-anchor='middle' font-size='11' fill='%2394a3b8' font-family='Inter,sans-serif' font-weight='600'%3EMedicine%3C/text%3E%3C/svg%3E";

function openSidebar() { document.getElementById("mySidebar").style.width = "280px"; document.getElementById("sidebarOverlay").style.display = "block"; }
function closeSidebar() { document.getElementById("mySidebar").style.width = "0"; document.getElementById("sidebarOverlay").style.display = "none"; }

window.onload = () => {
    db.collection("medicines").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
        let snap = window.pageYOffset || document.documentElement.scrollTop;
        medicineData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderMedicines(medicineData);
        if(currentView === 'categories') renderCategoryMedicines();
        setTimeout(() => window.scrollTo(0, snap), 30);
    });
    db.collection("categories").onSnapshot((snapshot) => {
        categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        updateCategoryUI();
    });
    document.getElementById("imageFiles").addEventListener("change", function(){
        selectedImages = [];
        let prevRow = document.getElementById("imagePreviewRow");
        prevRow.innerHTML = '<span style="font-size:11px;color:#008296;font-weight:700;">⏳ Compressing photos...</span>';
        let files = Array.from(this.files);
        let readAndCompress = (file) => new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                let img = new Image();
                img.onload = () => {
                    let canvas = document.createElement('canvas');
                    let scale = Math.min(1, 900 / img.width);
                    canvas.width = img.width * scale;
                    canvas.height = img.height * scale;
                    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                    resolve(canvas.toDataURL('image/jpeg', 0.72));
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
        Promise.all(files.map(readAndCompress)).then(results => {
            selectedImages = results;
            prevRow.innerHTML = "";
            results.forEach(src => {
                let thumb = document.createElement("img");
                thumb.src = src;
                thumb.style.cssText = "width:50px;height:50px;object-fit:cover;border-radius:8px;border:2px solid #008296;";
                prevRow.appendChild(thumb);
            });
            let done = document.createElement("span");
            done.style.cssText = "font-size:11px;color:#198754;font-weight:700;display:block;margin-top:4px;";
            done.innerText = `✅ ${results.length} photo${results.length > 1 ? 's' : ''} ready — click Save`;
            prevRow.appendChild(done);
        });
    });
};

function switchView(view) {
    currentView = view;
    document.getElementById("search").value = "";
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.getElementById("homeContent").style.display = (view === 'home' || view === 'ethical') ? "block" : "none";
    document.getElementById("categoryContent").style.display = (view === 'categories') ? "block" : "none";
    if(view === 'home') document.getElementById('homeNav').classList.add('active');
    if(view === 'ethical') document.getElementById('ethicalNav').classList.add('active');
    if(view === 'categories') {
        document.getElementById('catNavBtn').classList.add('active');
        if(categories.length > 0 && !activeCategory) selectCategory(categories[0].name);
    }
    renderMedicines(medicineData); updateCartUI(); window.scrollTo(0, 0);
}

function selectCategory(catName) {
    activeCategory = catName;
    document.querySelectorAll('.cat-item').forEach(el => el.classList.remove('active'));
    let activeEl = document.getElementById(`cat-${catName}`);
    if(activeEl) activeEl.classList.add('active');
    document.getElementById("selectedCatTitle").innerText = catName;
    renderCategoryMedicines();
}

function renderCategoryMedicines() {
    let container = document.getElementById("catMedicineGrid");
    container.innerHTML = "";
    let filtered = medicineData.filter(m => m.category === activeCategory);
    if(filtered.length === 0) {
        container.innerHTML = buildEmptyStateHTML("", "No medicines in this category yet");
        return;
    }
    filtered.forEach(m => { container.innerHTML += createListCardHTML(m); });
}

function buildEmptyStateHTML(query, customMessage) {
    let queryLine = query
        ? `<p class="empty-state-query">No medicine found for "<strong>${query}</strong>"</p>`
        : `<p class="empty-state-query">${customMessage}</p>`;
    return `<div class="empty-state-wrap" style="grid-column: 1 / -1; width: 100%;"><div class="empty-pill-icon">💊</div><p class="empty-state-title">Medicine Not Found</p>${queryLine}<span class="empty-state-hint">🔍 Try searching by Brand, Salt or Company</span></div>`;
}

function createListCardHTML(m) {
    let isInCart = cart.find(item => item.id === m.id);
    let adminButtons = isAdmin ? `<div style="display:flex; gap:5px; margin-top:6px;"><button onclick="editMedicine('${m.id}')" style="flex:1; padding:5px; background:#fff; border:1px solid #ddd; border-radius:5px;">✏️</button><button onclick="deleteMedicine('${m.id}')" style="flex:1; padding:5px; background:#fff; color:red; border:1px solid #ddd; border-radius:5px;">🗑️</button></div>` : "";
    let thumbSrc = (m.images && m.images.length > 0) ? m.images[0] : (m.image || PLACEHOLDER_IMG);
    return `<div class="card list-card"><div class="list-card-body"><div class="list-card-left"><p class="list-card-name" onclick="viewDetails('${m.id}')">${m.brand}</p><img src="${thumbSrc}" class="list-card-img" onclick="viewDetails('${m.id}')" onerror="this.src='${PLACEHOLDER_IMG}'"></div><div class="list-card-actions"><button class="btn-details" onclick="viewDetails('${m.id}')">View Details</button>${isInCart ? `<button class="btn-cart-small" style="background:#dc3545;" onclick="removeFromCart('${m.id}')">Remove</button>` : `<button class="btn-cart-small" onclick="openQtyPopup('${m.id}')">Add to Cart</button>`}${adminButtons}</div></div></div>`;
}

function createCardHTML(m, type) {
    let isInCart = cart.find(item => item.id === m.id);
    let fillClass = type === 'recent' ? 'recent-fill' : (type === 'ethical' ? 'ethical-fill' : 'collection-fill');
    let adminButtons = isAdmin ? `<div style="display:flex; gap:5px; margin-top:8px;"><button onclick="editMedicine('${m.id}')" style="flex:1; padding:5px; background:#fff; border:1px solid #ddd; border-radius:5px;">✏️</button><button onclick="deleteMedicine('${m.id}')" style="flex:1; padding:6px; background:#fff; color:red; border:1px solid #ddd; border-radius:5px;">🗑️</button></div>` : "";
    let imgSrc = m.image || PLACEHOLDER_IMG;
    return `<div class="card ${fillClass}"><img src="${imgSrc}" class="medicineImage" onclick="viewDetails('${m.id}')" onerror="this.src='${PLACEHOLDER_IMG}'"><h2 onclick="viewDetails('${m.id}')">${m.brand}</h2><button class="btn-details" onclick="viewDetails('${m.id}')">View Details</button>${isInCart ? `<button class="btn-cart-small" style="background:#dc3545;" onclick="removeFromCart('${m.id}')">Remove</button>` : `<button class="btn-cart-small" onclick="openQtyPopup('${m.id}')">Add to Cart</button>`}${adminButtons}</div>`;
}

function renderMedicines(list) {
    let container = document.getElementById("medicineContainer");
    let recentContainer = document.getElementById("recentMedicineContainer");
    let recentSection = document.getElementById("recentSection");
    if(!container) return;
    container.innerHTML = ""; recentContainer.innerHTML = "";
    if(currentView === 'ethical') {
        recentSection.style.display = "none";
        document.getElementById("collectionTitle").innerText = "Ethical Medicines";
        container.className = "medicine-list-view";
        let filtered = list.filter(m => m.isEthical === true);
        if(filtered.length === 0) { container.innerHTML = buildEmptyStateHTML("", "No Ethical medicines added yet"); return; }
        filtered.forEach(m => { container.innerHTML += createListCardHTML(m); });
    } else {
        document.getElementById("collectionTitle").innerText = "Medicine Collection";
        container.className = "medicine-grid";
        let recentList = list.filter(m => m.isRecent === true);
        let collectionList = list.filter(m => m.isCollection === true || (m.isEthical !== true && m.isRecent !== true));
        if(recentList.length > 0) { recentSection.style.display = "block"; recentList.forEach(m => { recentContainer.innerHTML += createCardHTML(m, 'recent'); }); }
        else { recentSection.style.display = "none"; }
        if(collectionList.length === 0 && recentList.length === 0) { container.innerHTML = buildEmptyStateHTML("", "No medicines yet — ask admin to add some"); }
        else { collectionList.forEach(m => { container.innerHTML += createCardHTML(m, 'collection'); }); }
    }
}

function viewDetails(id) {
    let m = medicineData.find(x => x.id === id); if(!m) return;
    lastScrollPos = window.pageYOffset || document.documentElement.scrollTop;
    let isInCart = cart.find(item => item.id === m.id);
    let images = (m.images && m.images.length > 0) ? m.images : [m.image || PLACEHOLDER_IMG];
    let slidesHTML = images.map(img => `<div class="gallery-slide"><img src="${img}" class="detail-img" onerror="this.src='${PLACEHOLDER_IMG}'"></div>`).join('');
    let dotsHTML = images.length > 1 ? `<div class="gallery-dots" id="galleryDots">${images.map((_, i) => `<span class="gallery-dot ${i===0?'active':''}" onclick="goToSlide(${i})"></span>`).join('')}</div>` : '';
    document.getElementById("detailContent").innerHTML = `<div class="gallery-container"><div class="gallery-track" id="galleryTrack">${slidesHTML}</div></div>${dotsHTML}<div class="detail-info-card"><div class="detail-name-box"><h1>${m.brand}</h1></div><div class="info-row"><b>Salt</b><span>${m.salt || 'N/A'}</span></div><div class="info-row"><b>Company</b><span>${m.company || 'N/A'}</span></div><div class="info-row"><b>Composition</b><span>${m.mg || 'N/A'}</span></div><div class="info-row"><b>Packing</b><span>${m.packing || 'N/A'}</span></div><div class="info-row mrp-row"><b>MRP Price</b><span>₹${m.mrp || '0'}</span></div><div class="info-row"><b>Expiry</b><span>${m.expiry || 'N/A'}</span></div></div><div class="detail-btn-area">${isInCart ? `<button class="confirm-btn-premium" style="background:#dc3545;" onclick="removeFromCart('${m.id}', true)">✖ Remove Item</button>` : `<button class="confirm-btn-premium" onclick="openQtyPopup('${m.id}', true)">🛒 Add to Cart Now</button>`}</div>`;
    document.getElementById("mainView").style.display = "none";
    document.getElementById("bottomCartBar").style.display = "none";
    document.getElementById("detailView").style.display = "flex";
    setTimeout(initGalleryScroll, 100);
    let detailOrderBar = document.getElementById("detailOrderBar");
    let detailCartCount = document.getElementById("detailCartCount");
    if (cart.length > 0) { detailOrderBar.style.display = "block"; detailCartCount.innerText = cart.length + " Items Selected"; }
    else { detailOrderBar.style.display = "none"; }
}

function hideDetails() {
    document.getElementById("detailView").style.display = "none";
    document.getElementById("mainView").style.display = "block";
    updateCartUI();
    setTimeout(() => { window.scrollTo(0, lastScrollPos); }, 50);
}

function goToSlide(index) { let track = document.getElementById("galleryTrack"); if (!track) return; track.scrollTo({ left: track.offsetWidth * index, behavior: 'smooth' }); updateGalleryDots(index); }
function updateGalleryDots(activeIndex) { document.querySelectorAll(".gallery-dot").forEach((d, i) => d.classList.toggle("active", i === activeIndex)); }
function initGalleryScroll() { let track = document.getElementById("galleryTrack"); if (!track) return; track.addEventListener("scroll", () => { updateGalleryDots(Math.round(track.scrollLeft / track.offsetWidth)); }); }

function removeFromCart(id, refreshDetail = false) {
    let savedScroll = window.pageYOffset || document.documentElement.scrollTop;
    cart = cart.filter(item => item.id !== id);
    updateCartUI(); renderMedicines(medicineData);
    if(currentView === 'categories') renderCategoryMedicines();
    if(refreshDetail) viewDetails(id);
    else setTimeout(() => window.scrollTo(0, savedScroll), 30);
}

function changeQty(id, val) { let input = document.getElementById(id); let newVal = (parseInt(input.value) || 0) + val; if (newVal >= 0) input.value = newVal; }

function openQtyPopup(id, refreshDetail = false) {
    if(!refreshDetail) lastScrollPos = window.pageYOffset || document.documentElement.scrollTop;
    let m = medicineData.find(x => x.id === id);
    document.getElementById("popTitle").innerText = m.brand;
    document.getElementById("stripQty").value = 0;
    document.getElementById("boxQty").value = 0;
    document.getElementById("qtyPopup").style.display = "flex";
    document.getElementById("confirmAddBtn").onclick = function() {
        let s = parseInt(document.getElementById("stripQty").value) || 0;
        let b = parseInt(document.getElementById("boxQty").value) || 0;
        if(s > 0 || b > 0) addToCart(id, s, b, refreshDetail);
        document.getElementById("qtyPopup").style.display = "none";
    };
}

function closeQtyPopup() { document.getElementById("qtyPopup").style.display = "none"; }

function addToCart(id, s, b, refreshDetail = false) {
    let m = medicineData.find(x => x.id === id);
    cart.push({ id, name: m.brand, strips: s, boxes: b });
    updateCartUI(); renderMedicines(medicineData);
    if(currentView === 'categories') renderCategoryMedicines();
    if(refreshDetail) viewDetails(id);
    else setTimeout(() => window.scrollTo(0, lastScrollPos), 30);
}

function updateCartUI() {
    let bar = document.getElementById("bottomCartBar");
    if(cart.length > 0) { bar.style.display = "flex"; document.getElementById("cartCount").innerText = cart.length + " Items Selected"; }
    else { bar.style.display = "none"; }
}

function sendWhatsApp() {
    let msg = "🏥 *Billuuu pharma Order*\n\n";
    cart.forEach((item) => {
        msg += `*${item.name}*\n`;
        if (item.strips > 0) msg += `Strips: ${item.strips}\n`;
        if (item.boxes > 0) msg += `Boxes: ${item.boxes}\n`;
        msg += "\n";
    });
    window.location.href = "https://wa.me/916396832385?text=" + encodeURIComponent(msg);
    cart = []; updateCartUI(); renderMedicines(medicineData);
}

function searchMedicine() {
    let q = document.getElementById("search").value.toLowerCase().trim();
    if (q === "") {
        document.getElementById("homeContent").style.display = (currentView === 'home' || currentView === 'ethical') ? "block" : "none";
        document.getElementById("categoryContent").style.display = (currentView === 'categories') ? "block" : "none";
        renderMedicines(medicineData);
        if (currentView === 'categories') renderCategoryMedicines();
        return;
    }
    let results = medicineData.filter(m =>
        (m.brand && m.brand.toLowerCase().includes(q)) ||
        (m.salt && m.salt.toLowerCase().includes(q)) ||
        (m.company && m.company.toLowerCase().includes(q))
    );
    document.getElementById("homeContent").style.display = "block";
    document.getElementById("categoryContent").style.display = "none";
    document.getElementById("recentSection").style.display = "none";
    let container = document.getElementById("medicineContainer");
    container.innerHTML = "";
    if (results.length > 0) {
        document.getElementById("collectionTitle").innerHTML = `Search Results <span class="result-count-badge">✅ ${results.length} found</span>`;
        container.className = "medicine-grid";
        results.forEach(m => { container.innerHTML += createCardHTML(m, 'collection'); });
    } else {
        document.getElementById("collectionTitle").innerText = "Search Results";
        container.className = "medicine-grid";
        container.innerHTML = buildEmptyStateHTML(document.getElementById("search").value.trim(), "");
    }
}

function adminLogin() {
    document.getElementById("adminPasswordInput").value = "";
    document.getElementById("adminLoginModal").style.display = "flex";
    setTimeout(() => document.getElementById("adminPasswordInput").focus(), 100);
}
function submitAdminLogin() {
    let pwd = document.getElementById("adminPasswordInput").value;
    if(pwd === ADMIN_PASSWORD) {
        isAdmin = true;
        document.getElementById("adminPanel").style.display = "block";
        document.getElementById("adminLoginModal").style.display = "none";
        renderMedicines(medicineData);
    } else {
        document.getElementById("adminPasswordInput").value = "";
        document.getElementById("adminPasswordInput").placeholder = "❌ Wrong Password, try again";
        document.getElementById("adminPasswordInput").style.borderColor = "#dc3545";
        setTimeout(() => {
            document.getElementById("adminPasswordInput").placeholder = "Enter Password";
            document.getElementById("adminPasswordInput").style.borderColor = "#e2e8f0";
        }, 2000);
    }
}
function closeAdminLogin() {
    document.getElementById("adminLoginModal").style.display = "none";
}

function updateCategoryUI() {
    let dropdown = document.getElementById("medCategory");
    let sidebar = document.getElementById("catSidebar");
    let adminList = document.getElementById("adminCatList");
    dropdown.innerHTML = '<option value="">Select Category</option>';
    sidebar.innerHTML = ''; adminList.innerHTML = '';
    categories.forEach(cat => {
        dropdown.innerHTML += `<option value="${cat.name}">${cat.name}</option>`;
        sidebar.innerHTML += `<div id="cat-${cat.name}" class="cat-item ${activeCategory === cat.name ? 'active' : ''}" onclick="selectCategory('${cat.name}')">${cat.name}</div>`;
        adminList.innerHTML += `<div style="display:flex; justify-content:space-between; background:#fff; padding:5px; border-radius:5px; margin-bottom:2px; font-size:11px; border:1px solid #eee;">${cat.name} <span onclick="deleteCategory('${cat.id}')" style="color:red; cursor:pointer; font-weight:800;">✖</span></div>`;
    });
}

async function addCategory() { let name = document.getElementById("newCatName").value.trim(); if(name) { await db.collection("categories").add({ name: name }); document.getElementById("newCatName").value = ""; } }
async function deleteCategory(id) { if(confirm("Delete?")) await db.collection("categories").doc(id).delete(); }

async function saveMedicine() {
    let finalImages = selectedImages.filter(Boolean);
    let med = {
        brand: document.getElementById("brand").value,
        salt: document.getElementById("salt").value,
        company: document.getElementById("company").value,
        mg: document.getElementById("mg").value,
        packing: document.getElementById("packing").value,
        mfg: document.getElementById("mfg").value,
        expiry: document.getElementById("expiry").value,
        mrp: document.getElementById("mrp").value,
        category: document.getElementById("medCategory").value,
        isRecent: document.getElementById("isRecent").checked,
        isEthical: document.getElementById("isEthical").checked,
        isCollection: document.getElementById("isCollection").checked,
        createdAt: new Date()
    };
    if(finalImages.length > 0) { med.images = finalImages; med.image = finalImages[0]; }
    else if(editId !== null) { let existing = medicineData.find(x => x.id === editId); if(existing) { med.images = existing.images || []; med.image = existing.image || PLACEHOLDER_IMG; } }
    else { med.images = []; med.image = PLACEHOLDER_IMG; }
    if(editId === null) await db.collection("medicines").add(med);
    else await db.collection("medicines").doc(editId).update(med);
    alert("Saved!"); clearForm();
}

function editMedicine(id) {
    let m = medicineData.find(x => x.id === id); editId = id;
    document.getElementById("brand").value = m.brand;
    document.getElementById("salt").value = m.salt;
    document.getElementById("company").value = m.company;
    document.getElementById("mg").value = m.mg;
    document.getElementById("packing").value = m.packing;
    document.getElementById("mfg").value = m.mfg;
    document.getElementById("expiry").value = m.expiry;
    document.getElementById("mrp").value = m.mrp;
    document.getElementById("medCategory").value = m.category || "";
    document.getElementById("isRecent").checked = m.isRecent || false;
    document.getElementById("isEthical").checked = m.isEthical || false;
    document.getElementById("isCollection").checked = m.isCollection || false;
    selectedImages = [];
    let prevRow = document.getElementById("imagePreviewRow"); prevRow.innerHTML = "";
    let imgs = (m.images && m.images.length > 0) ? m.images : (m.image ? [m.image] : []);
    imgs.forEach((src, idx) => {
        selectedImages[idx] = src;
        let thumb = document.createElement("img");
        thumb.src = src;
        thumb.style.cssText = "width:50px;height:50px;object-fit:cover;border-radius:8px;border:2px solid #008296;";
        prevRow.appendChild(thumb);
    });
    window.scrollTo({top: 0, behavior: 'smooth'});
}

function deleteMedicine(id) { if(confirm("Delete?")) db.collection("medicines").doc(id).delete(); }

function clearForm() {
    document.querySelectorAll("#adminPanel input").forEach(i => i.type !== "checkbox" ? i.value = "" : i.checked = false);
    editId = null; selectedImages = [];
    document.getElementById("imagePreviewRow").innerHTML = "";
}

function logoutAdmin() { isAdmin = false; document.getElementById("adminPanel").style.display = "none"; renderMedicines(medicineData); }
