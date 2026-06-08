let nombre=""
let equipo=""
let curso=""

let paso="equipo"

let qr=null
let scanning=false
let cooldown=false

const beep=new Audio("https://www.soundjay.com/buttons/beep-07.wav")

/* SERVICE WORKER */

if("serviceWorker" in navigator){

navigator.serviceWorker.register(
"service-worker.js"
)

}

/* PERMISO CAMARA */

async function prepararCamara(){

try{

const stream=
await navigator.mediaDevices.getUserMedia({
video:true
})

stream.getTracks().forEach(track=>{
track.stop()
})

}catch(e){

console.log(
"Permiso de cámara no concedido"
)

}

}

/* LOGIN */

function guardarUsuario(){

let nombreCompleto=

document
.getElementById("nombreCompleto")
.value
.trim()

if(!nombreCompleto){

alert("Completa el nombre")

return

}

localStorage.setItem(

"usuario",

JSON.stringify({
nombreCompleto
})

)

iniciarApp()

}

/* CAMBIAR ESTUDIANTE */

async function siguienteEstudiante(){

if(qr && scanning){

await qr.stop()

scanning=false

}

localStorage.removeItem("usuario")

document.getElementById("app")
.style.display="none"

document.getElementById("login")
.style.display="block"

document.getElementById("nombreCompleto")
.value=""

document.getElementById("resultado")
.innerText=""

document.getElementById("btnEquipo")
.style.display="inline-block"

document.getElementById("btnSiguiente")
.style.display="none"

paso="equipo"

equipo=""
curso=""

}

/* INICIAR APP */

function iniciarApp(){

const user=

JSON.parse(
localStorage.getItem("usuario")
)

if(!user)return

nombre=user.nombreCompleto

document.getElementById("login")
.style.display="none"

document.getElementById("app")
.style.display="block"

document.getElementById("usuario")
.innerText="👤 "+nombre

document.getElementById("btnEquipo")
.style.display="inline-block"

document.getElementById("btnSiguiente")
.style.display="none"

cargarHistorial()

}

/* ESCANEO */

async function iniciarEscaneo(){

if(scanning)return

if(!qr){

qr=new Html5Qrcode("reader")

}

try{

await qr.start(

{facingMode:"environment"},

{
fps:12,

qrbox:{
width:250,
height:250
}

},

onScan

)

}catch{

const devices=
await Html5Qrcode.getCameras()

let cam=devices[0].id

for(let d of devices){

let label=
d.label.toLowerCase()

if(

label.includes("back") ||

label.includes("rear") ||

label.includes("environment")

){

cam=d.id

break

}

}

await qr.start(

cam,

{
fps:12,

qrbox:{
width:250,
height:250
}

},

onScan

)

}

scanning=true

}

async function detenerEscaneo(){

if(!scanning)return

await qr.stop()

scanning=false

}
/* SCAN */

async function onScan(text){

if(cooldown)return

cooldown=true

beep.play()

await detenerEscaneo()

if(paso==="equipo"){

equipo=text

document.getElementById("resultado").innerText=
"📦 Equipo: "+equipo

document.getElementById("btnEquipo")
.style.display="none"

document.getElementById("btnSiguiente")
.style.display="inline-block"

}else{

curso=text

document.getElementById("resultado").innerText=
`📦 Equipo: ${equipo} | 🎓 Curso: ${curso}`

guardarRegistro()

paso="equipo"

equipo=""
curso=""

document.getElementById("btnSiguiente")
.style.display="none"

document.getElementById("btnEquipo")
.style.display="inline-block"

document.getElementById("resultado")
.innerText="✅ Registro guardado"

}

setTimeout(()=>{

cooldown=false

},600)

}

/* SIGUIENTE PASO */

function siguientePaso(){

paso="curso"

document.getElementById("resultado")
.innerText=
"🎓 Escanea el código QR del curso"

document.getElementById("btnSiguiente")
.style.display="none"

setTimeout(()=>{

iniciarEscaneo()

},100)

}

/* GUARDAR REGISTRO */

