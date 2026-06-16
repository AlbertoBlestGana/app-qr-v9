let docente=""
let cursoGeneral=""

let nombre=""
let equipo=""

let qr=null
let scanning=false
let cooldown=false

let modoEscaneo="equipo"

const beep =
new Audio(
"https://www.soundjay.com/buttons/beep-07.wav"
)

/* SERVICE WORKER */

if("serviceWorker" in navigator){

navigator.serviceWorker.register(
"service-worker.js"
)

}

/* PERMISO CAMARA */

async function prepararCamara(){

try{

const stream =
await navigator.mediaDevices.getUserMedia({
video:true
})

stream.getTracks().forEach(track=>{
track.stop()
})

}catch(e){

console.log(e)

}

}

/* DOCENTE */

function guardarDocente(){

let valor =

document
.getElementById("docente")
.value
.trim()

if(!valor){

alert(
"Ingrese el nombre del docente"
)

return

}

docente=valor

localStorage.setItem(
"docente",
docente
)

alert(
"Docente guardado"
)

}

/* CURSO */

function escanearCurso(){

modoEscaneo="curso"

document.getElementById(
"resultado"
).innerText=
"Escanea el código del curso"

iniciarEscaneo()

}

/* EQUIPO */

function escanearEquipo(){

modoEscaneo="equipo"

document.getElementById(
"resultado"
).innerText=
"Escanea el código del equipo"

iniciarEscaneo()

}
/* LOGIN ESTUDIANTE */

function guardarUsuario(){

if(!localStorage.getItem("docente")){

alert(
"Primero debe registrar al docente"
)

return

}

if(!localStorage.getItem("cursoGeneral")){

alert(
"Primero debe escanear el curso"
)

return

}

let nombreCompleto =

document
.getElementById("nombreCompleto")
.value
.trim()

if(!nombreCompleto){

alert(
"Complete el nombre"
)

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

/* INICIAR APP */

function iniciarApp(){

const user =

JSON.parse(
localStorage.getItem("usuario")
)

if(!user)return

nombre=user.nombreCompleto

cursoGeneral=
localStorage.getItem("cursoGeneral") || ""

docente=
localStorage.getItem("docente") || ""

document.getElementById("login")
.style.display="none"

document.getElementById("app")
.style.display="block"

document.getElementById("usuario")
.innerText=

`👤 ${nombre} | 🎓 ${cursoGeneral}`

cargarHistorial()

}
/* ESCANEO */

async function iniciarEscaneo(){

if(scanning)return

document.getElementById(
"reader"
).style.display="block"

document.getElementById(
"estadoCamara"
).innerText="📷 Cámara activa"

console.log("Botón presionado")

console.log(
"Html5Qrcode:",
typeof Html5Qrcode
)

console.log(
"Reader:",
document.getElementById("reader")
)

try{

if(typeof Html5Qrcode==="undefined"){

alert(
"Html5Qrcode no cargó"
)

return

}

if(!document.getElementById("reader")){

alert(
"No existe reader"
)

return

}

if(!qr){

qr = new Html5Qrcode("reader")

}

await qr.start(

{
facingMode:"environment"
},

{
fps:10,
qrbox:{
width:250,
height:250
}
},

onScan

)

scanning=true

}catch(error){

console.error(
"ERROR CAMARA:",
error
)

alert(
"No fue posible abrir la cámara:\n"+
error
)

document.getElementById(
"estadoCamara"
).innerText="📷 Cámara cerrada"

}

}

async function detenerEscaneo(){

try{

if(qr && scanning){

await qr.stop()

}

}catch(error){

console.error(error)

}

scanning=false

document.getElementById(
"estadoCamara"
).innerText="📷 Cámara cerrada"

}
/* SCAN */

async function onScan(text){

if(cooldown)return

cooldown=true

beep.play()

await detenerEscaneo()

if(modoEscaneo==="curso"){

cursoGeneral=text

localStorage.setItem(
"cursoGeneral",
cursoGeneral
)

document.getElementById(
"cursoActual"
).innerText=

"🎓 "+cursoGeneral

document.getElementById(
"resultado"
).innerText=

"✅ Curso registrado"

}else{

equipo=text

guardarRegistro()

document.getElementById(
"resultado"
).innerText=

`✅ Equipo registrado:
${equipo}`

}

setTimeout(()=>{

cooldown=false

},600)

}

/* GUARDAR REGISTRO */

function guardarRegistro(){

let registros =

JSON.parse(
localStorage.getItem("registros")
) || []

registros.push({

docente:docente,

nombre:nombre,

equipo:equipo,

curso:cursoGeneral,

fecha:
new Date()
.toLocaleString()

})

localStorage.setItem(
"registros",
JSON.stringify(registros)
)

cargarHistorial()

}
/* HISTORIAL */

function cargarHistorial(){

let registros =

JSON.parse(
localStorage.getItem("registros")
) || []

let html=""

registros
.slice()
.reverse()
.forEach(r=>{

html+=`

<div style="
display:flex;
justify-content:space-between;
align-items:center;
padding:8px;
border-bottom:1px solid #ddd;
">

<span>

👤 ${r.nombre}
 |
 📦 ${r.equipo}
 |
 🎓 ${r.curso}

</span>

<button

onclick="eliminarRegistro('${r.fecha}')"

style="
background:#dc3545;
padding:6px 10px;
width:auto;
"

>

🗑

</button>

</div>

`

})

document.getElementById(
"historial"
).innerHTML=html

document.getElementById(
"contador"
).innerText=

"Escaneados: "+registros.length

}

function eliminarRegistro(fecha){

if(
!confirm("¿Eliminar este registro?")
){
return
}

let registros =

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
function siguienteEstudiante(){

localStorage.removeItem(
"usuario"
)

document.getElementById(
"nombreCompleto"
).value=""

document.getElementById(
"resultado"
).innerText=""

document.getElementById(
"app"
).style.display="none"

document.getElementById(
"login"
).style.display="block"

}

function deshacer(){

let registros=

JSON.parse(
localStorage.getItem("registros")
)||[]

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

function exportarExcel(){

let registros=

JSON.parse(
localStorage.getItem("registros")
)||[]

if(!registros.length){

alert("No hay registros")
return

}

let ws=XLSX.utils.aoa_to_sheet([

["COLEGIO ALBERTO BLEST GANA"],
[],
["REGISTRO DE USO DE EQUIPOS"],
[],
["Profesor a cargo",docente],
["Curso",cursoGeneral],
["Fecha exportación",
new Date().toLocaleString()],
[],
["Nombre","Equipo","Curso","Fecha"]

])

registros.forEach(r=>{

XLSX.utils.sheet_add_aoa(

ws,

[[
r.nombre,
r.equipo,
r.curso,
r.fecha
]],

{origin:-1}

)

})

let wb=
XLSX.utils.book_new()

XLSX.utils.book_append_sheet(
wb,
ws,
"Registro"
)

XLSX.writeFile(
wb,
"Registro.xlsx"
)

}

function nuevaPlanilla(){

if(
!confirm(
"¿Eliminar todos los datos?"
)
){
return
}

localStorage.clear()

location.reload()

}

window.onload=()=>{

prepararCamara()

docente=
localStorage.getItem(
"docente"
)||""

cursoGeneral=
localStorage.getItem(
"cursoGeneral"
)||""

if(docente){

document.getElementById(
"docente"
).value=docente

}

if(cursoGeneral){

document.getElementById(
"cursoActual"
).innerText=
"🎓 "+cursoGeneral

}

if(
localStorage.getItem(
"usuario"
)
){

iniciarApp()

}

}
