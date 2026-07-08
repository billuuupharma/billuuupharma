let medicineData = [...medicines];

let cart = [];

let editId = null;



window.onload = function(){

renderMedicines(medicineData);

};



function renderMedicines(list){

let container =
document.getElementById("medicineContainer");


container.innerHTML="";


list.forEach(m=>{


container.innerHTML += `


<div class="card">


<img src="${m.image}" class="medicineImage">


<h2>${m.brand}</h2>


<p><b>Salt:</b> ${m.salt}</p>

<p><b>MG:</b> ${m.mg}</p>

<p><b>Company:</b> ${m.company}</p>

<p><b>Packing:</b> ${m.packing}</p>

<p><b>MRP:</b> ₹${m.mrp}</p>

<p><b>Manufacturing:</b> ${m.mfg}</p>

<p><b>Expiry:</b> ${m.expiry}</p>



<button 
style="background:#198754"
onclick="addToCart(${m.id})">

🛒 Order Now

</button>



<button class="editBtn"
onclick="editMedicine(${m.id})">

Edit

</button>



<button class="deleteBtn"
onclick="deleteMedicine(${m.id})">

Delete

</button>



</div>


`;


});


}





function searchMedicine(){


let value =
document.getElementById("search")
.value
.toLowerCase();



let result =
medicineData.filter(m=>


m.brand.toLowerCase().includes(value) ||

m.salt.toLowerCase().includes(value) ||

m.company.toLowerCase().includes(value)


);



renderMedicines(result);


}







function addToCart(id){


let m =
medicineData.find(x=>x.id===id);



cart.push({

name:m.brand

});



sendWhatsApp();


}







function sendWhatsApp(){



let message =
"Hello Wellness Medicare\n\nMy Order:\n\n";



cart.forEach(item=>{


message +=

item.name+
"\n";


});



let number="916396832385";



let url =
"https://wa.me/"+number+
"?text="+
encodeURIComponent(message);



window.location.href = url;



cart=[];



}









function toggleAdmin(){


let panel =
document.getElementById("adminPanel");



if(panel.style.display==="none" ||
panel.style.display===""){


panel.style.display="block";


}

else{


panel.style.display="none";


clearForm();


}


}







function saveMedicine(){


let medicine={


brand:
document.getElementById("brand").value,


salt:
document.getElementById("salt").value,


company:
document.getElementById("company").value,


mg:
document.getElementById("mg").value,


packing:
document.getElementById("packing").value,


mfg:
document.getElementById("mfg").value,


expiry:
document.getElementById("expiry").value,


mrp:
document.getElementById("mrp").value,


stripPrice:
document.getElementById("mrp").value,


boxPrice:
document.getElementById("mrp").value,


quantity:0,


image:"medicine.png"


};




if(editId===null){


medicine.id=Date.now();


medicineData.push(medicine);


}


else{


let old =
medicineData.find(x=>x.id===editId);



Object.assign(old,medicine);


editId=null;


}



renderMedicines(medicineData);


saveLocal();


clearForm();


document.getElementById("adminPanel")
.style.display="none";


alert("Medicine Saved");


}







function editMedicine(id){


let m =
medicineData.find(x=>x.id===id);



editId=id;



document.getElementById("adminPanel")
.style.display="block";



document.getElementById("brand").value=m.brand;

document.getElementById("salt").value=m.salt;

document.getElementById("company").value=m.company;

document.getElementById("mg").value=m.mg;

document.getElementById("packing").value=m.packing;

document.getElementById("mfg").value=m.mfg;

document.getElementById("expiry").value=m.expiry;

document.getElementById("mrp").value=m.mrp;



}







function deleteMedicine(id){


if(confirm("Delete Medicine?")){


medicineData =
medicineData.filter(x=>x.id!==id);



renderMedicines(medicineData);


saveLocal();


}


}







function clearForm(){


document.querySelectorAll("#adminPanel input")
.forEach(x=>x.value="");



editId=null;


}







function saveLocal(){


localStorage.setItem(

"wellness_medicines",

JSON.stringify(medicineData)

);


}






let savedData =
localStorage.getItem("wellness_medicines");



if(savedData){


medicineData =
JSON.parse(savedData);


}







function goTop(){


window.scrollTo({

top:0,

behavior:"smooth"

});


}







window.addEventListener("scroll",()=>{


let btn =
document.getElementById("topBtn");



if(!btn)return;



if(window.scrollY>300){


btn.style.display="flex";


}

else{


btn.style.display="none";


}


});







window.onclick=function(e){


let popup =
document.getElementById("popup");



if(e.target===popup){


popup.style.display="none";


}


};







window.addEventListener(

"beforeunload",

()=>{


saveLocal();


}

);