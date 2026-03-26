const API_URL = "https://yako-production.up.railway.app"; 
let currentUser = JSON.parse(localStorage.getItem('yakUserData'));

// --- SISTEMA DE COOLDOWN ---
let intervalos = {};

function checkCooldown(ultimaFecha, btnId, timerId, originalText) {
    const btn = document.getElementById(btnId);
    const timerText = document.getElementById(timerId);
    if (!btn || !timerText || !ultimaFecha) return;

    if (intervalos[btnId]) clearInterval(intervalos[btnId]);

    const actualizar = () => {
        const ahora = new Date();
        const proxima = new Date(new Date(ultimaFecha).getTime() + 3600000);
        const diferencia = proxima - ahora;

        if (diferencia > 0) {
            btn.disabled = true;
            const mins = Math.floor((diferencia % 3600000) / 60000);
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

// --- FUNCIONES GENERALES ---
function changeTab(tabName, btn) {
    document.querySelectorAll('main > section').forEach(s => s.classList.add('hidden'));
    document.getElementById(`tab-${tabName}`).classList.remove('hidden');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active-tab'));
    btn.classList.add('active-tab');
}

async function actualizarDinero() {
    if (!currentUser) return;
    try {
        const res = await fetch(`${API_URL}/perfil/${currentUser.id}`);
        const data = await res.json();
        document.getElementById('user-money').innerText = `$${data.dinero}`;
        
        checkCooldown(data.ultimaExploracion, 'btn-explorar', 'cooldown-timer', '⚔️ INICIAR EXPEDICIÓN');
        checkCooldown(data.ultimaInvocacion, 'btn-invocar', 'invocar-timer', '🌀 INVOCAR PERSONAJE');
    } catch(e) { console.error("Error perfil"); }
}

async function cargarHarem() {
    const contenedor = document.getElementById('harem-container');
    const res = await fetch(`${API_URL}/harem/${currentUser.id}`);
    const pjs = await res.json();
    contenedor.innerHTML = pjs.map(pj => `
        <div class="gacha-card bg-gray-800/40 p-3 rounded-2xl border border-gray-800 flex flex-col">
            <img src="${pj.imagen}" class="w-full h-32 object-contain mb-3 bg-black/20 rounded-xl">
            <h2 class="font-black text-[10px] text-center uppercase italic truncate">${pj.nombre}</h2>
            <div class="flex justify-between text-[10px] bg-black/60 p-2 rounded-lg my-3">
                <span class="text-yellow-500 font-bold">LV.${pj.nivel || 1}</span>
                <span class="text-green-400 font-bold">$${pj.valor || 1000}</span>
            </div>
            <button onclick="entrenar('${pj._id}')" class="bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/50 py-2 rounded-xl text-[10px] font-black transition-all">
                ENTRENAR ($500)
            </button>
        </div>
    `).join('');
}

// --- ACCIONES ---
async function handleAuth(type) {
    const username = document.getElementById('auth-user').value.trim();
    const password = document.getElementById('auth-pass').value.trim();
    if (!username || !password) return alert("Faltan datos");

    const res = await fetch(`${API_URL}/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (data.error) return alert(data.error);

    if (type === 'login') {
        currentUser = data;
        localStorage.setItem('yakUserData', JSON.stringify(data));
        location.reload();
    } else { alert("¡Creado!"); }
}

async function invocar() {
    try {
        const res = await fetch(`${API_URL}/invocar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id })
        });
        const data = await res.json();
        if (data.error) return alert(data.error);

        document.getElementById('modal-imagen').src = data.imagen;
        document.getElementById('modal-nombre').innerText = data.nombre;
        document.getElementById('modal-serie').innerText = data.fuente;
        document.getElementById('modal-container').classList.remove('opacity-0', 'pointer-events-none');
        
        actualizarDinero();
    } catch(e) { alert("Error"); }
}

async function iniciarExploracion() {
    const btnBox = document.getElementById('controles-mundo');
    const espera = document.getElementById('pantalla-espera');
    btnBox.classList.add('hidden');
    espera.classList.remove('hidden');

    const res = await fetch(`${API_URL}/explorar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
    });
    const data = await res.json();

    setTimeout(() => {
        espera.classList.add('hidden');
        btnBox.classList.remove('hidden');
        if (data.error) return alert(data.error);
        
        alert(data.mensaje + (data.pj ? ` ¡Y encontraste a ${data.pj.nombre}!` : ""));
        actualizarDinero();
    }, 3000);
}

async function entrenar(id) {
    const res = await fetch(`${API_URL}/subir-nivel/${id}`, { method: 'PUT' });
    const data = await res.json();
    if (data.error) return alert(data.error);
    cargarHarem();
    actualizarDinero();
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
