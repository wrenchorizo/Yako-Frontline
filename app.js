// CONFIGURACIÓN CENTRAL
const API_URL = "https://yako-production.up.railway.app"; // CAMBIA ESTO POR TU URL REAL
let usuario = JSON.parse(localStorage.getItem('yak_user')) || null;
let equipo = [];
let tabActual = 'harem';
let invTimerInterval = null;
let socialTabActual = 'chat';
let chatTarget = "global";

// --- NOTIFICACIONES ---
function notificar(msj, tipo = 'info') {
    const container = document.getElementById('notificador');
    const div = document.createElement('div');
    div.className = `p-3 rounded-xl border shadow-2xl animate-bounce-in hud-text-xs font-black uppercase tracking-widest flex items-center gap-3 pointer-events-auto min-w-[220px] 
        ${tipo === 'error' ? 'bg-red-950 border-red-500 text-red-200' : 'bg-gray-900 border-indigo-500 text-indigo-100'}`;
    div.innerHTML = `<i class="fas ${tipo === 'error' ? 'fa-exclamation-triangle' : 'fa-check-circle'}"></i> ${msj}`;
    container.appendChild(div);
    setTimeout(() => { div.style.opacity = '0'; setTimeout(() => div.remove(), 500); }, 3500);
}

// --- NAVEGACIÓN Y MENÚ ---
function toggleSidebar() {
    const side = document.getElementById('sidebar');
    const texts = document.querySelectorAll('.nav-text');
    side.classList.toggle('expanded');
    texts.forEach(t => t.classList.toggle('hidden'));
}

function changeTab(tab, btn) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active-tab', 'text-white'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.add('text-gray-500'));
    btn.classList.add('active-tab', 'text-white');
    btn.classList.remove('text-gray-500');

    ['harem', 'mundo', 'invocacion', 'social'].forEach(t => document.getElementById(`tab-${t}`).classList.add('hidden'));
    document.getElementById(`tab-${tab}`).classList.remove('hidden');
    tabActual = tab;
}

