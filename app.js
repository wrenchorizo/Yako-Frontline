const API_URL = "https://yako-production.up.railway.app"; 

async function cargarHarem() {
    console.log("Intentando conectar con:", API_URL); // Esto nos ayuda a ver errores
    try {
        const respuesta = await fetch(`${API_URL}/harem`);
        
        if (!respuesta.ok) {
            throw new Error(`Error en el servidor: ${respuesta.status}`);
        }

        const personajes = await respuesta.json();
        console.log("Personajes recibidos:", personajes);

        const contenedor = document.getElementById('harem-container');
        
        if (personajes.length === 0) {
            contenedor.innerHTML = "<p class='text-center col-span-full'>No hay personajes en la nube. ¡Captura uno!</p>";
            return;
        }

        contenedor.innerHTML = ""; // Limpiamos el "Cargando..."

        personajes.forEach(pj => {
            const card = `
                <div class="bg-gray-800 p-4 rounded-xl border-2 border-yellow-500 shadow-lg mb-4">
                    <img src="${pj.imagen || 'https://via.placeholder.com/150'}" class="w-full h-48 object-cover rounded-lg mb-4">
                    <h2 class="text-xl font-bold text-white">${pj.nombre}</h2>
                    <p class="text-yellow-400 font-bold text-lg text-center bg-gray-900 rounded-md py-1 mt-2">Nivel: ${pj.nivel}</p>
                    <p class="text-gray-400 text-sm mt-2 italic">Propietario: ${pj.propietarioId || 'Sin dueño'}</p>
                </div>
            `;
            contenedor.innerHTML += card;
        });
    } catch (error) {
        console.error("❌ Error fatal:", error);
        document.getElementById('harem-container').innerHTML = `<p class='text-red-500 text-center col-span-full'>Error de conexión: ${error.message}</p>`;
    }
}

// Ejecutar al cargar la página
document.addEventListener('DOMContentLoaded', cargarHarem);
