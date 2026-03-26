const API_URL = "https://yako-production.up.railway.app";
let currentUser = JSON.parse(localStorage.getItem('yakUserData'));
let equipoSeleccionado = [];
let pjsEnMision = [];
let relojMision = null; // Guardará el intervalo del cronómetro
let pjSeleccionadoActual = null; // Para el modal de detalles

// --- NOTIFICACIONES ---
function toast(msg, color = "indigo") {
    const container = document.getElementById('notificador');
    const b = document.createElement('div');
    // Sin animaciones de rebote, solo un fade-in suave
    b.className = `bg-${color === 'red' ? 'red' : 'indigo'}-600 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase shadow-2xl border border-white/10 transition-all duration-500`;
    b.innerText = msg;
    container.appendChild(b);
    setTimeout(() => { b.style.opacity = '0'; setTimeout(() => b.remove(), 600); }, 3000);
}

// --- NAVEGACIÓN ---
function changeTab(tab, btn) {
    document.querySelectorAll('main > section').forEach(s => s.classList.add('hidden'));
    document.getElementById(`tab-${tab}`).classList.remove('hidden');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active-tab', 'text-white'));
    btn.classList.add('active-tab', 'text-white');
    if(tab === 'harem') cargarHarem();
}

// --- MODAL DE DETALLES Y ACCIONES ---
function abrirDetalles(pj) {
    pjSeleccionadoActual = pj;
    const modal = document.getElementById('modal-detalles');
    
    document.getElementById('det-img').src = pj.imagen;
    document.getElementById('det-nombre').innerText = pj.nombre;
    document.getElementById('det-fuente').innerText = pj.fuente;
    document.getElementById('det-nivel').innerText = `Nivel: ${pj.nivel}`;
    document.getElementById('det-valor').innerText = `Valor: $${pj.valor}`;
    document.getElementById('det-genero').innerText = `Género: ${pj.genero}`;
    
    // Cambiar texto del botón de equipo
    const btnEquipo = document.getElementById('btn-toggle-equipo');
    btnEquipo.innerText = equipoSeleccionado.includes(pj._id) ? "QUITAR DEL EQUIPO" : "AÑADIR AL EQUIPO";
    
    modal.classList.remove('hidden');
}

function cerrarDetalles() {
    document.getElementById('modal-detalles').classList.add('hidden');
    pjSeleccionadoActual = null;
}

// --- GESTIÓN DE EQUIPO ---
function toggleEquipo() {
    const pj = pjSeleccionadoActual;
    if (!pj) return;

    // BLOQUEO TOTAL: Si hay misión activa, no se puede modificar el equipo
    if (relojMision) {
        return toast("¡Misión en curso! No puedes cambiar el equipo ahora.", "red");
    }

    if (pjsEnMision.includes(pj._id)) {
        return toast("Este personaje está ocupado en la misión.", "red");
    }

    const index = equipoSeleccionado.indexOf(pj._id);
    if (index > -1) {
        equipoSeleccionado.splice(index, 1);
        toast("Removido del equipo");
    } else {
        if (equipoSeleccionado.length >= 3) return toast("Máximo 3 personajes", "red");
        
        // GÉNERO DINÁMICO: "Lista" para Mikasa y demás hembras
        const msj = pj.genero === "hembra" ? "lista" : "listo";
        toast(`${pj.nombre} ${msj} para la misión`);
        
        equipoSeleccionado.push(pj._id);
    }
    
    cerrarDetalles();
    cargarHarem();
    actualizarSlotsMundo();
}

// --- ENTRENAMIENTO (RESTAURADO) ---
async function entrenarPj() {
    const pj = pjSeleccionadoActual;
    if (!pj) return;

    try {
        const res = await fetch(`${API_URL}/subir-nivel/${pj._id}`, { method: 'PUT' });
        const data = await res.json();

        if (data.error) return toast(data.error, "red");

        toast(`¡${pj.nombre} subió al nivel ${data.pj.nivel}!`, "indigo");
        cerrarDetalles();
        actualizarDatos();
        cargarHarem();
    } catch (e) {
        toast("Error de conexión con el gimnasio", "red");
    }
}

// --- MUNDO Y EXPLORACIÓN ---
function actualizarSlotsMundo() {
    const slots = document.getElementById('slots-equipo').children;
    for(let i=0; i<3; i++) {
        const pjId = equipoSeleccionado[i];
        if (pjId) {
            const img = localStorage.getItem(`img_${pjId}`);
            slots[i].innerHTML = `<img src="${img}" class="w-full h-full object-cover rounded-2xl border-2 border-indigo-500">`;
        } else {
            slots[i].innerHTML = `<span class="text-gray-700 font-bold">${i+1}</span>`;
        }
    }
}