// --- AUTENTICACIÓN ---
async function handleAuth(type) {
    const user = document.getElementById('auth-user').value;
    const pass = document.getElementById('auth-pass').value;
    if(!user || !pass) return notificar("Campos vacíos", "error");

    try {
        const res = await fetch(`${API_URL}/${type}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ username: user, password: pass })
        });
        const data = await res.json();
        if(data.error) throw new Error(data.error);

        if(type === 'login') {
            usuario = data;
            localStorage.setItem('yak_user', JSON.stringify(data));
            location.reload();
        } else {
            notificar("¡Cuenta creada! Inicia sesión.");
        }
    } catch (e) { notificar("Error de conexión", "error"); }
}

function confirmarLogout() { document.getElementById('modal-logout').classList.remove('hidden'); }
function cerrarModalLogout() { document.getElementById('modal-logout').classList.add('hidden'); }
function logoutReal() { localStorage.clear(); location.reload(); }

// --- CARGA DE DATOS ---
async function cargarDatos() {
    if(!usuario) return;
    try {
        const res = await fetch(`${API_URL}/perfil/${usuario.id}`);
        const data = await res.json();
        document.getElementById('user-display').innerText = data.username;
        document.getElementById('user-money').innerText = `$${data.balance.toLocaleString()}`;
        
        if(data.ultimaInvocacion) iniciarTimerInvocacion(data.ultimaInvocacion);
        verificarMision(data);
        cargarHarem();
    } catch (e) { console.error(e); }
}

async function cargarHarem() {
    try {
        const res = await fetch(`${API_URL}/harem/${usuario.id}`);
        const pjs = await res.json();
        const container = document.getElementById('harem-container');
        container.innerHTML = "";

        // SI NO HAY PERSONAJES
        if (pjs.length === 0) {
            container.innerHTML = `
                <div class="col-span-full py-20 text-center flex flex-col items-center justify-center animate-pulse">
                    <i class="fas fa-ghost text-5xl text-gray-800 mb-4"></i>
                    <h3 class="text-gray-500 font-black uppercase hud-text-sm tracking-tighter">Harem vacío</h3>
                    <p class="text-indigo-400 font-bold hud-text-xs mt-2 uppercase tracking-widest">Prueba invocar personajes en el Portal</p>
                </div>
            `;
            return;
        }

        // SI HAY PERSONAJES, SE GENERAN LAS TARJETAS
        pjs.forEach(pj => {
            const card = document.createElement('div');
            card.className = "bg-gray-900 rounded-2xl border border-gray-800 p-2 cursor-pointer hover:border-indigo-500 transition-all group";
            card.onclick = () => abrirDetalles(pj);
            card.innerHTML = `
                <div class="relative overflow-hidden rounded-xl mb-2 bg-black/20">
                    <img src="${pj.imagen}" class="w-full h-24 object-contain group-hover:scale-110 transition-transform duration-300">
                </div>
                <h3 class="hud-text-xs font-black truncate text-center uppercase tracking-tighter">${pj.nombre}</h3>
                <div class="w-full bg-gray-800 h-1 mt-2 rounded-full overflow-hidden">
                    <div class="bg-indigo-500 h-full transition-all" style="width:${pj.stamina}%"></div>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (e) {
        console.error("Error cargando el harem:", e);
    }
}

// --- DETALLES Y STAMINA ---
let pjSeleccionado = null;
function abrirDetalles(pj) {
    pjSeleccionado = pj;
    document.getElementById('det-img').src = pj.imagen;
    document.getElementById('det-nombre').innerText = pj.nombre;
    document.getElementById('det-fuente').innerText = pj.fuente;
    document.getElementById('det-nivel').innerText = pj.nivel;
    document.getElementById('det-genero').innerText = pj.genero === "Mujer" ? "MUJER" : "HOMBRE";
    document.getElementById('det-stamina-bar').style.width = `${pj.stamina}%`;
    document.getElementById('det-stamina-text').innerText = `${pj.stamina}%`;
    
    const estaEnEquipo = equipo.find(p => p._id === pj._id);
    document.getElementById('btn-toggle-equipo').innerText = estaEnEquipo ? "QUITAR DEL EQUIPO" : "AÑADIR AL EQUIPO";
    document.getElementById('modal-detalles').classList.remove('hidden');
}

function cerrarDetalles() { document.getElementById('modal-detalles').classList.add('hidden'); }

async function entrenarPj() {
    const res = await fetch(`${API_URL}/subir-nivel/${pjSeleccionado._id}`, { method: 'PUT' });
    const data = await res.json();
    if(data.error) return notificar(data.error, "error");
    notificar(`${pjSeleccionado.nombre} nivel UP!`);
    abrirDetalles(data.pj);
    cargarDatos();
}

// --- AVENTURA Y DERROTA ---
function toggleEquipo() {
    const idx = equipo.findIndex(p => p._id === pjSeleccionado._id);
    if(idx > -1) {
        equipo.splice(idx, 1);
        notificar(`${pjSeleccionado.nombre} fuera`);
    } else {
        if(equipo.length >= 3) return notificar("Máximo 3", "error");
        equipo.push(pjSeleccionado);
        notificar(`${pjSeleccionado.nombre} se unió al equipo`);
    }
    actualizarSlots();
    cerrarDetalles();
}

function actualizarSlots() {
    const slots = document.getElementById('slots-equipo').children;
    for(let i=0; i<3; i++) slots[i].innerHTML = equipo[i] ? `<img src="${equipo[i].imagen}" class="w-full h-full object-contain">` : (i+1);
}

async function iniciarExploracion() {
    if(equipo.length === 0) return notificar("Equipo vacío", "error");
    const res = await fetch(`${API_URL}/explorar`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ userId: usuario.id, pjsSeleccionados: equipo.map(p => p._id) })
    });
    const data = await res.json();
    equipo = []; actualizarSlots(); cargarDatos();
}

function verificarMision(user) {
    const inactivo = document.getElementById('mundo-inactivo');
    const activo = document.getElementById('mundo-activo');
    if(user.finExploracion) {
        inactivo.classList.add('hidden'); activo.classList.remove('hidden');
        iniciarTimerMision(new Date(user.finExploracion));
    } else {
        inactivo.classList.remove('hidden'); activo.classList.add('hidden');
    }
}

function iniciarTimerMision(fin) {
    const interval = setInterval(async () => {
        const diff = fin - new Date();
        if(diff <= 0) {
            clearInterval(interval);
            const res = await fetch(`${API_URL}/mision/reclamar/${usuario.id}`, { method: 'POST' });
            const data = await res.json();
            if(data.fueVencido) notificar("¡DERROTADOS! Regresan sin energía.", "error");
            else notificar(`¡Misión éxito! +$${data.ganancia}`);
            cargarDatos();
        } else {
            const m = Math.floor(diff/60000), s = Math.floor((diff%60000)/1000);
            document.getElementById('timer-mision').innerText = `${m}:${s < 10 ? '0'+s : s}`;
        }
    }, 1000);
}

