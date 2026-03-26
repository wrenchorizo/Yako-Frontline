// CONFIGURACIÓN CENTRAL
const API_URL = "https://tu-app-en-railway.up.railway.app"; // Reemplaza con tu URL de Railway
let usuario = JSON.parse(localStorage.getItem('yak_user')) || null;
let equipo = [];
let tabActual = 'harem';

// --- SISTEMA DE NOTIFICACIONES (Z-INDEX ALTO Y TAMAÑO REDUCIDO) ---
function notificar(msj, tipo = 'info') {
    const container = document.getElementById('notificador');
    const div = document.createElement('div');
    div.className = `p-3 rounded-lg border shadow-xl animate-bounce-in hud-text-sm font-bold uppercase tracking-wider flex items-center gap-2 pointer-events-auto min-w-[200px] 
        ${tipo === 'error' ? 'bg-red-950 border-red-500 text-red-200' : 'bg-gray-900 border-indigo-500 text-indigo-100'}`;
    
    div.innerHTML = `<i class="fas ${tipo === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i> ${msj}`;
    container.appendChild(div);
    setTimeout(() => div.remove(), 4000);
}

// --- AUTENTICACIÓN ---
async function handleAuth(type) {
    const user = document.getElementById('auth-user').value;
    const pass = document.getElementById('auth-pass').value;
    if(!user || !pass) return notificar("Faltan datos", "error");

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
            document.getElementById('auth-screen').classList.add('hidden');
            document.getElementById('game-screen').classList.remove('hidden');
            notificar(`Bienvenido, ${usuario.username}`);
            cargarDatos();
        } else {
            notificar("¡Registro exitoso! Ya puedes entrar.");
        }
    } catch (e) { notificar(e.message, "error"); }
}

// --- CARGA DE DATOS ---
async function cargarDatos() {
    if(!usuario) return;
    const resUser = await fetch(`${API_URL}/perfil/${usuario.id}`);
    const dataUser = await resUser.json();
    
    // Actualizar HUD (Sin palabra "Comandante")
    document.getElementById('user-display').innerText = dataUser.username.toUpperCase();
    document.getElementById('user-money').innerText = `$${dataUser.balance.toLocaleString()}`;
    
    cargarHarem();
    verificarEstadoMision(dataUser);
}