async function iniciarExploracion() {
    if(equipoSeleccionado.length === 0) return toast("Tu equipo está vacío", "red");
    
    const res = await fetch(`${API_URL}/explorar`, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({userId: currentUser.id, pjsSeleccionados: equipoSeleccionado})
    });
    const data = await res.json();
    
    if(data.error) return toast(data.error, "red");
    
    pjsEnMision = [...equipoSeleccionado];
    equipoSeleccionado = []; // Limpiamos selección actual
    toast("⚔️ ¡A la aventura!", "indigo");
    manejarTimer(data.retorno);
    cargarHarem();
}

function manejarTimer(fin) {
    document.getElementById('mundo-inactivo').classList.add('hidden');
    document.getElementById('mundo-activo').classList.remove('hidden');
    
    if (relojMision) clearInterval(relojMision);

    relojMision = setInterval(async () => {
        const diff = new Date(fin) - new Date();
        if(diff <= 0) {
            clearInterval(relojMision);
            relojMision = null;
            const res = await fetch(`${API_URL}/mision/reclamar/${currentUser.id}`, {method:'POST'});
            const r = await res.json();
            toast(r.mensaje, "green");
            pjsEnMision = [];
            setTimeout(() => location.reload(), 1500);
        } else {
            const m = Math.floor(diff/60000);
            const s = Math.floor((diff%60000)/1000);
            document.getElementById('timer-mision').innerText = `${m}:${s < 10 ? '0'+s : s}`;
        }
    }, 1000);
}

// --- CARGA DE DATOS ---
async function cargarHarem() {
    const res = await fetch(`${API_URL}/harem/${currentUser.id}`);
    const pjs = await res.json();
    const container = document.getElementById('harem-container');
    container.innerHTML = "";

    pjs.forEach(pj => {
        localStorage.setItem(`img_${pj._id}`, pj.imagen);
        const sel = equipoSeleccionado.includes(pj._id);
        const mision = pjsEnMision.includes(pj._id);
        const stColor = pj.stamina > 50 ? 'bg-green-500' : (pj.stamina > 20 ? 'bg-yellow-500' : 'bg-red-500');

        const card = document.createElement('div');
        card.onclick = () => abrirDetalles(pj);
        card.className = `gacha-card p-3 rounded-2xl relative bg-gray-900/50 cursor-pointer transition-all ${sel ? 'border-indigo-500 ring-2 ring-indigo-500/50' : 'border-gray-800'} ${mision ? 'opacity-40 grayscale pointer-events-none' : 'hover:scale-105'}`;
        
        card.innerHTML = `
            ${mision ? '<span class="absolute top-2 left-2 bg-red-600 text-[7px] px-2 py-1 rounded font-black z-10">OCUPADO</span>' : ''}
            <img src="${pj.imagen}" class="w-full h-32 object-contain mb-2 rounded-lg">
            <div class="w-full bg-gray-800 h-1.5 rounded-full mb-2 overflow-hidden">
                <div class="h-full ${stColor} transition-all duration-500" style="width:${pj.stamina}%"></div>
            </div>
            <h3 class="text-[10px] font-black text-center uppercase truncate">${pj.nombre}</h3>
        `;
        container.appendChild(card);
    });
}

async function actualizarDatos() {
    const res = await fetch(`${API_URL}/perfil/${currentUser.id}`);
    const u = await res.json();
    document.getElementById('user-money').innerText = `$${u.dinero}`;
    document.getElementById('user-display').innerText = u.username;
    
    if(u.finExploracion && new Date(u.finExploracion) > new Date()) {
        pjsEnMision = u.equipoExplorando;
        manejarTimer(u.finExploracion);
    }
}

// --- AUTH ---
async function handleAuth(type) {
    const username = document.getElementById('auth-user').value;
    const password = document.getElementById('auth-pass').value;
    const res = await fetch(`${API_URL}/${type}`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({username, password})
    });
    const data = await res.json();
    if(data.error) return toast(data.error, "red");
    if(type === 'login') {
        localStorage.setItem('yakUserData', JSON.stringify(data));
        location.reload();
    } else toast("¡Usuario creado!", "green");
}

function logout() { localStorage.removeItem('yakUserData'); location.reload(); }

if(currentUser) {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    actualizarDatos();
    cargarHarem();
}
