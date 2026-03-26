const API_URL = "https://yako-production.up.railway.app"; 
let currentUser = JSON.parse(localStorage.getItem('yakUserData'));

// --- SISTEMA DE PESTAÑAS ---
function changeTab(tabName) {
    document.querySelectorAll('main > section').forEach(s => s.classList.add('hidden'));
    document.getElementById(`tab-${tabName}`).classList.remove('hidden');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active-tab'));
    event.currentTarget.classList.add('active-tab');
}

// --- AUTENTICACIÓN ---
async function handleAuth(type) {
    const username = document.getElementById('auth-user').value;
    const password = document.getElementById('auth-pass').value;

    if (!username || !password) return alert("Llena todos los campos");

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
            alert("¡Cuenta creada! Ahora puedes entrar.");
        }
    } catch (e) { alert("Error al conectar con el servidor"); }
}

function checkSession() {
    if (currentUser) {
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');
        document.getElementById('user-display').innerText = currentUser.username.toUpperCase();
        actualizarDinero();
        cargarHarem();
    }
}

function logout() {
    localStorage.removeItem('yakUserData');
    location.reload();
}

// --- LÓGICA DEL JUEGO ---
async function actualizarDinero() {
    const res = await fetch(`${API_URL}/perfil/${currentUser.id}`);
    const data = await res.json();
    document.getElementById('user-money').innerText = `$${data.dinero}`;
}

async function cargarHarem() {
    const contenedor = document.getElementById('harem-container');
    const res = await fetch(`${API_URL}/harem/${currentUser.id}`);
    const pjs = await res.json();
    contenedor.innerHTML = "";
    
    pjs.forEach(pj => {
        contenedor.innerHTML += `
            <div class="bg-gray-800/40 p-3 rounded-2xl flex flex-col border border-gray-700 hover:border-indigo-500 transition-all">
                <img src="${pj.imagen}" class="w-full h-32 md:h-40 object-contain mb-3 bg-black/20 rounded-lg">
                <h2 class="font-black text-[11px] text-center truncate uppercase">${pj.nombre}</h2>
                <div class="flex justify-between text-[10px] bg-black/40 p-2 rounded-lg my-3 font-bold">
                    <span class="text-yellow-500 italic">NV.${pj.nivel}</span>
                    <span class="text-green-400">$${pj.valor}</span>
                </div>
                <button onclick="entrenar('${pj._id}')" class="bg-indigo-600 py-2 rounded-xl text-[10px] font-black hover:bg-indigo-500">⬆️ ENTRENAR ($500)</button>
            </div>`;
    });
}

async function entrenar(id) {
    const res = await fetch(`${API_URL}/subir-nivel/${id}`, { method: 'PUT' });
    const data = await res.json();
    if (data.error) return alert(data.error);
    cargarHarem();
    actualizarDinero();
}

// --- BUSCADOR ---
document.getElementById('buscador').addEventListener('input', (e) => {
    const valor = e.target.value.toLowerCase();
    const tarjetas = document.querySelectorAll('#harem-container > div');
    tarjetas.forEach(t => {
        const nombre = t.querySelector('h2').innerText.toLowerCase();
        t.style.display = nombre.includes(valor) ? "flex" : "none";
    });
});

// --- INVOCAR ---
document.getElementById('btn-invocar').addEventListener('click', async () => {
    const btn = document.getElementById('btn-invocar');
    btn.disabled = true;
    btn.innerText = "🌀 INVOCANDO...";

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
        document.getElementById('modal-container').classList.remove('opacity-0', 'pointer-events-none');
    }
    btn.disabled = false;
    btn.innerText = "🌀 INVOCAR PERSONAJE";
});

function cerrarModal() {
    document.getElementById('modal-container').classList.add('opacity-0', 'pointer-events-none');
    cargarHarem();
}

document.addEventListener('DOMContentLoaded', checkSession);
