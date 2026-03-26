// ⚠️ IMPORTANTE: Verifica que tu link de Railway sea exacto
const API_URL = "https://yako-production.up.railway.app"; 

// 1. Cargar personajes al inicio
async function cargarHarem() {
    const contenedor = document.getElementById('harem-container');
    
    try {
        const respuesta = await fetch(`${API_URL}/harem`);
        const personajes = await respuesta.json();
        
        contenedor.innerHTML = ""; 

        if (personajes.length === 0) {
            contenedor.innerHTML = "<p class='col-span-full text-center text-gray-500 py-10'>No hay personajes. ¡Usa el portal!</p>";
            return;
        }

        personajes.forEach(pj => {
            contenedor.innerHTML += `
                <div class="bg-gray-800/40 border border-gray-700 p-3 rounded-2xl hover:border-purple-500 transition-all flex flex-col h-full">
                    <img src="${pj.imagen}" class="w-full h-44 object-contain bg-black/20 rounded-xl mb-3" onerror="this.src='https://via.placeholder.com/150?text=Error+Link'">
                    
                    <h2 class="font-black text-sm text-center truncate uppercase">${pj.nombre}</h2>
                    <p class="text-[10px] text-blue-400 text-center mb-3 font-bold">${pj.fuente}</p>
                    
                    <div class="mt-auto">
                        <div class="flex justify-between items-center text-[10px] bg-black/40 p-2 rounded-lg mb-2">
                            <span class="text-yellow-500 font-bold">NIVEL ${pj.nivel}</span>
                            <span class="text-green-400 font-mono font-bold">$${pj.valor}</span>
                        </div>
                        
                        <button onclick="entrenarPersonaje('${pj._id}')" 
                        class="w-full bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-black py-2 rounded-lg transition-colors">
                            ⬆️ ENTRENAR
                        </button>
                    </div>
                </div>
            `;
        });
    } catch (error) {
        contenedor.innerHTML = `<div class="col-span-full text-center p-10 bg-red-900/20 border border-red-500 rounded-2xl text-red-500 font-bold">⚠️ Error de conexión. Reintenta en unos segundos.</div>`;
    }
}

// 2. Función para Entrenar (Subir Nivel)
async function entrenarPersonaje(id) {
    try {
        const res = await fetch(`${API_URL}/subir-nivel/${id}`, { method: 'PUT' });
        if (res.ok) {
            cargarHarem(); // Refrescamos la lista para ver el cambio
        }
    } catch (e) {
        alert("Error en el entrenamiento");
    }
}

// 3. Lógica del Buscador
document.getElementById('buscador').addEventListener('input', (e) => {
    const termino = e.target.value.toLowerCase();
    const tarjetas = document.querySelectorAll('#harem-container > div');

    tarjetas.forEach(tarjeta => {
        const nombre = tarjeta.querySelector('h2').innerText.toLowerCase();
        if (nombre.includes(termino)) {
            tarjeta.style.display = "flex";
        } else {
            tarjeta.style.display = "none";
        }
    });
});

// 4. Lógica de Invocación
document.getElementById('btn-invocar').addEventListener('click', async () => {
    const btn = document.getElementById('btn-invocar');
    btn.disabled = true;
    btn.innerText = "🌀 ABRIENDO PORTAL...";

    try {
        const res = await fetch(`${API_URL}/invocar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario: "Santiago" })
        });

        if (res.ok) {
            const nuevo = await res.json();
            mostrarInvocacion(nuevo);
        }
    } catch (e) {
        alert("Fallo en la conexión");
    } finally {
        btn.disabled = false;
        btn.innerText = "🌀 INVOCAR PERSONAJE";
    }
});

// 5. Mostrar/Cerrar Modal
function mostrarInvocacion(pj) {
    document.getElementById('modal-imagen').src = pj.imagen;
    document.getElementById('modal-nombre').innerText = pj.nombre;
    document.getElementById('modal-serie').innerText = pj.fuente;

    const modal = document.getElementById('modal-container');
    const box = document.getElementById('gacha-modal');
    modal.classList.remove('opacity-0', 'pointer-events-none');
    box.classList.add('scale-100');
    box.classList.remove('scale-90');
}

document.getElementById('modal-cerrar').addEventListener('click', () => {
    document.getElementById('modal-container').classList.add('opacity-0', 'pointer-events-none');
    document.getElementById('gacha-modal').classList.add('scale-90');
    cargarHarem();
});

// Inicio
document.addEventListener('DOMContentLoaded', cargarHarem);
