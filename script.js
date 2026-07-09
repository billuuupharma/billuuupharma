const ADMIN_PASSWORD = "BilalAnsariNaziyaSalmani";
let medicineData = JSON.parse(localStorage.getItem("wellness_medicines")) || [...medicines];
let cart = [];
let editId = null;
let isAdmin = false;
let selectedImage = "";
let currentOrderMedId = null;

window.onload = () => {
    renderMedicines(medicineData);
    const img = document.getElementById("imageFile");
    if(img){
        img.addEventListener("change",function(){
            const file=this.files[0];
            if(!file){ selectedImage=""; return; }
            const reader=new FileReader();
            reader.onload=function(e){ selectedImage=e.target.result; };
            reader.readAsDataURL(file);
        });
    }
};

function saveLocal(){ localStorage.setItem("wellness_medicines", JSON.stringify(medicineData)); }

function adminLogin(){
    if(isAdmin){ document.getElementById("adminPanel").style.display="block"; return; }
    let pass=prompt("Enter Admin Password");
    if(pass===ADMIN_PASSWORD){
        isAdmin=true;
        document.getElementById("adminPanel").style.display="block";
        document.getElementById("adminAuth").style.display="none";
        renderMedicines(medicineData);
    } else { alert("Wrong Password"); }
}

function renderMedicines(list){
    let container=document.getElementById("medicineContainer");
    container.innerHTML="";
    
    [...list].sort((a,b)=>b.id-a.id).forEach(m=>{
        // Check if this medicine is already in cart
        let isInCart = cart.find(item => item.id === m.id);

        container.innerHTML += `
        <div class="card">
            <img src="${m.image || 'medicine.png'}" class="medicineImage">
            <h2>${m.brand}</h2>
            <p><b>Salt:</b> ${m.salt}</p>
            <p><b>Company:</b> ${m.company}</p>
            <p><b>MG:</b> ${m.mg}</p>
            <p><b>Packing:</b> ${m.packing}</p>
            <p><b>MRP:</b> ₹${m.mrp}</p>
            <p><b>MFG:</b> ${m.mfg}</p>
            <p><b>Expiry:</b> ${m.expiry}</p>
            
            ${isInCart ? 
                `<button class="order-btn" style="background:#dc3545;" onclick="removeFromCart(${m.id})">
                    ✖ Unselect / Remove
                </button>` : 
                `<button class="order-btn" onclick="openQtyPopup(${m.id})">
                    🛒 Add to Cart
                </button>`
            }

            ${isAdmin ? `
            <div style="display:flex; gap:5px; margin-top:8px;">
                <button onclick="editMedicine(${m.id})" style="flex:1; padding:5px; border-radius:5px; background:#f0f0f0; border:1px solid #ddd;">✏️ Edit</button>
                <button onclick="deleteMedicine(${m.id})" style="flex:1; padding:5px; border-radius:5px; background:#ffebeb; color:red; border:1px solid #ffdada;">🗑️ Delete</button>
            </div>
            ` : ""}
        </div>`;
    });
}

function openQtyPopup(id){
    currentOrderMedId = id;
    let m = medicineData.find(x => x.id === id);
    document.getElementById("popTitle").innerText = m.brand;
    document.getElementById("stripQty").value = 0;
    document.getElementById("boxQty").value = 0;
    document.getElementById("qtyPopup").style.display = "flex";
    
    document.getElementById("confirmAddBtn").onclick = function(){
        let sQty = parseInt(document.getElementById("stripQty").value) || 0;
        let bQty = parseInt(document.getElementById("boxQty").value) || 0;
        if(sQty === 0 && bQty === 0) { alert("Please enter quantity"); return; }
        addToCart(currentOrderMedId, sQty, bQty);
        closeQtyPopup();
    };
}

function closeQtyPopup(){ document.getElementById("qtyPopup").style.display = "none"; }