async function cargarHarem() {
    const res = await fetch(`${API_URL}/harem/${usuario.id}`);
    const pjs = await res.json();
    const container = document.getElementById('harem-container');
    container.innerHTML = "";

    pjs.forEach(pj => {
        const card = document.createElement('div');
        // HUD de tarjeta reducido
        card.className = "gacha-card bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 hover:border-indigo-500 transition-all cursor-pointer group";
        card.onclick = () => abrirDetalles(pj);
        card.innerHTML = `
            <div class="relative h-32 md:h-40 bg-black/20 overflow-hidden">
                <img src="${pj.imagen}" class="w-full h-full object-contain group-hover:scale-110 transition-transform">
                <div class="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black text-[10px] font-black italic">
                    NV. ${pj.nivel}
                </div>
            </div>
            <div class="p-2">
                <h3 class="hud-text-sm font-black truncate uppercase tracking-tighter">${pj.nombre}</h3>
                <div class="w-full bg-gray-800 h-1 mt-1 rounded-full overflow-hidden">
                    <div class="bg-indigo-500 h-full" style="width: ${pj.stamina}%"></div>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// --- DETALLES Y ENTRENAMIENTO ---
let pjSeleccionado = null;
function abrirDetalles(pj) {
    pjSeleccionado = pj;
    document.getElementById('det-img').src = pj.imagen;
    document.getElementById('det-nombre').innerText = pj.nombre;
    document.getElementById('det-fuente').innerText = pj.fuente;
    document.getElementById('det-nivel').innerText = pj.nivel;
    document.getElementById('det-valor').innerText = `$${pj.valor}`;
    // Cambio de género: Hombre/Mujer
    document.getElementById('det-genero').innerText = pj.genero === "Mujer" ? "Mujer" : "Hombre";
    
    const btnEquipo = document.getElementById('btn-toggle-equipo');
    const estaEnEquipo = equipo.find(p => p._id === pj._id);
    btnEquipo.innerText = estaEnEquipo ? "Quitar del Equipo" : "Añadir al Equipo";
    
    document.getElementById('modal-detalles').classList.remove('hidden');
}

function cerrarDetalles() {
    document.getElementById('modal-detalles').classList.add('hidden');
    pjSeleccionado = null;
}

async function entrenarPj() {
    try {
        const res = await fetch(`${API_URL}/subir-nivel/${pjSeleccionado._id}`, { method: 'PUT' });
        const data = await res.json();
        if(data.error) throw new Error(data.error);
        
        notificar(`${pjSeleccionado.nombre} ha subido de nivel`);
        abrirDetalles(data.pj); // Recargar modal
        cargarDatos();
    } catch (e) { notificar(e.message, "error"); }
}

// --- SISTEMA DE EQUIPO Y AVENTURA ---
function toggleEquipo() {
    const index = equipo.findIndex(p => p._id === pjSeleccionado._id);
    if(index > -1) {
        equipo.splice(index, 1);
        notificar(`${pjSeleccionado.nombre} fuera del equipo`);
    } else {
        if(equipo.length >= 3) return notificar("Máximo 3 miembros", "error");
        equipo.push(pjSeleccionado);
        notificar(`${pjSeleccionado.nombre} ahora es parte del equipo`); // Mensaje sin género
    }
    actualizarSlots();
    cerrarDetalles();
}

function actualizarSlots() {
    const slots = document.getElementById('slots-equipo').children;
    for(let i=0; i<3; i++) {
        if(equipo[i]) {
            slots[i].innerHTML = `<img src="${equipo[i].imagen}" class="w-full h-full object-cover rounded-2xl border border-indigo-500">`;
        } else {
            slots[i].innerHTML = (i+1);
        }
    }
}

async function iniciarExploracion() {
    if(equipo.length === 0) return notificar("Equipo vacío", "error");
    try {
        const res = await fetch(`${API_URL}/explorar`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ userId: usuario.id, pjsSeleccionados: equipo.map(p => p._id) })
        });
        const data = await res.json();
        if(data.error) throw new Error(data.error);
        
        equipo = [];
        actualizarSlots();
        cargarDatos();
    } catch (e) { notificar(e.message, "error"); }
}

function verificarEstadoMision(user) {
    const inactivo = document.getElementById('mundo-inactivo');
    const activo = document.getElementById('mundo-activo');
    
    if(user.finExploracion) {
        inactivo.classList.add('hidden');
        activo.classList.remove('hidden');
        iniciarTimer(new Date(user.finExploracion));
    } else {
        inactivo.classList.remove('hidden');
        activo.classList.add('hidden');
    }
}

function iniciarTimer(fin) {
    const interval = setInterval(async () => {
        const ahora = new Date();
        const diff = fin - ahora;
        if(diff <= 0) {
            clearInterval(interval);
            reclamarRecompensa();
        } else {
            const m = Math.floor(diff/60000);
            const s = Math.floor((diff%60000)/1000);
            document.getElementById('timer-mision').innerText = `${m}:${s < 10 ? '0'+s : s}`;
        }
    }, 1000);
}

async function reclamarRecompensa() {
    const res = await fetch(`${API_URL}/mision/reclamar/${usuario.id}`, { method: 'POST' });
    const data = await res.json();
    notificar(`Misión completada: Ganaste $${data.ganancia}`); // Ahora dice cuánto ganaste
    cargarDatos();
}

// --- SISTEMA DE INVOCACIÓN (20 MIN + ESTADO RECLAMADO) ---
async function intentarInvocacion() {
    try {
        const res = await fetch(`${API_URL}/invocar`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ userId: usuario.id })
        });
        const data = await res.json();
        if(data.error) throw new Error(data.error);

        // Mostrar resultado en modal
        document.getElementById('inv-img').src = data.imagen;
        document.getElementById('inv-nombre').innerText = data.nombre;
        document.getElementById('inv-fuente').innerText = data.fuente;
        
        const dispLabel = document.getElementById('inv-disponibilidad');
        if(data.estado === "Ya reclamado") {
            dispLabel.innerText = "ESTADO: YA RECLAMADO";
            dispLabel.className = "font-bold uppercase hud-text-md tracking-wider text-red-500";
        } else {
            dispLabel.innerText = "ESTADO: ¡NUEVO!";
            dispLabel.className = "font-bold uppercase hud-text-md tracking-wider text-green-400";
        }

        document.getElementById('modal-invocacion').classList.remove('hidden');
        cargarDatos();
    } catch (e) { notificar(e.message, "error"); }
}

function cerrarInvocacion() {
    document.getElementById('modal-invocacion').classList.add('hidden');
}

// --- NAVEGACIÓN ---
function changeTab(tab, btn) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active-tab', 'text-white'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.add('text-gray-500'));
    btn.classList.add('active-tab', 'text-white');
    btn.classList.remove('text-gray-500');

    document.getElementById('tab-harem').classList.add('hidden');
    document.getElementById('tab-mundo').classList.add('hidden');
    document.getElementById('tab-invocacion').classList.add('hidden');

    document.getElementById(`tab-${tab}`).classList.remove('hidden');
    tabActual = tab;
}

function logout() {
    localStorage.clear();
    location.reload();
}

// INICIO
if(usuario) {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    cargarDatos();
}
