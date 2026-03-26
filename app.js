const API_URL = "https://yako-production.up.railway.app"; 
let currentUser = JSON.parse(localStorage.getItem('yakUserData'));
let equipoSeleccionado = []; // Para guardar IDs de los que van a explorar
let intervalos = {};

// --- SISTEMA DE NOTIFICACIONES (REEMPLAZA ALERTS) ---
function showToast(mensaje, tipo = "indigo") {
    const contenedor = document.getElementById('notificador');
    if (!contenedor) return;
    const toast = document.createElement('div');
    const color = tipo === "error" ? "red-600" : "indigo-600";
    toast.className = `bg-${color} text-white px-6 py-3 rounded-2xl font-black shadow-2xl animate-bounce border border-white/20 text-sm uppercase tracking-tighter`;
    toast.innerText = mensaje;
    contenedor.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// --- SISTEMA DE COOLDOWN ---
function checkCooldown(ultimaFecha, btnId, timerId, originalText, minutos = 60) {
    const btn = document.getElementById(btnId);
    const timerText = document.getElementById(timerId);
    if (!btn || !timerText || !ultimaFecha) return;

    if (intervalos[btnId]) clearInterval(intervalos[btnId]);

    const msObjetivo = minutos * 60 * 1000;

    const actualizar = () => {
        const ahora = new Date();
        const proxima = new Date(new Date(ultimaFecha).getTime() + msObjetivo);
        const diferencia = proxima - ahora;

        if (diferencia > 0) {
            btn.disabled = true;
            const mins = Math.floor((diferencia % (1000 * 60 * 60)) / 60000);
            const segs = Math.floor((diferencia % 60000) / 1000);
            btn.innerText = `⏳ ${mins}m ${segs}s`;
            timerText.innerText = "RECARGANDO...";
        } else {
            btn.disabled = false;
            btn.innerText = originalText;
            timerText.innerText = "¡LISTO!";
            clearInterval(intervalos[btnId]);
        }
    };
    actualizar();
    intervalos[btnId] = setInterval(actualizar, 1000);
}

// --- NAVEGACIÓN ---
function changeTab(tabName, btn) {
    document.querySelectorAll('main > section').forEach(s => s.classList.add('hidden'));
    document.getElementById(`tab-${tabName}`).classList.remove('hidden');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active-tab'));
    btn.classList.add('active-tab');
    if(tabName === 'harem') cargarHarem();
}

// --- LÓGICA DE SELECCIÓN DE EQUIPO ---
function seleccionarParaMision(id, nombre) {
    const index = equipoSeleccionado.indexOf(id);
    if (index > -1) {
        equipoSeleccionado.splice(index, 1);
        showToast(`${nombre} fuera del equipo`, "error");
    } else {
        if (equipoSeleccionado.length >= 3) return showToast("Máximo 3 personajes", "error");
        equipoSeleccionado.push(id);
        showToast(`${nombre} listo para la misión!`);
    }
    cargarHarem(); // Refrescar para mostrar quién está seleccionado
}

// --- FUNCIONES CORE ---
async function actualizarDinero() {
    if (!currentUser) return;
    try {
        const res = await fetch(`${API_URL}/perfil/${currentUser.id}`);
        const data = await res.json();
        document.getElementById('user-money').innerText = `$${data.dinero}`;
        
        // Cooldown Invocación: 60 min | Exploración: 7 min
        checkCooldown(data.ultimaInvocacion, 'btn-invocar', 'invocar-timer', '🌀 INVOCAR PERSONAJE', 60);
        checkCooldown(data.ultimaExploracion, 'btn-explorar', 'cooldown-timer', '⚔️ INICIAR EXPEDICIÓN', 7);
    } catch(e) { console.error("Error perfil"); }
}

async function cargarHarem() {
    const contenedor = document.getElementById('harem-container');
    const res = await fetch(`${API_URL}/harem/${currentUser.id}`);
    const pjs = await res.json();
    
    contenedor.innerHTML = pjs.map(pj => {
        const estaEnEquipo = equipoSeleccionado.includes(pj._id);
        const borderClass = estaEnEquipo ? 'border-indigo-500 scale-105 shadow-[0_0_15px_rgba(79,70,229,0.4)]' : 'border-gray-800';
        const staminaWidth = pj.stamina || 100;
        const staminaColor = staminaWidth > 50 ? 'bg-green-500' : (staminaWidth > 20 ? 'bg-yellow-500' : 'bg-red-500');

        return `
            <div onclick="seleccionarParaMision('${pj._id}', '${pj.nombre}')" class="gacha-card cursor-pointer bg-gray-800/40 p-3 rounded-2xl border-2 ${borderClass} flex flex-col relative overflow-hidden transition-all">
                ${estaEnEquipo ? '<span class="absolute top-2 right-2 text-indigo-400 text-[8px] font-black">EQUIPO</span>' : ''}
                <img src="${pj.imagen}" class="w-full h-32 object-contain mb-2 bg-black/20 rounded-xl">
                
                <div class="w-full bg-gray-900 h-1 rounded-full mb-2 overflow-hidden">
                    <div class="h-full ${staminaColor} transition-all" style="width: ${staminaWidth}%"></div>
                </div>

                <h2 class="font-black text-[10px] text-center uppercase italic truncate">${pj.nombre}</h2>
                <div class="flex justify-between text-[8px] bg-black/60 p-2 rounded-lg my-2 font-mono">
                    <span class="text-yellow-500">LV.${pj.nivel || 1}</span>
                    <span class="text-green-400">$${pj.valor || 1000}</span>
                </div>
                <button onclick="event.stopPropagation(); entrenar('${pj._id}')" class="bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/50 py-2 rounded-xl text-[9px] font-black transition-all">
                    ENTRENAR ($500)
                </button>
            </div>
        `;
    }).join('');
}

async function invocar() {
    try {
        const res = await fetch(`${API_URL}/invocar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id })
        });
        const data = await res.json();
        if (data.error) return showToast(data.error, "error");

        document.getElementById('modal-imagen').src = data.imagen;
        document.getElementById('modal-nombre').innerText = data.nombre;
        document.getElementById('modal-serie').innerText = data.fuente;
        document.getElementById('modal-container').classList.remove('opacity-0', 'pointer-events-none');
        
        actualizarDinero();
    } catch(e) { showToast("Error en el portal", "error"); }
}

async function iniciarExploracion() {
    if (equipoSeleccionado.length === 0) return showToast("¡Selecciona equipo en el Harem!", "error");

    const btnBox = document.getElementById('controles-mundo');
    const espera = document.getElementById('pantalla-espera');
    btnBox.classList.add('hidden');
    espera.classList.remove('hidden');

    try {
        const res = await fetch(`${API_URL}/explorar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                userId: currentUser.id,
                pjsSeleccionados: equipoSeleccionado 
            })
        });
        const data = await res.json();

        setTimeout(() => {
            espera.classList.add('hidden');
            btnBox.classList.remove('hidden');
            if (data.error) return showToast(data.error, "error");
            
            showToast(data.mensaje);
            equipoSeleccionado = []; // Limpiar equipo tras misión
            actualizarDinero();
            cargarHarem();
        }, 3000);
    } catch (e) {
        showToast("Error de conexión", "error");
        espera.classList.add('hidden');
        btnBox.classList.remove('hidden');
    }
}

