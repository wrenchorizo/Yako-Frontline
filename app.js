const API_URL = "https://yako-production.up.railway.app"; 

// 1. Manejo de Pestañas
function changeTab(tabName) {
    document.querySelectorAll('main > section').forEach(s => s.classList.add('hidden'));
    document.getElementById(`tab-${tabName}`).classList.remove('hidden');
    document.getElementById('tab-title').innerText = tabName.toUpperCase();
    
    // Update Sidebar visual
    document.querySelectorAll('nav button').forEach(b => b.classList.remove('active-tab'));
    event.currentTarget.classList.add('active-tab');
}

// 2. Cargar Perfil (Dinero)
async function cargarPerfil() {
    const res = await fetch(`${API_URL}/perfil`);
    const data = await res.json();
    document.getElementById('user-money').innerText = `$${data.dinero}`;
}

// 3. Cargar Harem
async function cargarHarem() {
    const contenedor = document.getElementById('harem-container');
    try {
        const res = await fetch(`${API_URL}/harem`);
        const pjs = await res.json();
        contenedor.innerHTML = "";
        
        pjs.forEach(pj => {
            contenedor.innerHTML += `
                <div class="bg-gray-800/50 border border-gray-700 p-3 rounded-2xl flex flex-col h-full">
                    <img src="${pj.imagen}" class="w-full h-32 md:h-40 object-contain rounded-xl mb-3 bg-black/20">
                    <h2 class="font-black text-xs text-center truncate">${pj.nombre}</h2>
                    <div class="mt-auto">
                        <div class="flex justify-between text-[10px] bg-black/40 p-2 rounded-lg mb-2 mt-2">
                            <span class="text-yellow-500 font-bold">NV.${pj.nivel}</span>
                            <span class="text-green-400 font-bold">$${pj.valor}</span>
                        </div>
                        <button onclick="entrenar('${pj._id}')" class="w-full bg-indigo-600 py-2 rounded-lg text-[10px] font-black hover:bg-indigo-500">
                            ⬆️ ENTRENAR ($500)
                        </button>
                    </div>
                </div>
            `;
        });
    } catch (e) { console.log(e) }
}

async function entrenar(id) {
    const res = await fetch(`${API_URL}/subir-nivel/${id}`, { method: 'PUT' });
    const data = await res.json();
    if (data.error) return alert(data.error);
    cargarHarem();
    cargarPerfil();
}

// 4. Invocar con mensaje de duplicado
document.getElementById('btn-invocar').addEventListener('click', async () => {
    const btn = document.getElementById('btn-invocar');
    btn.disabled = true;
    
    const res = await fetch(`${API_URL}/invocar`, { method: 'POST', body: JSON.stringify({ usuario: "Santiago" }), headers: {'Content-Type': 'application/json'} });
    const data = await res.json();
    
    if (data.error) {
        alert(data.error); // Aquí dirá "Ya posees este personaje..."
    } else {
        mostrarInvocacion(data);
    }
    btn.disabled = false;
});

function mostrarInvocacion(pj) {
    document.getElementById('modal-imagen').src = pj.imagen;
    document.getElementById('modal-nombre').innerText = pj.nombre;
    document.getElementById('modal-serie').innerText = pj.fuente;
    const modal = document.getElementById('modal-container');
    modal.classList.remove('opacity-0', 'pointer-events-none');
}

document.getElementById('modal-cerrar').addEventListener('click', () => {
    document.getElementById('modal-container').classList.add('opacity-0', 'pointer-events-none');
    cargarHarem();
});

// Inicio
document.addEventListener('DOMContentLoaded', () => {
    cargarPerfil();
    cargarHarem();
});