// --- INVOCACIÓN (TIMER MM:SS) ---
function iniciarTimerInvocacion(fecha) {
    if(invTimerInterval) clearInterval(invTimerInterval);
    const btn = document.getElementById('btn-invocar');
    const label = document.getElementById('invocar-timer');
    
    invTimerInterval = setInterval(() => {
        const diff = new Date(fecha).getTime() + 1200000 - Date.now();
        if(diff <= 0) {
            clearInterval(invTimerInterval);
            btn.disabled = false; btn.innerText = "INVOCAR";
            label.classList.add('hidden');
        } else {
            btn.disabled = true;
            label.classList.remove('hidden');
            const m = Math.floor(diff/60000), s = Math.floor((diff%60000)/1000);
            btn.innerText = "RECARGANDO...";
            label.innerText = `DISPONIBLE EN ${m}:${s < 10 ? '0'+s : s}`;
        }
    }, 1000);
}

async function intentarInvocacion() {
    const res = await fetch(`${API_URL}/invocar`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ userId: usuario.id })
    });
    const data = await res.json();
    if(data.error) return notificar(data.error, "error");

    document.getElementById('inv-img').src = data.imagen;
    document.getElementById('inv-nombre').innerText = data.nombre;
    document.getElementById('inv-fuente').innerText = data.fuente;
    const disp = document.getElementById('inv-disponibilidad');
    disp.innerText = data.estado;
    disp.className = data.disponible ? "p-3 rounded-xl border border-green-500/30 text-green-400 font-black" : "p-3 rounded-xl border border-red-500/30 text-red-400 font-black";
    
    document.getElementById('modal-invocacion').classList.remove('hidden');
    cargarDatos();
}

function cerrarInvocacion() { document.getElementById('modal-invocacion').classList.add('hidden'); }

// INICIO
if(usuario) {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    cargarDatos();
}

function switchSocial(sub) {
    socialTabActual = sub;
    document.getElementById('social-chat').classList.toggle('hidden', sub !== 'chat');
    document.getElementById('social-usuarios').classList.toggle('hidden', sub !== 'usuarios');
    document.getElementById('btn-tab-chat').classList.toggle('bg-indigo-600/20', sub === 'chat');
    document.getElementById('btn-tab-users').classList.toggle('bg-indigo-600/20', sub === 'usuarios');
}

let userEnMira = null; // Usuario seleccionado en el buscador

function verPestanaSocial(tab) {
    document.getElementById('vista-amigos').classList.toggle('hidden', tab !== 'amigos');
    document.getElementById('vista-buscar').classList.toggle('hidden', tab !== 'buscar');
    document.getElementById('btn-soc-amigos').className = tab === 'amigos' ? 'flex-1 bg-indigo-600/20 py-2 rounded-xl hud-text-xs font-black' : 'flex-1 bg-gray-800 py-2 rounded-xl hud-text-xs font-black';
    document.getElementById('btn-soc-buscar').className = tab === 'buscar' ? 'flex-1 bg-indigo-600/20 py-2 rounded-xl hud-text-xs font-black' : 'flex-1 bg-gray-800 py-2 rounded-xl hud-text-xs font-black';
}

async function buscarUsuarios() {
    const q = document.getElementById('inp-search').value;
    if(q.length < 2) return;
    const res = await fetch(`${API_URL}/usuarios/buscar?q=${q}&miId=${usuario.id}`);
    const data = await res.json();
    
    document.getElementById('res-busqueda').innerHTML = data.map(u => `
        <div onclick="abrirAccionesUsuario('${u._id}', '${u.username}')" class="bg-black/40 p-4 rounded-2xl border border-white/5 flex justify-between items-center cursor-pointer hover:bg-indigo-900/20">
            <span class="font-black hud-text-sm uppercase italic">${u.username}</span>
            <i class="fas fa-chevron-right text-gray-700"></i>
        </div>
    `).join('');
}

function abrirAccionesUsuario(id, nombre) {
    userEnMira = { id, nombre };
    document.getElementById('acc-nombre').innerText = nombre;
    const container = document.getElementById('contenedor-botones-acciones');
    
    // Aquí generamos los botones que pediste
    container.innerHTML = `
        <button onclick="enviarSol('amistad')" class="bg-indigo-600 py-3 rounded-xl font-black hud-text-xs uppercase">Añadir Amigo</button>
        <button onclick="abrirMenuDuelo()" class="bg-red-600 py-3 rounded-xl font-black hud-text-xs uppercase">Retar a Duelo</button>
        <button onclick="abrirTrade()" class="bg-green-600 py-3 rounded-xl font-black hud-text-xs uppercase">Trade</button>
        <button onclick="regalarPj()" class="bg-yellow-600 py-3 rounded-xl font-black hud-text-xs uppercase">Regalar Personaje</button>
        <div class="flex gap-2 mt-4">
            <button onclick="bloquear()" class="flex-1 bg-gray-800 p-2 rounded-lg text-[9px] font-black uppercase">Bloquear</button>
            <button onclick="reportar()" class="flex-1 bg-gray-800 p-2 rounded-lg text-[9px] font-black uppercase">Reportar</button>
        </div>
    `;
    document.getElementById('modal-user-acciones').classList.remove('hidden');
}

