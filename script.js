const ADMIN_PASSWORD = "BilalAnsariNaziyaSalmani";
let medicineData = []; let categories = []; let cart = []; let editId = null; let isAdmin = false; let selectedImage = ""; let lastScrollPos = 0; let currentView = 'home'; let activeCategory = "";

function openSidebar() { document.getElementById("mySidebar").style.width = "280px"; document.getElementById("sidebarOverlay").style.display = "block"; }
function closeSidebar() { document.getElementById("mySidebar").style.width = "0"; document.getElementById("sidebarOverlay").style.display = "none"; }

window.onload = () => {
    db.collection("medicines").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
        medicineData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderMedicines(medicineData);
        if(currentView === 'categories') renderCategoryMedicines();
    });
    db.collection("categories").onSnapshot((snapshot) => {
        categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        updateCategoryUI();
    });
    document.getElementById("imageFile").addEventListener("change", function(){
        const reader = new FileReader();
        reader.onload = (e) => { selectedImage = e.target.result; };
        if(this.files[0]) reader.readAsDataURL(this.files[0]);
    });
};

function switchView(view) {
    currentView = view;
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.getElementById("homeContent").style.display = (view === 'home' || view === 'ethical') ? "block" : "none";
    document.getElementById("categoryContent").style.display = (view === 'categories') ? "block" : "none";
    if(view === 'home') document.getElementById('homeNav').classList.add('active');
    if(view === 'ethical') document.getElementById('ethicalNav').classList.add('active');
    if(view === 'categories') {
        document.getElementById('catNavBtn').classList.add('active');
        if(categories.length > 0 && !activeCategory) selectCategory(categories[0].name);
    }
    renderMedicines(medicineData); window.scrollTo(0,0);
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
    filtered.forEach(m => { container.innerHTML += createCardHTML(m, 'collection'); });
}

function createCardHTML(m, type) {
    let isInCart = cart.find(item => item.id === m.id);
    let fillClass = type === 'recent' ? 'recent-fill' : (type === 'ethical' ? 'ethical-fill' : 'collection-fill');
    let adminButtons = isAdmin ? `<div style="display:flex; gap:5px; margin-top:8px;"><button onclick="editMedicine('${m.id}')" style="flex:1; padding:5px; background:#fff; border:1px solid #ddd; border-radius:5px;">✏️</button><button onclick="deleteMedicine('${m.id}')" style="flex:1; padding:6px; background:#fff; color:red; border:1px solid #ddd; border-radius:5px;">🗑️</button></div>` : "";
    return `<div class="card ${fillClass}"><img src="${m.image || 'medicine.png'}" class="medicineImage" onclick="viewDetails('${m.id}')"><h2 onclick="viewDetails('${m.id}')">${m.brand}</h2><button class="btn-details" onclick="viewDetails('${m.id}')">View Details</button>${isInCart ? `<button class="btn-cart-small" style="background:#dc3545;" onclick="removeFromCart('${m.id}')">Remove</button>` : `<button class="btn-cart-small" onclick="openQtyPopup('${m.id}')">Add to Cart</button>`}${adminButtons}</div>`;
}

function renderMedicines(list) {
    let container = document.getElementById("medicineContainer");
    let recentContainer = document.getElementById("recentMedicineContainer");
    let recentSection = document.getElementById("recentSection");
    if(!container) return;
    container.innerHTML = ""; recentContainer.innerHTML = "";
    let searchInput = document.getElementById("search").value.toLowerCase();
    
    if(currentView === 'ethical') {
        recentSection.style.display = "none";
        document.getElementById("collectionTitle").innerText = "Ethical Medicines";
        container.className = "medicine-list-view";
        let filtered = list.filter(m => m.isEthical === true);
        filtered.forEach(m => { container.innerHTML += createCardHTML(m, 'ethical'); });
    } else {
        document.getElementById("collectionTitle").innerText = "Medicine Collection";
        container.className = "medicine-grid";
        let recentList = list.filter(m => m.isRecent === true);
        let collectionList = list.filter(m => m.isCollection === true || (m.isEthical !== true && m.isRecent !== true));
        if(recentList.length > 0 && searchInput === "") {
            recentSection.style.display = "block";
            recentList.forEach(m => { recentContainer.innerHTML += createCardHTML(m, 'recent'); });
        } else { recentSection.style.display = "none"; }
        let displayList = searchInput !== "" ? list.filter(m => m.brand.toLowerCase().includes(searchInput)) : collectionList;
        displayList.forEach(m => { container.innerHTML += createCardHTML(m, 'collection'); });
    }
}

function viewDetails(id) {
    let m = medicineData.find(x => x.id === id); if(!m) return;
    lastScrollPos = window.pageYOffset || document.documentElement.scrollTop;
    let isInCart = cart.find(item => item.id === m.id);
    document.getElementById("detailContent").innerHTML = `
        <img src="${m.image || 'medicine.png'}" class="detail-img">
        <div class="detail-info-card">
            <div class="detail-name-box">
                <h1>${m.brand}</h1>
            </div>
            <div class="info-row"><b>Salt</b><span>${m.salt || 'N/A'}</span></div>
            <div class="info-row"><b>Company</b><span>${m.company || 'N/A'}</span></div>
            <div class="info-row"><b>Composition</b><span>${m.mg || 'N/A'}</span></div>
            <div class="info-row"><b>Packing</b><span>${m.packing || 'N/A'}</span></div>
            <div class="info-row mrp-row"><b>MRP Price</b><span>₹${m.mrp || '0'}</span></div>
            <div class="info-row"><b>Expiry</b><span>${m.expiry || 'N/A'}</span></div>
        </div>
        <div class="detail-btn-area">
            ${isInCart
                ? `<button class="confirm-btn-premium" style="background:#dc3545;" onclick="removeFromCart('${m.id}', true)">✖ Remove Item</button>`
                : `<button class="confirm-btn-premium" onclick="openQtyPopup('${m.id}', true)">🛒 Add to Cart Now</button>`
            }
        </div>`;
    document.getElementById("mainView").style.display = "none";
    document.getElementById("bottomCartBar").style.display = "none";
    document.getElementById("detailView").style.display = "flex";
    let detailOrderBar = document.getElementById("detailOrderBar");
    let detailCartCount = document.getElementById("detailCartCount");
    if (isInCart) {
        detailOrderBar.style.display = "block";
        detailCartCount.innerText = cart.length + " Items Selected";
    } else {
        detailOrderBar.style.display = "none";
    }
}

