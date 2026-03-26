// SUSTITUYE POR TU LINK REAL DE RAILWAY (Sin / al final)
const API_URL = "https://yako-production.up.railway.app"; 

// Elementos del Modal
const modalContainer = document.getElementById('modal-container');
const gachaModal = document.getElementById('gacha-modal');

async function cargarHarem() {
    const contenedor = document.getElementById('harem-container');
    const status = document.getElementById('harem-status');
    
    try {
        const respuesta = await fetch(`${API_URL}/harem`);
        const personajes = await respuesta.json();
        
        contenedor.innerHTML = ""; // Limpiar carga
        
        if (personajes.length === 0) {
            contenedor.innerHTML = "<p class='text-center col-span-full text-gray-500 font-medium mt-10'>Tu harem está vacío. ¡Invoca a alguien!</p>";
            return;
        }

        personajes.forEach(pj => {
            contenedor.innerHTML += `
                <div class="bg-gray-800 p-4 rounded-2xl border-2 border-yellow-500 shadow-[0_0_15px_rgba(251,191,36,0.2)] transform transition hover:scale-105 active:scale-95">
                    <img src="${pj.imagen}" class="w-full h-52 object-cover rounded-xl mb-4 shadow-md" onerror="this.src='https://via.placeholder.com/150?text=No+Image'">
                    <h2 class="text-xl font-bold text-white text-center">${pj.nombre}</h2>
                    <p class="text-blue-400 text-center text-sm font-medium mb-3">${pj.fuente}</p>
                    <div class="flex justify-between items-center bg-gray-900 rounded-lg px-3 py-2">
                        <span class="text-yellow-500 font-bold">NV. ${pj.nivel}</span>
                        <span class="text-green-400 font-mono text-sm">${pj.valor}</span>
                    </div>
                </div>
            `;
        });
    } catch (error) {
        console.error(error);
        contenedor.innerHTML = ""; // Limpiamos para no tener duplicados
        contenedor.innerHTML = `<p class="text-red-500 text-center col-span-full font-bold bg-red-950 p-4 rounded-xl">❌ Error de conexión temporal.<br>Por favor refresca la página (el servidor se está despertando).</p>`;
    }
}

// Lógica para MOSTRAR el Modal Gacha
function mostrarInvocacion(pj) {
    document.getElementById('modal-imagen').src = pj.imagen;
    document.getElementById('modal-nombre').innerText = pj.nombre;
    document.getElementById('modal-serie').innerText = pj.fuente;
    document.getElementById('modal-nivel').innerText = `NV. ${pj.nivel}`;
    document.getElementById('modal-valor').innerText = pj.valor;

    // Animación de aparición
    modalContainer.classList.remove('opacity-0', 'pointer-events-none');
    gachaModal.classList.remove('scale-90');
    gachaModal.classList.add('scale-100');
}

// Lógica para OCULTAR el Modal Gacha
function ocultarInvocacion() {
    modalContainer.classList.add('opacity-0', 'pointer-events-none');
    gachaModal.classList.remove('scale-100');
    gachaModal.classList.add('scale-90');
}

// Lógica del botón de Invocar (Cableado)
document.getElementById('btn-invocar').addEventListener('click', async () => {
    const btn = document.getElementById('btn-invocar');
    btn.innerText = "🌀 ABRIENDO PORTAL...";
    btn.disabled = true;

    try {
        const res = await fetch(`${API_URL}/invocar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario: "Santiago" })
        });

        if (res.ok) {
            const nuevo = await res.json();
            
            // Reemplazo del alert() por el MODAL CHULO
            mostrarInvocacion(nuevo);
            cargarHarem(); // Recargar la lista de fondo
        }
    } catch (e) {
        contenedor.innerHTML = `<p class="text-red-500 text-center col-span-full">El portal falló. Intenta de nuevo.</p>`;
    } finally {
        btn.innerText = "🌀 INVOCAR PERSONAJE (Gacha)";
        btn.disabled = false;
    }
});

// Cablear el botón Cerrar del Modal
document.getElementById('modal-cerrar').addEventListener('click', ocultarInvocacion);

// Iniciar al abrir la página
document.addEventListener('DOMContentLoaded', cargarHarem);