async function enviarSol(tipo) {
    await fetch(`${API_URL}/solicitud/enviar`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ emisorId: usuario.id, emisorName: usuario.username, receptorId: userEnMira.id, tipo })
    });
    notificar(`Solicitud de ${tipo} enviada`);
    cerrarAcciones();
}

function cerrarAcciones() {
    document.getElementById('modal-user-acciones').classList.add('hidden');
}

function setChatTarget(target) {
    chatTarget = target;
    document.getElementById('chat-target-label').innerText = target === 'global' ? "Chat Global" : `Chat con ${target}`;
    switchSocial('chat');
    cargarChat();
}

async function enviarMensaje() {
    const input = document.getElementById('chat-input');
    if(!input.value) return;
    await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ emisor: usuario.username, receptor: chatTarget, texto: input.value })
    });
    input.value = "";
    cargarChat();
}

async function cargarChat() {
    const res = await fetch(`${API_URL}/chat/${usuario.username}/${chatTarget}`);
    const msjs = await res.json();
    document.getElementById('chat-container').innerHTML = msjs.map(m => `
        <div class="bg-black/40 p-2 rounded-xl border ${m.emisor === usuario.username ? 'border-indigo-500/30' : 'border-white/5'}">
            <span class="${m.emisor === usuario.username ? 'text-indigo-400' : 'text-gray-500'} font-black text-[9px] uppercase">${m.emisor}</span>
            <p class="hud-text-xs text-gray-300">${m.texto}</p>
        </div>
    `).reverse().join('');
}

async function ejecutarDuelo(oponenteId) {
    const res = await fetch(`${API_URL}/duelo`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ retadorId: usuario.id, oponenteId })
    });
    const data = await res.json();
    if(data.error) return notificar(data.error, "error");
    notificar(`¡${data.victoria ? 'GANASTE' : 'PERDISTE'}! ${data.detalle}`, data.victoria ? 'info' : 'error');
    cargarDatos();
}
// --- SISTEMA DE NOTIFICACIONES EN TIEMPO REAL ---
async function revisarSolicitudes() {
    if (!usuario) return;
    
    const res = await fetch(`${API_URL}/solicitudes/pendientes/${usuario.id}`);
    const solicitudes = await res.json();

    solicitudes.forEach(sol => {
        // Si encontramos una solicitud que no hemos mostrado
        if (!document.getElementById(`sol-${sol._id}`)) {
            mostrarPopUpSolicitud(sol);
        }
    });
}

function mostrarPopUpSolicitud(sol) {
    const box = document.createElement('div');
    box.id = `sol-${sol._id}`;
    box.className = "fixed bottom-24 left-4 right-4 bg-indigo-950 border-2 border-indigo-500 p-5 rounded-[2rem] z-[9000] animate-bounce-in shadow-2xl";
    
    let texto = "";
    let accionAceptar = "";

    // CORRECCIÓN: Usar sol.tipo en lugar de tipo
    if (sol.tipo === 'amistad') {
        texto = `<i class="fas fa-user-plus mr-2 text-indigo-400"></i><b>${sol.emisorName}</b> quiere ser tu amigo`;
        accionAceptar = `aceptarAmistad('${sol._id}')`;
    } else if (sol.tipo === 'duelo') {
        texto = `<i class="fas fa-swords mr-2 text-red-500"></i><b>${sol.emisorName}</b> te reta a un DUELO`;
        accionAceptar = `aceptarDuelo('${sol._id}')`;
    }

    box.innerHTML = `
        <p class="text-white hud-text-xs mb-4 uppercase font-black tracking-tight">${texto}</p>
        <div class="flex gap-2">
            <button onclick="${accionAceptar}" class="flex-1 bg-indigo-600 hover:bg-indigo-500 py-3 rounded-xl font-black text-[10px] text-white shadow-lg">ACEPTAR</button>
            <button onclick="rechazarSol('${sol._id}')" class="flex-1 bg-gray-800 hover:bg-gray-700 py-3 rounded-xl font-black text-[10px] text-gray-400">RECHAZAR</button>
        </div>
    `;
    document.body.appendChild(box);
}

// Ejecutar cada 5 segundos
setInterval(revisarSolicitudes, 5000);

async function aceptarAmistad(solId) {
    await fetch(`${API_URL}/solicitud/aceptar-amistad/${solId}`, { method: 'POST' });
    document.getElementById(`sol-${solId}`).remove();
    notificar("¡Ahora son amigos!");
    cargarDatos(); // Para refrescar tu lista de amigos
}

async function rechazarSol(solId) {
    // Aquí podrías hacer un fetch para borrarla, por ahora solo la quitamos de la vista
    document.getElementById(`sol-${solId}`).remove();
}