function hideDetails() { 
    document.getElementById("detailView").style.display = "none"; 
    document.getElementById("mainView").style.display = "block"; 
    updateCartUI();
    setTimeout(() => { window.scrollTo(0, lastScrollPos); }, 1);
}

function removeFromCart(id, refreshDetail = false){ cart = cart.filter(item => item.id !== id); updateCartUI(); renderMedicines(medicineData); if(currentView === 'categories') renderCategoryMedicines(); if(refreshDetail) viewDetails(id); }
function changeQty(id, val) { let input = document.getElementById(id); let newVal = (parseInt(input.value) || 0) + val; if (newVal >= 0) input.value = newVal; }

function openQtyPopup(id, refreshDetail = false){
    let m = medicineData.find(x => x.id === id);
    document.getElementById("popTitle").innerText = m.brand;
    document.getElementById("stripQty").value = 0; document.getElementById("boxQty").value = 0;
    document.getElementById("qtyPopup").style.display = "flex";
    document.getElementById("confirmAddBtn").onclick = function(){
        let s = parseInt(document.getElementById("stripQty").value) || 0;
        let b = parseInt(document.getElementById("boxQty").value) || 0;
        if(s > 0 || b > 0) addToCart(id, s, b, refreshDetail);
        document.getElementById("qtyPopup").style.display = "none";
    };
}
function closeQtyPopup(){ document.getElementById("qtyPopup").style.display = "none"; }
function addToCart(id, s, b, refreshDetail = false){ let m = medicineData.find(x => x.id === id); cart.push({ id, name: m.brand, strips: s, boxes: b }); updateCartUI(); renderMedicines(medicineData); if(currentView === 'categories') renderCategoryMedicines(); if(refreshDetail) viewDetails(id); }

function updateCartUI(){
    let bar = document.getElementById("bottomCartBar");
    if(cart.length > 0){ bar.style.display = "flex"; document.getElementById("cartCount").innerText = cart.length + " Items Selected"; } else { bar.style.display = "none"; }
}

function sendWhatsApp(){
    let msg = "🏥 *Billuuu pharma Order*\n\n";
    cart.forEach((item, i) => { msg += `${i+1}. *${item.name}* (Strips: ${item.strips}, Boxes: ${item.boxes})\n`; });
    window.location.href = "https://wa.me/916396832385?text=" + encodeURIComponent(msg);
    cart = []; updateCartUI(); renderMedicines(medicineData);
}

function searchMedicine(){ renderMedicines(medicineData); }
function adminLogin(){ if(prompt("Password") === ADMIN_PASSWORD){ isAdmin = true; document.getElementById("adminPanel").style.display = "block"; renderMedicines(medicineData); } }
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
    const med = { brand: document.getElementById("brand").value, salt: document.getElementById("salt").value, company: document.getElementById("company").value, mg: document.getElementById("mg").value, packing: document.getElementById("packing").value, mfg: document.getElementById("mfg").value, expiry: document.getElementById("expiry").value, mrp: document.getElementById("mrp").value, category: document.getElementById("medCategory").value, image: selectedImage || "medicine.png", isRecent: document.getElementById("isRecent").checked, isEthical: document.getElementById("isEthical").checked, isCollection: document.getElementById("isCollection").checked, createdAt: new Date() };
    if(editId === null) await db.collection("medicines").add(med); else await db.collection("medicines").doc(editId).update(med);
    alert("Saved!"); clearForm();
}
function editMedicine(id){ 
    let m = medicineData.find(x => x.id === id); editId = id; 
    document.getElementById("brand").value = m.brand; document.getElementById("salt").value = m.salt; document.getElementById("company").value = m.company; document.getElementById("mg").value = m.mg; document.getElementById("packing").value = m.packing; document.getElementById("mfg").value = m.mfg; document.getElementById("expiry").value = m.expiry; document.getElementById("mrp").value = m.mrp; document.getElementById("medCategory").value = m.category || "";
    document.getElementById("isRecent").checked = m.isRecent || false; document.getElementById("isEthical").checked = m.isEthical || false; document.getElementById("isCollection").checked = m.isCollection || false;
    selectedImage = m.image; window.scrollTo({top: 0, behavior: 'smooth'}); 
}
function deleteMedicine(id){ if(confirm("Delete?")) db.collection("medicines").doc(id).delete(); }
function clearForm(){ document.querySelectorAll("#adminPanel input").forEach(i => i.type !== "checkbox" ? i.value="" : i.checked = false); editId = null; }
function logoutAdmin(){ isAdmin = false; document.getElementById("adminPanel").style.display = "none"; renderMedicines(medicineData); }