function guardarRegistro(){

let registros=

JSON.parse(
localStorage.getItem("registros")
) || []

registros.push({

nombre:nombre,

equipo:equipo,

curso:curso,

fecha:new Date().toLocaleString()

})

localStorage.setItem(

"registros",

JSON.stringify(registros)

)

cargarHistorial()

}

/* HISTORIAL */

function cargarHistorial(){

let registros=

JSON.parse(
localStorage.getItem("registros")
) || []

let propios=

registros.filter(
r=>r.nombre===nombre
)

let ultimos=
propios.slice().reverse()

let html=""

ultimos.forEach(r=>{

html+=`

<div style="
display:flex;
justify-content:space-between;
align-items:center;
padding:6px;
margin:4px 0;
border-bottom:1px solid #ddd;
">

<span>

📦 ${r.equipo}
 |
 🎓 ${r.curso}
 |
 🕒 ${r.fecha}

</span>

<button

onclick="eliminarRegistro('${r.fecha}')"

style="
background:#dc3545;
padding:6px 10px;
font-size:14px;
margin:0;
"

>

🗑

</button>

</div>

`

})

document.getElementById("historial")
.innerHTML=html

document.getElementById("contador")
.innerText=
"Escaneados: "+propios.length

}

/* ELIMINAR REGISTRO */

function eliminarRegistro(fecha){

if(
!confirm("¿Eliminar este registro?")
){
return
}

let registros=

JSON.parse(
localStorage.getItem("registros")
) || []

registros=

registros.filter(
r=>r.fecha!==fecha
)

localStorage.setItem(

"registros",

JSON.stringify(registros)

)

cargarHistorial()

}
/* DESHACER ULTIMO */

function deshacer(){

let registros=

JSON.parse(
localStorage.getItem("registros")
) || []

if(!registros.length){

alert("Nada que deshacer")

return

}

registros.pop()

localStorage.setItem(

"registros",

JSON.stringify(registros)

)

cargarHistorial()

}

/* EXPORTAR EXCEL */

function exportarExcel(){

let registros=

JSON.parse(
localStorage.getItem("registros")
) || []

if(!registros.length){

alert("No hay registros")

return

}

let datos=

registros.map(r=>({

Nombre:r.nombre,

Equipo:r.equipo,

Curso:r.curso,

Fecha:r.fecha

}))

let ws=

XLSX.utils.json_to_sheet(datos)

ws["!cols"]=[

{wch:30},

{wch:20},

{wch:20},

{wch:25}

]

let wb=

XLSX.utils.book_new()

XLSX.utils.book_append_sheet(

wb,

ws,

"Registro"

)

let fecha=
new Date()

let nombreArchivo=

`Registro_${
fecha.getFullYear()
}-${
String(fecha.getMonth()+1)
.padStart(2,"0")
}-${
String(fecha.getDate())
.padStart(2,"0")
}.xlsx`

XLSX.writeFile(

wb,

nombreArchivo

)

}

/* NUEVA PLANILLA */

function nuevaPlanilla(){

if(

!confirm(
"¿Deseas eliminar todos los registros y comenzar una nueva planilla?"
)

){

return

}

localStorage.removeItem("registros")

paso="equipo"

equipo=""
curso=""

document.getElementById("resultado")
.innerText=
"🗑 Nueva planilla creada"

document.getElementById("btnEquipo")
.style.display="inline-block"

document.getElementById("btnSiguiente")
.style.display="none"

cargarHistorial()

}

/* FINALIZAR */

function finalizarRegistro(){

if(

!confirm(
"¿Exportar Excel y limpiar registros?"
)

){

return

}

exportarExcel()

localStorage.removeItem("registros")

paso="equipo"

equipo=""
curso=""

document.getElementById("resultado")
.innerText=""

document.getElementById("btnEquipo")
.style.display="inline-block"

document.getElementById("btnSiguiente")
.style.display="none"

cargarHistorial()

}

/* AUTO LOGIN */

window.onload=()=>{

prepararCamara()

if(

localStorage.getItem("usuario")

){

iniciarApp()

}

}
