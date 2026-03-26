const API_URL = "https://yako-production.up.railway.app"; 
let currentUser = JSON.parse(localStorage.getItem('yakUserData'));

// Cambiar entre Harem, Mundo, etc.
function changeTab(tabName, btn) {
    document.querySelectorAll('main > section').forEach(s => s.classList.add('hidden'));
    document.getElementById(`tab-${tabName}`).classList.remove('hidden');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active-tab'));
    btn.classList.add('active-tab');
}

// Registro y Login
async function handleAuth(type) {
    const username = document.getElementById('auth-user').value.trim();
    const password = document.getElementById('auth-pass').value.trim();

    if (!username || !password) return alert("Escribe algo, genio");

    try {
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
            checkSession();
        } else {
            alert("¡Cuenta creada! Ya puedes entrar.");
        }
    } catch (e) { alert("El servidor está durmiendo, espera un poco."); }
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

function logout() {
    localStorage.removeItem('yakUserData');
    location.reload();
}

async function actualizarDinero() {
    try {
        const res = await fetch(`${API_URL}/perfil/${currentUser.id}`);
        const data = await res.json();
        document.getElementById('user-money').innerText = `$${data.dinero}`;
    } catch(e) { console.error("Error saldo"); }
}

async function cargarHarem() {
    const contenedor = document.getElementById('harem-container');
    const res = await fetch(`${API_URL}/harem/${currentUser.id}`);
    const pjs = await res.json();
    contenedor.innerHTML = "";
    
    pjs.forEach(pj => {
        contenedor.innerHTML += `
            <div class="gacha-card bg-gray-800/40 p-3 rounded-2xl flex flex-col border border-gray-800 hover:border-indigo-500/50 transition-all">
                <img src="${pj.imagen}" class="w-full h-32 md:h-40 object-contain mb-3 bg-black/20 rounded-xl" onerror="this.src='https://via.placeholder.com/150'">
                <h2 class="font-black text-[10px] md:text-xs text-center truncate uppercase italic">${pj.nombre}</h2>
                <div class="flex justify-between text-[10px] bg-black/60 p-2 rounded-lg my-3 font-mono">
                    <span class="text-yellow-500 font-bold">LV.${pj.nivel}</span>
                    <span class="text-green-400 font-bold">$${pj.valor}</span>
                </div>
                <button onclick="entrenar('${pj._id}')" class="bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/50 py-2 rounded-xl text-[10px] font-black transition-all">
                    ENTRENAR ($500)
                </button>
            </div>`;
    });
}

async function entrenar(id) {
    try {
        const res = await fetch(`${API_URL}/subir-nivel/${id}`, { method: 'PUT' });
        const data = await res.json();
        if (data.error) return alert(data.error);
        cargarHarem();
        actualizarDinero();
    } catch(e) { alert("Error al entrenar"); }
}

// El buscador dinámico
document.getElementById('buscador').addEventListener('input', (e) => {
    const val = e.target.value.toLowerCase();
    document.querySelectorAll('#harem-container > div').forEach(t => {
        const n = t.querySelector('h2').innerText.toLowerCase();
        t.style.display = n.includes(val) ? "flex" : "none";
    });
});

// Invocar
document.getElementById('btn-invocar').addEventListener('click', async () => {
    const btn = document.getElementById('btn-invocar');
    btn.disabled = true;
    btn.innerText = "🌀 ABRIENDO PORTAL...";

    try {
        const res = await fetch(`${API_URL}/invocar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id })
        });
        const data = await res.json();
        
        if (data.error) {
            alert(data.error);
        } else {
            document.getElementById('modal-imagen').src = data.imagen;
            document.getElementById('modal-nombre').innerText = data.nombre;
            document.getElementById('modal-serie').innerText = data.fuente;
            document.getElementById('modal-container').classList.remove('opacity-0', 'pointer-events-none');
        }
    } catch(e) { alert("Fallo místico en la invocación"); }
    
    btn.disabled = false;
    btn.innerText = "🌀 INVOCAR PERSONAJE";
});

function cerrarModal() {
    document.getElementById('modal-container').classList.add('opacity-0', 'pointer-events-none');
    cargarHarem();
}

document.addEventListener('DOMContentLoaded', checkSession);
