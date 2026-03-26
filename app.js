// CONFIGURACIÓN CENTRAL
const API_URL = "https://tu-app-en-railway.up.railway.app"; // CAMBIA ESTO POR TU URL REAL
let usuario = JSON.parse(localStorage.getItem('yak_user')) || null;
let equipo = [];
let tabActual = 'harem';
let invTimerInterval = null;

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

    ['harem', 'mundo', 'invocacion'].forEach(t => document.getElementById(`tab-${t}`).classList.add('hidden'));
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
    const res = await fetch(`${API_URL}/harem/${usuario.id}`);
    const pjs = await res.json();
    const container = document.getElementById('harem-container');
    container.innerHTML = "";

    pjs.forEach(pj => {
        const card = document.createElement('div');
        card.className = "bg-gray-900 rounded-2xl border border-gray-800 p-2 cursor-pointer hover:border-indigo-500 transition-all";
        card.onclick = () => abrirDetalles(pj);
        card.innerHTML = `
            <img src="${pj.imagen}" class="w-full h-24 object-contain mb-2">
            <h3 class="hud-text-xs font-black truncate text-center">${pj.nombre}</h3>
            <div class="w-full bg-gray-800 h-1 mt-1 rounded-full"><div class="bg-indigo-500 h-full" style="width:${pj.stamina}%"></div></div>
        `;
        container.appendChild(card);
    });
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
