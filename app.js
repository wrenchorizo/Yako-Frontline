// SUSTITUYE POR TU LINK REAL DE RAILWAY (Sin / al final)
const API_URL = "https://yako-production.up.railway.app"; 

async function cargarHarem() {
    const contenedor = document.getElementById('harem-container');
    try {
        const respuesta = await fetch(`${API_URL}/harem`);
        const personajes = await respuesta.json();
        
        if (personajes.length === 0) {
            contenedor.innerHTML = "<p class='text-center col-span-full text-gray-400'>Tu harem está vacío. ¡Invoca a alguien!</p>";
            return;
        }

        contenedor.innerHTML = ""; // Limpiar carga
        personajes.forEach(pj => {
            contenedor.innerHTML += `
                <div class="bg-gray-800 p-4 rounded-2xl border-2 border-yellow-500 shadow-[0_0_15px_rgba(251,191,36,0.3)] transform transition hover:scale-105">
                    <img src="${pj.imagen}" class="w-full h-52 object-cover rounded-xl mb-4 shadow-md" onerror="this.src='https://via.placeholder.com/150?text=No+Image'">
                    <h2 class="text-xl font-bold text-white text-center">${pj.nombre}</h2>
                    <p class="text-blue-400 text-center text-sm font-medium mb-2">${pj.fuente}</p>
                    <div class="flex justify-between items-center bg-gray-900 rounded-lg px-3 py-2">
                        <span class="text-yellow-500 font-bold">NV. ${pj.nivel}</span>
                        <span class="text-green-400 font-mono text-sm">${pj.valor}</span>
                    </div>
                </div>
            `;
        });
    } catch (error) {
        console.error(error);
        contenedor.innerHTML = `<p class="text-red-500 text-center col-span-full font-bold">Error de conexión: Verifica el API_URL</p>`;
    }
}

// Lógica del botón de Invocar
document.getElementById('btn-invocar').addEventListener('click', async () => {
    const btn = document.getElementById('btn-invocar');
    btn.innerText = "🌀 INVOCANDO...";
    btn.disabled = true;

    try {
        const res = await fetch(`${API_URL}/invocar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario: "Santiago" })
        });

        if (res.ok) {
            const nuevo = await res.json();
            // Una pequeña alerta para la emoción
            alert(`✨ ¡HAS OBTENIDO A ${nuevo.nombre.toUpperCase()}! ✨`);
            cargarHarem();
        }
    } catch (e) {
        alert("El portal de invocación falló.");
    } finally {
        btn.innerText = "✨ INVOCAR PERSONAJE ✨";
        btn.disabled = false;
    }
});

// Iniciar al abrir la página
document.addEventListener('DOMContentLoaded', cargarHarem);
