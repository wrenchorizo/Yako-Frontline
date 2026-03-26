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
        
        // ESTA LÍNEA ES CLAVE: Activa el reloj al cargar el perfil
        if (data.ultimaExploracion) {
            checkCooldown(data.ultimaExploracion);
        }
    } catch(e) { console.error("Error al obtener perfil"); }
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
// --- LÓGICA DEL MUNDO (EXPLORACIÓN) ---
async function iniciarExploracion() {
    const btnContainer = document.getElementById('controles-mundo');
    const espera = document.getElementById('pantalla-espera');
    const historial = document.getElementById('resultado-mundo');

    // Cambiamos vista a "Cargando"
    btnContainer.classList.add('hidden');
    espera.classList.remove('hidden');

    try {
        const res = await fetch(`${API_URL}/explorar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id })
        });
        const data = await res.json();

        // Esperamos 3 segundos para darle emoción
        setTimeout(() => {
            espera.classList.add('hidden');
            btnContainer.classList.remove('hidden');

            if (data.error) return alert(data.error);

            // Crear una tarjeta de resultado
            const card = document.createElement('div');
            card.className = "bg-gray-800 border-l-4 border-green-500 p-4 rounded-r-xl animate-pulse";
            
            let extraInfo = "";
            if (data.pj) {
                extraInfo = `<br><span class="text-yellow-400 font-black">✨ ¡ENCONTRASTE A ${data.pj.nombre.toUpperCase()}!</span>`;
            }

            card.innerHTML = `
                <div class="flex justify-between items-center">
                    <div>
                        <p class="text-white font-bold">${data.mensaje}</p>
                        ${extraInfo}
                    </div>
                    <i class="fas fa-coins text-yellow-500"></i>
                </div>
            `;
            
                        // ... (dentro del setTimeout del fetch de explorar)
            historial.prepend(card);

            // Actualizamos la interfaz
            actualizarDinero();
            checkCooldown(new Date());
            if (data.pj) cargarHarem();
            
        }, 3000);

    } catch (e) {
        alert("Error de conexión con el Mundo");
        espera.classList.add('hidden');
        btnContainer.classList.remove('hidden');
    }
}

document.addEventListener('DOMContentLoaded', checkSession);

let intervaloCooldown;

function checkCooldown(ultimaFecha) {
    if (!ultimaFecha) return;
    
    const btn = document.getElementById('btn-explorar');
    const timerText = document.getElementById('cooldown-timer');
    
    if (intervaloCooldown) clearInterval(intervaloCooldown);

    intervaloCooldown = setInterval(() => {
        const ahora = new Date();
        const ultima = new Date(ultimaFecha);
        const proxima = new Date(ultima.getTime() + 3600000); // +1 hora
        const diferencia = proxima - ahora;

        if (diferencia > 0) {
            btn.disabled = true;
            const mins = Math.floor((diferencia % 3600000) / 60000);
            const segs = Math.floor((diferencia % 60000) / 1000);
            btn.innerText = `ESPERA: ${mins}m ${segs}s`;
            timerText.innerText = "SISTEMA EN COOLDOWN";
        } else {
            btn.disabled = false;
            btn.innerText = "⚔️ INICIAR EXPEDICIÓN";
            timerText.innerText = "¡LISTO PARA EXPLORAR!";
            clearInterval(intervaloCooldown);
        }
    }, 1000);
}
