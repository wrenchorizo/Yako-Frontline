// SUSTITUYE ESTO POR TU LINK DE RAILWAY
const API_URL = "yako-production.up.railway.app";

async function cargarHarem() {
    try {
        const respuesta = await fetch(`${API_URL}/harem`);
        const personajes = await respuesta.json();
        
        const contenedor = document.getElementById('harem-container');
        contenedor.innerHTML = ""; // Limpiar el mensaje de carga

        personajes.forEach(pj => {
            const card = `
                <div class="bg-gray-800 p-4 rounded-xl card-gold">
                    <img src="${pj.imagen || 'https://via.placeholder.com/150'}" class="w-full h-48 object-cover rounded-lg mb-4">
                    <h2 class="text-xl font-bold">${pj.nombre}</h2>
                    <p class="text-yellow-400 font-bold">Nivel: ${pj.nivel}</p>
                    <p class="text-gray-400 text-sm">Dueño: ${pj.propietarioId}</p>
                    <button class="mt-4 w-full bg-yellow-600 p-2 rounded-lg font-bold">¡MEJORAR!</button>
                </div>
            `;
            contenedor.innerHTML += card;
        });
    } catch (error) {
        console.error("Error cargando el harem:", error);
    }
}

cargarHarem();