async function entrenar(id) {
    const res = await fetch(`${API_URL}/subir-nivel/${id}`, { method: 'PUT' });
    const data = await res.json();
    if (data.error) return showToast(data.error, "error");
    showToast("¡Nivel subido!");
    cargarHarem();
    actualizarDinero();
}

async function handleAuth(type) {
    const username = document.getElementById('auth-user').value.trim();
    const password = document.getElementById('auth-pass').value.trim();
    if (!username || !password) return showToast("Faltan datos", "error");

    const res = await fetch(`${API_URL}/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (data.error) return showToast(data.error, "error");

    if (type === 'login') {
        currentUser = data;
        localStorage.setItem('yakUserData', JSON.stringify(data));
        location.reload();
    } else { showToast("¡Cuenta creada!"); }
}

function checkSession() {
    if (currentUser) {
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');
        document.getElementById('user-display').innerText = `MAESTRO: ${currentUser.username}`;
        actualizarDinero();
        cargarHarem();
    }
}

function logout() { localStorage.removeItem('yakUserData'); location.reload(); }
function cerrarModal() { 
    document.getElementById('modal-container').classList.add('opacity-0', 'pointer-events-none'); 
    cargarHarem(); 
}

// --- EVENTOS ---
document.getElementById('btn-invocar').addEventListener('click', invocar);
document.addEventListener('DOMContentLoaded', checkSession);

// El buscador dinámico
document.getElementById('buscador').addEventListener('input', (e) => {
    const val = e.target.value.toLowerCase();
    document.querySelectorAll('#harem-container > div').forEach(t => {
        const n = t.querySelector('h2').innerText.toLowerCase();
        t.style.display = n.includes(val) ? "flex" : "none";
    });
});
