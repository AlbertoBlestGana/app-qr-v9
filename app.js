let docente=""
let cursoGeneral=""
 
let nombre=""
let equipo=""
 
let qr=null
let scanning=false
let cooldown=false
 
let modoEscaneo="equipo"
 
/* SONIDO (generado en el navegador, sin depender de otra web) */
 
let audioCtx=null
 
function beep(){
 
try{
 
audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)()
 
const osc = audioCtx.createOscillator()
const gain = audioCtx.createGain()
 
osc.frequency.value = 880
gain.gain.value = 0.2
 
osc.connect(gain)
gain.connect(audioCtx.destination)
 
osc.start()
osc.stop(audioCtx.currentTime + 0.15)
 
}catch(e){
 
console.log("Sin sonido:", e)
 
}
 
}
 
/* SERVICE WORKER */
 
if("serviceWorker" in navigator){
 
navigator.serviceWorker.register(
"service-worker.js"
)
 
}
 
/* UTILIDAD: evitar que un QR con comillas o < > rompa el historial */
 
function escaparHTML(txt){
 
return String(txt)
.replace(/&/g,"&amp;")
.replace(/</g,"&lt;")
.replace(/>/g,"&gt;")
.replace(/"/g,"&quot;")
.replace(/'/g,"&#39;")
 
}
 
function leerRegistros(){
 
let registros =
JSON.parse(localStorage.getItem("registros")) || []
 
// Registros antiguos no tenían id: se les asigna uno
let cambiado=false
 
registros.forEach((r,i)=>{
 
if(!r.id){
r.id = Date.now() + "-" + i + "-" + Math.random().toString(36).slice(2,7)
cambiado=true
}
 
})
 
if(cambiado){
localStorage.setItem("registros",JSON.stringify(registros))
}
 
return registros
 
}
 
/* DOCENTE */
 
function guardarDocente(){
 
let valor =
document.getElementById("docente").value.trim()
 
if(!valor){
 
alert("Ingrese el nombre del docente")
return
 
}
 
docente=valor
 
localStorage.setItem("docente",docente)
 
alert("Docente guardado")
 
}
 
/* CURSO */
 
function escanearCurso(){
 
modoEscaneo="curso"
 
document.getElementById("resultado").innerText=
"Escanea el código del curso"
 
iniciarEscaneo()
 
}
 
/* EQUIPO */
 
function escanearEquipo(){
 
modoEscaneo="equipo"
 
document.getElementById("resultado").innerText=
"Escanea el código del equipo"
 
iniciarEscaneo()
 
}
 
/* LOGIN ESTUDIANTE */
 
function guardarUsuario(){
 
if(!localStorage.getItem("docente")){
 
alert("Primero debe registrar al docente")
return
 
}
 
if(!localStorage.getItem("cursoGeneral")){
 
alert("Primero debe escanear el curso")
return
 
}
 
let nombreCompleto =
document.getElementById("nombreCompleto").value.trim()
 
if(!nombreCompleto){
 
alert("Complete el nombre")
return
 
}
 
localStorage.setItem(
"usuario",
JSON.stringify({ nombreCompleto })
)
 
iniciarApp()
 
}
 
/* INICIAR APP */
 
function iniciarApp(){
 
const user =
JSON.parse(localStorage.getItem("usuario"))
 
if(!user)return
 
nombre=user.nombreCompleto
 
cursoGeneral=localStorage.getItem("cursoGeneral") || ""
 
docente=localStorage.getItem("docente") || ""
 
document.getElementById("login").style.display="none"
document.getElementById("app").style.display="block"
document.getElementById("panelHistorial").style.display="block"
 
document.getElementById("usuario").innerText=
`👤 ${nombre} | 🎓 ${cursoGeneral}`
 
document.getElementById("resultado").innerText=""
 
cargarHistorial()
 
}
 
/* ESCANEO */
 
async function iniciarEscaneo(){
 
if(scanning)return
 
if(typeof Html5Qrcode==="undefined"){
 
alert("No se pudo cargar el lector QR. Revise la conexión a internet y recargue la página.")
return
 
}
 
if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
 
alert("Este navegador no permite usar la cámara. La página debe abrirse con https:// (o en localhost).")
return
 
}
 
// Mostrar la zona ANTES de iniciar: el lector necesita un contenedor visible con tamaño
document.getElementById("zonaEscaneo").style.display="block"
 
document.getElementById("estadoCamara").innerText="📷 Abriendo cámara..."
 
try{
 
if(!qr){
 
qr = new Html5Qrcode("reader")
 
}
 
await qr.start(
 
{ facingMode:"environment" },
 
{
fps:10,
// Cuadro de lectura proporcional al tamaño real del visor
qrbox:(ancho,alto)=>{
 
const lado = Math.max(
120,
Math.floor(Math.min(ancho,alto)*0.7)
)
 
return { width:lado, height:lado }
 
}
},
 
onScan
 
)
 
scanning=true
 
document.getElementById("estadoCamara").innerText="📷 Cámara activa"
 
document.getElementById("zonaEscaneo").scrollIntoView({behavior:"smooth",block:"center"})
 
}catch(error){
 
console.error("ERROR CAMARA:",error)
 
alert("No fue posible abrir la cámara:\n"+error)
 
document.getElementById("zonaEscaneo").style.display="none"
document.getElementById("estadoCamara").innerText="📷 Cámara cerrada"
 
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
 
document.getElementById("zonaEscaneo").style.display="none"
document.getElementById("estadoCamara").innerText="📷 Cámara cerrada"
 
}
 
/* SCAN */
 
async function onScan(text){
 
if(cooldown)return
 
cooldown=true
 
beep()
 
await detenerEscaneo()
 
text=text.trim()
 
if(modoEscaneo==="curso"){
 
cursoGeneral=text
 
localStorage.setItem("cursoGeneral",cursoGeneral)
 
document.getElementById("cursoActual").innerText=
"🎓 "+cursoGeneral
 
document.getElementById("resultado").innerText=
"✅ Curso registrado"
 
}else{
 
equipo=text
 
guardarRegistro()
 
document.getElementById("resultado").innerText=
`✅ Equipo registrado:
${equipo}`
 
}
 
setTimeout(()=>{
 
cooldown=false
 
},600)
 
}
 
/* GUARDAR REGISTRO */
 
function guardarRegistro(){
 
let registros = leerRegistros()
 
registros.push({
 
id: Date.now()+"-"+Math.random().toString(36).slice(2,7),
 
docente:docente,
 
nombre:nombre,
 
equipo:equipo,
 
curso:cursoGeneral,
 
fecha:new Date().toLocaleString()
 
})
 
localStorage.setItem("registros",JSON.stringify(registros))
 
cargarHistorial()
 
}
 
/* HISTORIAL */
 
function cargarHistorial(){
 
let registros = leerRegistros()
 
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
gap:8px;
padding:8px;
border-bottom:1px solid #ddd;
">
 
<span>
 
👤 ${escaparHTML(r.nombre)}
 |
 📦 ${escaparHTML(r.equipo)}
 |
 🎓 ${escaparHTML(r.curso)}
 
</span>
 
<button
 
onclick="eliminarRegistro('${escaparHTML(r.id)}')"
 
style="
background:#dc3545;
padding:6px 10px;
width:auto;
margin-top:0;
"
 
>
 
🗑
 
</button>
 
</div>
 
`
 
})
 
document.getElementById("historial").innerHTML=html
 
document.getElementById("contador").innerText=
"Escaneados: "+registros.length
 
}
 
function eliminarRegistro(id){
 
if(!confirm("¿Eliminar este registro?")){
return
}
 
let registros = leerRegistros().filter(r=>r.id!==id)
 
localStorage.setItem("registros",JSON.stringify(registros))
 
cargarHistorial()
 
}
 
async function siguienteEstudiante(){
 
await detenerEscaneo()
 
localStorage.removeItem("usuario")
 
document.getElementById("nombreCompleto").value=""
document.getElementById("resultado").innerText=""
 
document.getElementById("app").style.display="none"
document.getElementById("panelHistorial").style.display="none"
document.getElementById("login").style.display="block"
 
}
 
function deshacer(){
 
let registros = leerRegistros()
 
if(!registros.length){
 
alert("Nada que deshacer")
return
 
}
 
registros.pop()
 
localStorage.setItem("registros",JSON.stringify(registros))
 
cargarHistorial()
 
}
 
function exportarExcel(){
 
if(typeof XLSX==="undefined"){
 
alert("No se pudo cargar la librería de Excel. Revise la conexión a internet y recargue la página.")
return
 
}
 
let registros = leerRegistros()
 
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
["Fecha exportación",new Date().toLocaleString()],
[],
["Nombre","Equipo","Curso","Fecha"]
 
])
 
registros.forEach(r=>{
 
XLSX.utils.sheet_add_aoa(
ws,
[[ r.nombre, r.equipo, r.curso, r.fecha ]],
{origin:-1}
)
 
})
 
ws["!cols"]=[{wch:30},{wch:20},{wch:15},{wch:22}]
 
let wb=XLSX.utils.book_new()
 
XLSX.utils.book_append_sheet(wb,ws,"Registro")
 
XLSX.writeFile(wb,"Registro.xlsx")
 
}
 
async function nuevaPlanilla(){
 
if(!confirm("¿Eliminar todos los datos?")){
return
}
 
await detenerEscaneo()
 
localStorage.clear()
 
location.reload()
 
}
 
window.onload=()=>{
 
docente=localStorage.getItem("docente")||""
 
cursoGeneral=localStorage.getItem("cursoGeneral")||""
 
if(docente){
 
document.getElementById("docente").value=docente
 
}
 
if(cursoGeneral){
 
document.getElementById("cursoActual").innerText=
"🎓 "+cursoGeneral
 
}
 
if(localStorage.getItem("usuario")){
 
iniciarApp()
 
}
 
}
 
