// ⚠️ IMPORTANTE: Pon tu link de Railway AQUÍ. SIN la barra "/" al final.
const API_URL = "https://yako-production.up.railway.app"; 

async function cargarHarem() {
    const contenedor = document.getElementById('harem-container');
    
    try {
        const respuesta = await fetch(`${API_URL}/harem`);
        if (!respuesta.ok) throw new Error("Servidor no responde");
        
        const personajes = await respuesta.json();
        contenedor.innerHTML = ""; 

        if (personajes.length === 0) {
            contenedor.innerHTML = "<p class='col-span-full text-center text-gray-500 py-10'>No hay personajes. ¡Usa el portal!</p>";
            return;
        }

        personajes.forEach(pj => {
            contenedor.innerHTML += `
                <div class="bg-gray-800/50 border border-gray-700 p-3 rounded-2xl hover:border-yellow-500 transition-colors">
                    <img src="${pj.imagen}" class="w-full h-40 object-contain bg-black/20 rounded-xl mb-3" onerror="this.src='https://via.placeholder.com/150?text=Error+Link'">
                    <h2 class="font-bold text-sm text-center truncate">${pj.nombre}</h2>
                    <p class="text-[10px] text-blue-400 text-center mb-2 uppercase">${pj.fuente}</p>
                    <div class="flex justify-between items-center text-[10px] bg-black/30 p-2 rounded-lg">
                        <span class="text-yellow-500">NV.${pj.nivel}</span>
                        <span class="text-green-400 font-mono">${pj.valor}</span>
                    </div>
                </div>
            `;
        });
    } catch (error) {
        contenedor.innerHTML = `
            <div class="col-span-full text-center p-10 bg-red-900/20 border border-red-500 rounded-2xl">
                <p class="text-red-500 font-bold">⚠️ Error de conexión</p>
                <p class="text-xs text-red-300 mt-2">Intentando despertar al servidor...</p>
                <button onclick="cargarHarem()" class="mt-4 text-xs bg-red-500 text-white px-4 py-2 rounded-lg">REINTENTAR AHORA</button>
            </div>`;
    }
}

// Mostrar Modal con imagen completa
function mostrarInvocacion(pj) {
    document.getElementById('modal-imagen').src = pj.imagen;
    document.getElementById('modal-nombre').innerText = pj.nombre;
    document.getElementById('modal-serie').innerText = pj.fuente;
    document.getElementById('modal-nivel').innerText = `NIVEL ${pj.nivel}`;
    document.getElementById('modal-valor').innerText = `$${pj.valor}`;

    const modal = document.getElementById('modal-container');
    const box = document.getElementById('gacha-modal');
    modal.classList.remove('opacity-0', 'pointer-events-none');
    box.classList.add('scale-100');
    box.classList.remove('scale-90');
}

document.getElementById('btn-invocar').addEventListener('click', async () => {
    const btn = document.getElementById('btn-invocar');
    btn.disabled = true;
    btn.innerText = "🌀 INVOCANDO...";

    try {
        const res = await fetch(`${API_URL}/invocar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario: "Santiago" })
        });

        if (res.ok) {
            const nuevo = await res.json();
            mostrarInvocacion(nuevo);
        } else {
            alert("El servidor está ocupado. Intenta de nuevo.");
        }
    } catch (e) {
        alert("Error de red. Verifica tu API_URL.");
    } finally {
        btn.disabled = false;
        btn.innerText = "🌀 INVOCAR PERSONAJE";
    }
});

document.getElementById('modal-cerrar').addEventListener('click', () => {
    document.getElementById('modal-container').classList.add('opacity-0', 'pointer-events-none');
    document.getElementById('gacha-modal').classList.add('scale-90');
    cargarHarem();
});

// Carga inicial
document.addEventListener('DOMContentLoaded', cargarHarem);
