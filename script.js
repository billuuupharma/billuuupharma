const ADMIN_PASSWORD = "BilalAnsariNaziyaSalmani";
let medicineData = []; 
let cart = [];
let editId = null;
let isAdmin = false;
let selectedImage = "";
let lastScrollPos = 0; // Scroll position ko store karne ke liye

function openSidebar() { document.getElementById("mySidebar").style.width = "280px"; document.getElementById("sidebarOverlay").style.display = "block"; }
function closeSidebar() { document.getElementById("mySidebar").style.width = "0"; document.getElementById("sidebarOverlay").style.display = "none"; }
function showAbout() { alert("🏥 Wellness Medicare\n📍 Pathanpura, Deoband\n\nYour trusted pharmacy partner."); }

window.onload = () => {
    db.collection("medicines").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
        medicineData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderMedicines(medicineData);
    });
    document.getElementById("imageFile").addEventListener("change", function(){
        const reader = new FileReader();
        reader.onload = (e) => { selectedImage = e.target.result; };
        if(this.files[0]) reader.readAsDataURL(this.files[0]);
    });
};

function createCardHTML(m, category) {
    let isInCart = cart.find(item => item.id === m.id);
    let fillClass = category === 'recent' ? 'recent-fill' : 'collection-fill';
    return `
        <div class="card ${fillClass}">
            <img src="${m.image || 'medicine.png'}" class="medicineImage" onclick="viewDetails('${m.id}')">
            <h2 onclick="viewDetails('${m.id}')">${m.brand}</h2>
            <button class="btn-details" onclick="viewDetails('${m.id}')">👁 View Details</button>
            ${isInCart ? `<button class="btn-cart-small" style="background:#dc3545;" onclick="removeFromCart('${m.id}')">✖ Unselect</button>` : `<button class="btn-cart-small" onclick="openQtyPopup('${m.id}')">🛒 Add to Cart</button>`}
            ${isAdmin ? `<div style="display:flex; gap:4px; margin-top:5px;"><button onclick="editMedicine('${m.id}')" style="flex:1; padding:6px; background:#fff; border:1px solid #ddd; border-radius:6px;">✏️</button><button onclick="deleteMedicine('${m.id}')" style="flex:1; padding:6px; background:#fff; color:red; border:1px solid #fecaca; border-radius:6px;">🗑️</button></div>` : ""}
        </div>`;
}

function renderMedicines(list) {
    let container = document.getElementById("medicineContainer");
    let recentContainer = document.getElementById("recentMedicineContainer");
    let recentSection = document.getElementById("recentSection");
    if(!container) return;
    
    container.innerHTML = "";
    recentContainer.innerHTML = "";
    
    let searchInput = document.getElementById("search").value.toLowerCase();
    
    // Filtering logic
    let recentList = list.filter(m => m.isRecent === true);
    let normalList = list.filter(m => m.isRecent !== true);
    
    if(recentList.length > 0 && searchInput === "") {
        recentSection.style.display = "block";
        recentList.forEach(m => { recentContainer.innerHTML += createCardHTML(m, 'recent'); });
    } else {
        recentSection.style.display = "none";
    }

    let displayList = searchInput !== "" ? list.filter(m => m.brand.toLowerCase().includes(searchInput) || m.salt.toLowerCase().includes(searchInput)) : normalList;
    displayList.forEach(m => { container.innerHTML += createCardHTML(m, 'collection'); });
}

function viewDetails(id) {
    let m = medicineData.find(x => x.id === id);
    if(!m) return;
    
    // AGAR MAIN VIEW DHIK RAHA HAI TABHI SCROLL POSITION SAVE KARO
    if(document.getElementById("mainView").style.display !== "none") {
        lastScrollPos = window.scrollY;
    }
    
    let isInCart = cart.find(item => item.id === m.id);
    document.getElementById("detailContent").innerHTML = `
        <img src="${m.image || 'medicine.png'}" class="detail-img">
        <div class="detail-info-card">
            <div class="medicine-title-box">
                <h1>${m.brand}</h1>
            </div>
            <div class="info-row"><b>Salt</b> <span style="color:#0369a1; font-weight:600; text-align:right;">${m.salt}</span></div>
            <div class="info-row"><b>Composition</b> <span>${m.mg}</span></div>
            <div class="info-row"><b>Company</b> <span>${m.company}</span></div>
            <div class="info-row"><b>Packing</b> <span>${m.packing}</span></div>
            <div class="info-row" style="background:#f0fdf4; border-radius:8px;"><b>MRP Price</b> <span style="color:#15803d; font-weight:700;">₹${m.mrp}</span></div>
            <div class="info-row"><b>MFG Date</b> <span>${m.mfg}</span></div>
            <div class="info-row"><b>Expiry Date</b> <span>${m.expiry}</span></div>
            ${isInCart ? `<button class="confirm-btn-premium" style="background:#dc3545;" onclick="removeFromCart('${m.id}', true)">✖ Remove Item</button>` : `<button class="confirm-btn-premium" onclick="openQtyPopup('${m.id}', true)">🛒 Add to Cart Now</button>`}
        </div>`;
    
    document.getElementById("mainView").style.display = "none";
    document.getElementById("detailView").style.display = "flex";
    window.scrollTo(0,0);
}