function addToCart(id, strips, boxes){
    let m = medicineData.find(x => x.id === id);
    let existing = cart.find(item => item.id === id);
    if(existing){ 
        existing.strips += strips; existing.boxes += boxes; 
    } else { 
        cart.push({ id: m.id, name: m.brand, strips: strips, boxes: boxes }); 
    }
    updateCartUI();
    renderMedicines(medicineData); // Button update karne ke liye
}

// NAYA FEATURE: Remove from cart (Unselect)
function removeFromCart(id){
    cart = cart.filter(item => item.id !== id);
    updateCartUI();
    renderMedicines(medicineData); // Button update karne ke liye
}

function updateCartUI(){
    let bar = document.getElementById("bottomCartBar");
    let countText = document.getElementById("cartCount");
    let badge = document.getElementById("cartBadge");
    
    if(cart.length > 0){
        bar.style.display = "block";
        countText.innerText = cart.length === 1 ? "1 Item Selected" : cart.length + " Items Selected";
        badge.innerText = cart.length;
    } else { 
        bar.style.display = "none"; 
    }
}

function sendWhatsApp(){
    if(cart.length === 0) return;
    let message = "🏥 *Wellness Medicare - Order*\n\n";
    cart.forEach((item, index) => {
        message += `${index + 1}. *${item.name}*\n`;
        if(item.strips > 0) message += `   - Strips: ${item.strips}\n`;
        if(item.boxes > 0) message += `   - Boxes: ${item.boxes}\n\n`;
    });
    window.location.href = "https://wa.me/916396832385?text=" + encodeURIComponent(message);
    cart = []; 
    updateCartUI();
    renderMedicines(medicineData); // Button reset karne ke liye
}

function searchMedicine(){
    let val = document.getElementById("search").value.toLowerCase();
    let res = medicineData.filter(m => 
        m.brand.toLowerCase().includes(val) || 
        m.salt.toLowerCase().includes(val) || 
        m.company.toLowerCase().includes(val)
    );
    renderMedicines(res);
}

function saveMedicine(){
    if(!isAdmin) return;
    let med = { 
        brand: document.getElementById("brand").value, 
        salt: document.getElementById("salt").value, 
        company: document.getElementById("company").value, 
        mg: document.getElementById("mg").value, 
        packing: document.getElementById("packing").value, 
        mfg: document.getElementById("mfg").value, 
        expiry: document.getElementById("expiry").value, 
        mrp: document.getElementById("mrp").value, 
        image: selectedImage || "medicine.png" 
    };
    if(editId === null){ med.id = Date.now(); medicineData.push(med); }
    else { let index = medicineData.findIndex(x=>x.id===editId); medicineData[index] = {...med, id: editId}; editId = null; }
    saveLocal(); renderMedicines(medicineData); clearForm();
}

function editMedicine(id){
    let m = medicineData.find(x=>x.id===id);
    editId = id;
    document.getElementById("brand").value = m.brand; 
    document.getElementById("salt").value = m.salt; 
    document.getElementById("company").value = m.company; 
    document.getElementById("mg").value = m.mg; 
    document.getElementById("packing").value = m.packing; 
    document.getElementById("mfg").value = m.mfg; 
    document.getElementById("expiry").value = m.expiry; 
    document.getElementById("mrp").value = m.mrp;
    selectedImage = m.image; 
    window.scrollTo({top: 0, behavior: 'smooth'});
}

function deleteMedicine(id){ 
    if(confirm("Delete this medicine?")){ 
        medicineData = medicineData.filter(x=>x.id!==id); 
        saveLocal(); 
        renderMedicines(medicineData); 
    } 
}

function clearForm(){ document.querySelectorAll("#adminPanel input").forEach(i => i.value=""); selectedImage=""; editId=null; }

function logoutAdmin(){ 
    isAdmin=false; 
    document.getElementById("adminPanel").style.display="none"; 
    document.getElementById("adminAuth").style.display="block"; 
    renderMedicines(medicineData); 
}

function goTop(){ window.scrollTo({top:0, behavior:"smooth"}); }
window.onscroll = () => { document.getElementById("topBtn").style.display = window.scrollY > 300 ? "block" : "none"; };
