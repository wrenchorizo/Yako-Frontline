const API_URL = "https://yako-production.up.railway.app";
let currentUser = JSON.parse(localStorage.getItem('yakUserData'));
let equipoSeleccionado = [];
let pjsEnMision = [];
let relojMision;

// TOAST SIN REBOTE
function toast(msg, color = "indigo") {
    const container = document.getElementById('notificador');
    const b = document.createElement('div');
    b.className = `bg-${color}-600 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase shadow-2xl border border-white/10 transition-opacity duration-500`;
    b.innerText = msg;
    container.appendChild(b);
    setTimeout(() => { b.style.opacity = '0'; setTimeout(() => b.remove(), 600); }, 3000);
}

function changeTab(tab, btn) {
    document.querySelectorAll('main > section').forEach(s => s.classList.add('hidden'));
    document.getElementById(`tab-${tab}`).classList.remove('hidden');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active-tab', 'text-white'));
    btn.classList.add('active-tab', 'text-white');
    if(tab === 'harem') cargarHarem();
}

// SELECCIÓN CON GÉNERO
function toggleSeleccion(pj) {
    if(pjsEnMision.includes(pj._id)) return toast("Está en una misión", "red");
    
    const i = equipoSeleccionado.indexOf(pj._id);
    if(i > -1) {
        equipoSeleccionado.splice(i, 1);
        toast("Removido");
    } else {
        if(equipoSeleccionado.length >= 3) return toast("Máximo 3", "red");
        const msg = pj.genero === "hembra" ? "lista" : "listo";
        toast(`${pj.nombre} ${msg} para la misión`);
        equipoSeleccionado.push(pj._id);
    }
    cargarHarem();
    actualizarSlotsMundo();
}

function actualizarSlotsMundo() {
    const slots = document.getElementById('slots-equipo').children;
    for(let i=0; i<3; i++) {
        slots[i].innerHTML = equipoSeleccionado[i] ? `<img src="${localStorage.getItem('img_'+equipoSeleccionado[i])}" class="w-full h-full object-cover rounded-2xl">` : (i+1);
    }
}

async function cargarHarem() {
    const res = await fetch(`${API_URL}/harem/${currentUser.id}`);
    const pjs = await res.json();
    const container = document.getElementById('harem-container');
    container.innerHTML = pjs.map(pj => {
        localStorage.setItem('img_'+pj._id, pj.imagen);
        const sel = equipoSeleccionado.includes(pj._id);
        const mision = pjsEnMision.includes(pj._id);
        const stColor = pj.stamina > 50 ? 'bg-green-500' : (pj.stamina > 20 ? 'bg-yellow-500' : 'bg-red-500');

        return `
            <div onclick="toggleSeleccion({_id:'${pj._id}', nombre:'${pj.nombre}', genero:'${pj.genero}'})" 
                 class="gacha-card p-3 rounded-2xl relative ${sel ? 'border-indigo-500 scale-105' : ''} ${mision ? 'opacity-40 grayscale pointer-events-none' : ''}">
                ${mision ? '<span class="absolute top-2 left-2 bg-red-600 text-[8px] px-2 py-1 rounded font-black">EN MISIÓN</span>' : ''}
                <img src="${pj.imagen}" class="w-full h-32 object-contain mb-2">
                <div class="w-full bg-gray-800 h-1 rounded-full mb-2 overflow-hidden">
                    <div class="h-full ${stColor}" style="width:${pj.stamina}%"></div>
                </div>
                <h3 class="text-[10px] font-bold text-center uppercase truncate">${pj.nombre}</h3>
                <div class="flex justify-between text-[8px] mt-2 font-mono">
                    <span class="text-yellow-500">LV ${pj.nivel}</span>
                    <span class="text-green-400">$${pj.valor}</span>
                </div>
            </div>
        `;
    }).join('');
}

async function iniciarExploracion() {
    if(equipoSeleccionado.length === 0) return toast("Elige equipo", "red");
    const res = await fetch(`${API_URL}/explorar`, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({userId: currentUser.id, pjsSeleccionados: equipoSeleccionado})
    });
    const data = await res.json();
    if(data.error) return toast(data.error, "red");
    
    pjsEnMision = [...equipoSeleccionado];
    equipoSeleccionado = [];
    toast("¡Misión iniciada!", "green");
    manejarTimer(data.retorno);
}

function manejarTimer(fin) {
    document.getElementById('mundo-inactivo').classList.add('hidden');
    document.getElementById('mundo-activo').classList.remove('hidden');
    
    clearInterval(relojMision);
    relojMision = setInterval(async () => {
        const diff = new Date(fin) - new Date();
        if(diff <= 0) {
            clearInterval(relojMision);
            const res = await fetch(`${API_URL}/mision/reclamar/${currentUser.id}`, {method:'POST'});
            const r = await res.json();
            toast(r.mensaje, "green");
            setTimeout(() => location.reload(), 2000);
        } else {
            const m = Math.floor(diff/60000);
            const s = Math.floor((diff%60000)/1000);
            document.getElementById('timer-mision').innerText = `${m}:${s < 10 ? '0'+s : s}`;
        }
    }, 1000);
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
    } else toast("Creado");
}

function logout() { localStorage.removeItem('yakUserData'); location.reload(); }

if(currentUser) {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    actualizarDatos();
    cargarHarem();
}