function hideDetails() { 
    document.getElementById("detailView").style.display = "none"; 
    document.getElementById("mainView").style.display = "block"; 
    // WAHI WAPAS PAUNCH JAO JAHAN PEHLE THE
    window.scrollTo(0, lastScrollPos); 
}

function removeFromCart(id, refreshDetail = false){ 
    cart = cart.filter(item => item.id !== id); 
    updateCartUI(); 
    renderMedicines(medicineData); 
    if(refreshDetail) viewDetails(id); 
}

function changeQty(id, val) { 
    let input = document.getElementById(id); 
    let newVal = (parseInt(input.value) || 0) + val; 
    if (newVal >= 0) input.value = newVal; 
}

function openQtyPopup(id, refreshDetail = false){
    let m = medicineData.find(x => x.id === id);
    document.getElementById("popTitle").innerText = m.brand;
    document.getElementById("stripQty").value = 0; 
    document.getElementById("boxQty").value = 0;
    document.getElementById("qtyPopup").style.display = "flex";
    document.getElementById("confirmAddBtn").onclick = function(){
        let s = parseInt(document.getElementById("stripQty").value) || 0;
        let b = parseInt(document.getElementById("boxQty").value) || 0;
        if(s > 0 || b > 0) addToCart(id, s, b, refreshDetail);
        document.getElementById("qtyPopup").style.display = "none";
    };
}

function closeQtyPopup(){ document.getElementById("qtyPopup").style.display = "none"; }

function addToCart(id, s, b, refreshDetail = false){ 
    let m = medicineData.find(x => x.id === id); 
    cart.push({ id, name: m.brand, strips: s, boxes: b }); 
    updateCartUI(); 
    renderMedicines(medicineData); 
    if(refreshDetail) viewDetails(id); 
}

function updateCartUI(){
    let bar = document.getElementById("bottomCartBar");
    let countText = document.getElementById("cartCount");
    if(cart.length > 0){ 
        bar.style.display = "flex"; 
        countText.innerText = cart.length + " Items Selected"; 
    } else { 
        bar.style.display = "none"; 
    }
}

function sendWhatsApp(){
    let msg = "🏥 *Wellness Medicare Order Request*\n\n";
    cart.forEach((item, i) => { 
        msg += `${i+1}. *${item.name}*\n`; 
        if(item.strips > 0) msg += `   - Strips: ${item.strips}\n`; 
        if(item.boxes > 0) msg += `   - Boxes: ${item.boxes}\n`; 
        msg += `\n`; 
    });
    window.location.href = "https://wa.me/916396832385?text=" + encodeURIComponent(msg);
    cart = []; 
    updateCartUI(); 
    renderMedicines(medicineData);
}

function searchMedicine(){ 
    renderMedicines(medicineData); 
}

function adminLogin(){ 
    if(prompt("Admin Password") === ADMIN_PASSWORD){ 
        isAdmin = true; 
        document.getElementById("adminPanel").style.display = "block"; 
        renderMedicines(medicineData); 
    } 
}

async function saveMedicine() {
    const med = { 
        brand: document.getElementById("brand").value, 
        salt: document.getElementById("salt").value, 
        company: document.getElementById("company").value, 
        mg: document.getElementById("mg").value, 
        packing: document.getElementById("packing").value, 
        mfg: document.getElementById("mfg").value, 
        expiry: document.getElementById("expiry").value, 
        mrp: document.getElementById("mrp").value, 
        image: selectedImage || "medicine.png", 
        isRecent: document.getElementById("isRecent").checked, 
        createdAt: new Date() 
    };
    if(editId === null) await db.collection("medicines").add(med);
    else await db.collection("medicines").doc(editId).update(med);
    alert("Saved Successfully!"); 
    clearForm();
}

function editMedicine(id){ 
    let m = medicineData.find(x => x.id === id); 
    editId = id; 
    document.getElementById("brand").value = m.brand; 
    document.getElementById("salt").value = m.salt; 
    document.getElementById("company").value = m.company; 
    document.getElementById("mg").value = m.mg;
    document.getElementById("packing").value = m.packing; 
    document.getElementById("mfg").value = m.mfg;
    document.getElementById("expiry").value = m.expiry; 
    document.getElementById("mrp").value = m.mrp; 
    document.getElementById("isRecent").checked = m.isRecent || false;
    selectedImage = m.image; 
    window.scrollTo({top: 0, behavior: 'smooth'}); 
}

function deleteMedicine(id){ if(confirm("Delete Permanently?")) db.collection("medicines").doc(id).delete(); }

function clearForm(){ 
    document.querySelectorAll("#adminPanel input[type='text'], #adminPanel input[type='number']").forEach(i => i.value=""); 
    document.getElementById("isRecent").checked = false; 
    editId = null; 
}

function logoutAdmin(){ 
    isAdmin = false; 
    document.getElementById("adminPanel").style.display = "none"; 
    renderMedicines(medicineData); 
}
