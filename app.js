// CONFIGURACIÓN CENTRAL
const API_URL = "https://yako-production.up.railway.app"; // CAMBIA ESTO POR TU URL REAL
let usuario = JSON.parse(localStorage.getItem('yak_user')) || null;
let equipo = [];
let tabActual = 'harem';
let invTimerInterval = null;
let socialTabActual = 'chat';
let chatTarget = null;
let seleccionTemporal = [];
let pjParaRegalar = null;
let tradeConfig = { mio: null, suyo: null };

// --- NOTIFICACIONES ---
function notificar(msj, tipo = 'info') {
    const container = document.getElementById('notificador');
    const div = document.createElement('div');
    div.className = `p-3 rounded-xl border shadow-2xl animate-bounce-in hud-text-xs font-black uppercase tracking-widest flex items-center gap-3 pointer-events-auto min-w-[220px] 
        ${tipo === 'error' ? 'bg-red-950 border-red-500 text-red-200' : 'bg-gray-900 border-indigo-500 text-indigo-100'}`;
    div.innerHTML = `<i class="fas ${tipo === 'error' ? 'fa-exclamation-triangle' : 'fa-check-circle'}"></i> ${msj}`;
    container.appendChild(div);
    setTimeout(() => { div.style.opacity = '0'; setTimeout(() => div.remove(), 500); }, 3500);
}

// --- NAVEGACIÓN Y MENÚ (CORREGIDO PARA MÓVIL) ---
function toggleSidebar() {
    const side = document.getElementById('sidebar');
    const texts = document.querySelectorAll('.nav-text');
    
    if (window.innerWidth < 768) {
        // En celular: desliza
        side.classList.toggle('-translate-x-full');
        side.classList.toggle('translate-x-0');
        // Forzamos que los textos se vean en celular
        texts.forEach(t => t.classList.remove('hidden'));
    } else {
        // En PC: expande
        side.classList.toggle('expanded');
        texts.forEach(t => t.classList.toggle('hidden'));
    }
}

function changeTab(tab, btn) {
    // Cerrar menú automáticamente en móvil al elegir pestaña
    if (window.innerWidth < 768) {
        const side = document.getElementById('sidebar');
        side.classList.add('-translate-x-full');
        side.classList.remove('translate-x-0');
    }

    document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('active-tab', 'text-white');
        b.classList.add('text-gray-500');
    });
    
    btn.classList.add('active-tab', 'text-white');
    btn.classList.remove('text-gray-500');

    ['harem', 'mundo', 'invocacion', 'social'].forEach(t => {
        const el = document.getElementById(`tab-${t}`);
        if(el) el.classList.add('hidden');
    });
    
    const target = document.getElementById(`tab-${tab}`);
    if(target) target.classList.remove('hidden');
    tabActual = tab;
}

// --- AUTENTICACIÓN ---
async function handleAuth(type) {
    const userEl = document.getElementById('auth-user');
    const passEl = document.getElementById('auth-pass');
    
    if(!userEl || !passEl) return notificar(" Error de interfaz", "error");

    const user = userEl.value.trim();
    const pass = passEl.value.trim();

    if(!user || !pass) return notificar("Campos vacíos", "error");

    try {
        const res = await fetch(`${API_URL}/${type}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ username: user, password: pass })
        });
        
        const data = await res.json();
        
        if(data.error) {
            notificar(data.error, "error");
            return;
        }

        if(type === 'login') {
            usuario = data;
            localStorage.setItem('yak_user', JSON.stringify(data));
            location.reload();
        } else {
            notificar("¡Cuenta creada! Ya puedes iniciar sesión.");
        }
    } catch (e) { 
        console.error("Error en Auth:", e);
        notificar("No se pudo conectar con el servidor", "error"); 
    }
}

function confirmarLogout() { document.getElementById('modal-logout').classList.remove('hidden'); }
function cerrarModalLogout() { document.getElementById('modal-logout').classList.add('hidden'); }
function logoutReal() { localStorage.clear(); location.reload(); }

// --- CARGA DE DATOS ---
async function cargarDatos() {
    if(!usuario) return;
    try {
        const res = await fetch(`${API_URL}/perfil/${usuario.id}`);
        const data = await res.json();
        document.getElementById('user-display').innerText = data.username;
        document.getElementById('user-money').innerText = `$${data.balance.toLocaleString()}`;

        // --- RENDERIZAR LISTA DE AMIGOS ---
        const listaAmigos = document.getElementById('vista-amigos');
        if (data.amigos && data.amigos.length > 0) {
            listaAmigos.innerHTML = data.amigos.map(amigo => `
                <div class="bg-indigo-900/20 p-4 rounded-2xl border border-indigo-500/30 flex justify-between items-center mb-2" 
                     onclick="abrirAccionesUsuario('${amigo._id}', '${amigo.username}', 'amigo')">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center font-black text-white shadow-inner">
                            ${amigo.username[0].toUpperCase()}
                        </div>
                        <div>
                            <p class="font-black hud-text-sm uppercase italic">${amigo.username}</p>
                            <p class="text-[8px] text-indigo-400 font-bold uppercase">Nivel ${amigo.nivel || 1} • En línea</p>
                        </div>
                    </div>
                    <i class="fas fa-chevron-right text-gray-600"></i>
                </div>
            `).join('');
        } else {
            listaAmigos.innerHTML = `
                <div class="text-center py-10 opacity-40">
                    <i class="fas fa-user-friends text-4xl mb-3"></i>
                    <p class="hud-text-xs font-black uppercase">Tu lista está vacía</p>
                </div>`;
        }

        if(data.ultimaInvocacion) iniciarTimerInvocacion(data.ultimaInvocacion);
        verificarMision(data);
        cargarHarem();
    } catch (e) { console.error(e); }
}

async function cargarHarem() {
    try {
        const res = await fetch(`${API_URL}/harem/${usuario.id}`);
        const pjs = await res.json();
        const container = document.getElementById('harem-container');
        container.innerHTML = "";

        // SI NO HAY PERSONAJES
        if (pjs.length === 0) {
            container.innerHTML = `
                <div class="col-span-full py-20 text-center flex flex-col items-center justify-center animate-pulse">
                    <i class="fas fa-ghost text-5xl text-gray-800 mb-4"></i>
                    <h3 class="text-gray-500 font-black uppercase hud-text-sm tracking-tighter">Harem vacío</h3>
                    <p class="text-indigo-400 font-bold hud-text-xs mt-2 uppercase tracking-widest">Prueba invocar personajes en el Portal</p>
                </div>
            `;
            return;
        }

        // SI HAY PERSONAJES, SE GENERAN LAS TARJETAS
        pjs.forEach(pj => {
            const card = document.createElement('div');
            card.className = "bg-gray-900 rounded-2xl border border-gray-800 p-2 cursor-pointer hover:border-indigo-500 transition-all group";
            card.onclick = () => abrirDetalles(pj);
            card.innerHTML = `
                <div class="relative overflow-hidden rounded-xl mb-2 bg-black/20">
                    <img src="${pj.imagen}" class="w-full h-24 object-contain group-hover:scale-110 transition-transform duration-300">
                </div>
                <h3 class="hud-text-xs font-black truncate text-center uppercase tracking-tighter">${pj.nombre}</h3>
                <div class="w-full bg-gray-800 h-1 mt-2 rounded-full overflow-hidden">
                    <div class="bg-indigo-500 h-full transition-all" style="width:${pj.stamina}%"></div>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (e) {
        console.error("Error cargando el harem:", e);
    }
}

// --- DETALLES Y STAMINA ---
let pjSeleccionado = null;
function abrirDetalles(pj) {
    pjSeleccionado = pj;
    document.getElementById('det-img').src = pj.imagen;
    document.getElementById('det-nombre').innerText = pj.nombre;
    document.getElementById('det-fuente').innerText = pj.fuente;
    document.getElementById('det-nivel').innerText = pj.nivel;
    document.getElementById('det-genero').innerText = pj.genero === "Mujer" ? "MUJER" : "HOMBRE";
    document.getElementById('det-stamina-bar').style.width = `${pj.stamina}%`;
    document.getElementById('det-stamina-text').innerText = `${pj.stamina}%`;
    
    const estaEnEquipo = equipo.find(p => p._id === pj._id);
    document.getElementById('btn-toggle-equipo').innerText = estaEnEquipo ? "QUITAR DEL EQUIPO" : "AÑADIR AL EQUIPO";
    document.getElementById('modal-detalles').classList.remove('hidden');
}

function cerrarDetalles() { document.getElementById('modal-detalles').classList.add('hidden'); }

async function entrenarPj() {
    const res = await fetch(`${API_URL}/subir-nivel/${pjSeleccionado._id}`, { method: 'PUT' });
    const data = await res.json();
    if(data.error) return notificar(data.error, "error");
    notificar(`${pjSeleccionado.nombre} nivel UP!`);
    abrirDetalles(data.pj);
    cargarDatos();
}

// --- AVENTURA Y DERROTA ---
function toggleEquipo() {
    const idx = equipo.findIndex(p => p._id === pjSeleccionado._id);
    if(idx > -1) {
        equipo.splice(idx, 1);
        notificar(`${pjSeleccionado.nombre} fuera`);
    } else {
        if(equipo.length >= 3) return notificar("Máximo 3", "error");
        equipo.push(pjSeleccionado);
        notificar(`${pjSeleccionado.nombre} se unió al equipo`);
    }
    actualizarSlots();
    cerrarDetalles();
}

function actualizarSlots() {
    const slots = document.getElementById('slots-equipo').children;
    for(let i=0; i<3; i++) slots[i].innerHTML = equipo[i] ? `<img src="${equipo[i].imagen}" class="w-full h-full object-contain">` : (i+1);
}

async function iniciarExploracion() {
    if(equipo.length === 0) return notificar("Equipo vacío", "error");
    const res = await fetch(`${API_URL}/explorar`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ userId: usuario.id, pjsSeleccionados: equipo.map(p => p._id) })
    });
    const data = await res.json();
    equipo = []; actualizarSlots(); cargarDatos();
}

function verificarMision(user) {
    const inactivo = document.getElementById('mundo-inactivo');
    const activo = document.getElementById('mundo-activo');
    if(user.finExploracion) {
        inactivo.classList.add('hidden'); activo.classList.remove('hidden');
        iniciarTimerMision(new Date(user.finExploracion));
    } else {
        inactivo.classList.remove('hidden'); activo.classList.add('hidden');
    }
}

// --- INVOCACIÓN (TIMER MM:SS) ---
function iniciarTimerMision(fin) {
    if(window.misionInterval) clearInterval(window.misionInterval); // Evita duplicados

    window.misionInterval = setInterval(async () => {
        const ahora = Date.now();
        const final = new Date(fin).getTime();
        const diff = final - ahora;

        if(diff <= 0) {
            clearInterval(window.misionInterval);
            document.getElementById('timer-mision').innerText = "00:00";
            
            const res = await fetch(`${API_URL}/mision/reclamar/${usuario.id}`, { method: 'POST' });
            const data = await res.json();
            
            if(data.fueVencido) notificar("¡DERROTADOS!", "error");
            else notificar(`¡Éxito! +$${data.ganancia}`);
            
            cargarDatos();
        } else {
            const m = Math.floor(diff / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            document.getElementById('timer-mision').innerText = `${m}:${s < 10 ? '0'+s : s}`;
        }
    }, 1000);
}

// --- LÓGICA DEL PORTAL (CORREGIDA) ---
async function intentarInvocacion() {
    try {
        const res = await fetch(`${API_URL}/invocar`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ userId: usuario.id })
        });
        
        const data = await res.json(); // <-- Esto faltaba y rompía el botón
        
        if(data.error) return notificar(data.error, "error");

        document.getElementById('inv-img').src = data.imagen;
        document.getElementById('inv-nombre').innerText = data.nombre;
        document.getElementById('inv-fuente').innerText = data.fuente;
        
        const disp = document.getElementById('inv-disponibilidad');
        disp.innerText = data.estado;
        disp.className = data.disponible ? "p-3 rounded-xl border border-green-500/30 text-green-400 font-black" : "p-3 rounded-xl border border-red-500/30 text-red-400 font-black";
        
        document.getElementById('modal-invocacion').classList.remove('hidden');
        
        // Al invocar con éxito, reiniciamos datos y timer
        cargarDatos(); 
    } catch (e) {
        notificar("Error al conectar con el portal", "error");
    }
}

function cerrarInvocacion() {
    document.getElementById('modal-invocacion').classList.add('hidden');
}

// ESTA FUNCIÓN ES NUEVA: Pégala justo aquí abajo
function iniciarTimerInvocacion(ultimaInvocacion) {
    if(invTimerInterval) clearInterval(invTimerInterval);

    // Buscamos el botón de invocar para ponerle el tiempo
    const btnInvocar = document.querySelector('#tab-invocacion button');

    invTimerInterval = setInterval(() => {
        const ahora = Date.now();
        const ultima = new Date(ultimaInvocacion).getTime();
        const cooldown = 20 * 60 * 1000; // 20 minutos
        const restante = cooldown - (ahora - ultima);

        if (restante <= 0) {
            clearInterval(invTimerInterval);
            if(btnInvocar) {
                btnInvocar.disabled = false;
                btnInvocar.innerHTML = `<i class="fas fa-bolt mr-2"></i> INVOCAR PERSONAJE`;
                btnInvocar.className = "w-full bg-indigo-600 hover:bg-indigo-500 py-6 rounded-[2rem] font-black hud-text-sm shadow-lg border-b-4 border-indigo-900 active:border-b-0 transition-all";
            }
        } else {
            if(btnInvocar) {
                btnInvocar.disabled = true;
                const m = Math.floor(restante / 60000);
                const s = Math.floor((restante % 60000) / 1000);
                btnInvocar.innerHTML = `<i class="fas fa-clock mr-2"></i> RECARGA: ${m}:${s < 10 ? '0'+s : s}`;
                btnInvocar.className = "w-full bg-gray-800 py-6 rounded-[2rem] font-black hud-text-sm shadow-lg opacity-50 cursor-not-allowed";
            }
        }
    }, 1000);
}


// INICIO
if(usuario) {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    cargarDatos();
}

function switchSocial(sub) {
    socialTabActual = sub;
    document.getElementById('social-chat').classList.toggle('hidden', sub !== 'chat');
    document.getElementById('social-usuarios').classList.toggle('hidden', sub !== 'usuarios');
    document.getElementById('btn-tab-chat').classList.toggle('bg-indigo-600/20', sub === 'chat');
    document.getElementById('btn-tab-users').classList.toggle('bg-indigo-600/20', sub === 'usuarios');
}

let userEnMira = null; // Usuario seleccionado en el buscador

function verPestanaSocial(tab) {
    document.getElementById('vista-amigos').classList.toggle('hidden', tab !== 'amigos');
    document.getElementById('vista-buscar').classList.toggle('hidden', tab !== 'buscar');
    document.getElementById('btn-soc-amigos').className = tab === 'amigos' ? 'flex-1 bg-indigo-600/20 py-2 rounded-xl hud-text-xs font-black' : 'flex-1 bg-gray-800 py-2 rounded-xl hud-text-xs font-black';
    document.getElementById('btn-soc-buscar').className = tab === 'buscar' ? 'flex-1 bg-indigo-600/20 py-2 rounded-xl hud-text-xs font-black' : 'flex-1 bg-gray-800 py-2 rounded-xl hud-text-xs font-black';
}

// Modificamos el buscador para recibir la relación
async function buscarUsuarios() {
    const q = document.getElementById('inp-search').value;
    if(q.length < 2) return;
    const res = await fetch(`${API_URL}/usuarios/buscar?q=${q}&miId=${usuario.id}`);
    const data = await res.json();
    
    document.getElementById('res-busqueda').innerHTML = data.map(u => `
        <div onclick="abrirAccionesUsuario('${u._id}', '${u.username}', '${u.relacion}')" class="bg-black/40 p-4 rounded-2xl border border-white/5 flex justify-between items-center cursor-pointer hover:bg-indigo-900/20">
            <span class="font-black hud-text-sm uppercase italic">${u.username}</span>
            <span class="text-[9px] font-bold ${u.relacion === 'amigo' ? 'text-green-500' : 'text-gray-500'}">${u.relacion === 'amigo' ? 'AMIGO' : ''}</span>
        </div>
    `).join('');
}

// El modal ahora decide qué botones mostrar
async function abrirAccionesUsuario(id, nombre, relacion) {
    userEnMira = { id, nombre };
    const modal = document.getElementById('modal-user-acciones');
    const container = document.getElementById('contenedor-botones-acciones');
    document.getElementById('acc-nombre').innerText = nombre;
    
    // Verificamos si el usuario está bloqueado (asumiendo que usuario.bloqueados es un array)
    const estaBloqueado = usuario.bloqueados?.includes(id);

    if (estaBloqueado) {
        container.innerHTML = `
            <button onclick="ejecutarBloqueo('${id}', 'desbloquear')" class="w-full bg-green-600 py-3 rounded-xl font-black hud-text-xs uppercase italic">Desbloquear Usuario</button>
            <button onclick="cerrarAcciones()" class="mt-4 text-gray-500 hud-text-xs font-black uppercase">Cerrar</button>
        `;
    } else {
        let botonesHTML = `
            <button onclick="setChatTarget('${nombre}')" class="bg-indigo-500 py-3 rounded-xl font-black hud-text-xs uppercase italic">Enviar Mensaje</button>
        `;

        if (relacion === 'amigo') {
            botonesHTML += `
                <button onclick="abrirMenuDuelo()" class="bg-red-600 py-3 rounded-xl font-black hud-text-xs uppercase italic">Retar a Duelo</button>
                <button onclick="abrirMenuTrade()" class="bg-green-600 py-3 rounded-xl font-black hud-text-xs uppercase italic">Tradeo</button>
                <button onclick="abrirMenuRegalo()" class="bg-yellow-600 py-3 rounded-xl font-black hud-text-xs uppercase italic">Regalar PJ</button>
                <button onclick="confirmarBorrarAmigo('${id}', '${nombre}')" class="bg-gray-700 py-3 rounded-xl font-black hud-text-xs uppercase text-red-400">Eliminar Amistad</button>
            `;
        } else {
            botonesHTML += `
                <button onclick="enviarSol('amistad')" class="bg-indigo-600 py-3 rounded-xl font-black hud-text-xs uppercase italic">Añadir Amigo</button>
            `;
        }

        container.innerHTML = botonesHTML + `
            <button onclick="confirmarBloqueo('${id}', '${nombre}')" class="w-full bg-red-900/40 p-2 rounded-lg text-[9px] font-black uppercase mt-4 text-red-500">Bloquear</button>
        `;
    }
    modal.classList.remove('hidden');
}

async function abrirMenuTrade() {
    cerrarAcciones();
    const res = await fetch(`${API_URL}/harem/${usuario.id}`);
    const pjs = await res.json();
    
    const lista = document.getElementById('lista-pjs-seleccion');
    document.getElementById('sel-pj-titulo').innerText = "¿Qué personaje ofreces?";
    
    lista.innerHTML = pjs.map(pj => `
        <div onclick="seleccionarPjParaTrade('${pj.nombre}')" class="bg-black/40 p-3 rounded-2xl border border-white/5 text-center cursor-pointer hover:border-green-500">
            <img src="${pj.imagen}" class="w-12 h-12 mx-auto mb-1 object-contain">
            <p class="hud-text-xs font-black uppercase truncate">${pj.nombre}</p>
        </div>
    `).join('');
    
    document.getElementById('modal-seleccion-pj').classList.remove('hidden');
}

function seleccionarPjParaTrade(nombrePj) {
    tradeConfig.mio = nombrePj;
    const pjDeseado = prompt("Escribe el nombre del personaje que quieres recibir a cambio:");
    if(!pjDeseado) return;
    
    tradeConfig.suyo = pjDeseado.trim();
    enviarSol('trade');
    cerrarSeleccionPj();
}

// --- LÓGICA DE SELECCIÓN DE PERSONAJES ---

async function abrirMenuRegalo() {
    cerrarAcciones();
    const res = await fetch(`${API_URL}/harem/${usuario.id}`);
    const pjs = await res.json();
    
    const lista = document.getElementById('lista-pjs-seleccion');
    document.getElementById('sel-pj-titulo').innerText = "REGALAR A " + userEnMira.nombre;
    
    lista.innerHTML = pjs.map(pj => `
        <div onclick="preConfirmarRegalo('${pj.nombre}')" class="bg-black/40 p-3 rounded-2xl border border-white/5 text-center cursor-pointer hover:border-yellow-500">
            <img src="${pj.imagen}" class="w-12 h-12 mx-auto mb-1 object-contain">
            <p class="hud-text-xs font-black uppercase truncate">${pj.nombre}</p>
        </div>
    `).join('');
    
    document.getElementById('modal-seleccion-pj').classList.remove('hidden');
}

function preConfirmarRegalo(nombrePj) {
    pjParaRegalar = nombrePj;
    cerrarSeleccionPj();
    const modal = document.getElementById('modal-confirmar');
    document.getElementById('conf-texto').innerText = `¿CONFIRMAS REGALAR TU ${nombrePj} A ${userEnMira.nombre}?`;
    document.getElementById('btn-conf-si').onclick = ejecutarRegaloReal;
    modal.classList.remove('hidden');
}

async function ejecutarRegaloReal() {
    const res = await fetch(`${API_URL}/regalar-personaje`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ emisorId: usuario.id, receptorId: userEnMira.id, nombrePj: pjParaRegalar })
    });
    const data = await res.json();
    if(data.error) notificar(data.error, "error");
    else notificar("¡Regalo enviado!");
    cerrarConfirmacion();
    cargarDatos();
}

// --- DUELOS (Suma de Niveles) ---
function abrirMenuDuelo() {
    cerrarAcciones();
    seleccionTemporal = []; // Limpiar selección
    actualizarVistaDuelo();
    document.getElementById('modal-seleccion-pj').classList.remove('hidden');
}

async function actualizarVistaDuelo() {
    const res = await fetch(`${API_URL}/harem/${usuario.id}`);
    const pjs = await res.json();
    const lista = document.getElementById('lista-pjs-seleccion');
    document.getElementById('sel-pj-titulo').innerText = `DUELO (${seleccionTemporal.length}/3)`;

    lista.innerHTML = pjs.map(pj => {
        const estaSel = seleccionTemporal.includes(pj._id);
        return `
            <div onclick="togglePjDuelo('${pj._id}')" class="p-3 rounded-2xl border ${estaSel ? 'border-red-500 bg-red-500/20' : 'border-white/5 bg-black/40'} text-center cursor-pointer">
                <p class="hud-text-xs font-black uppercase">${pj.nombre}</p>
                <p class="text-[8px] text-yellow-500">NIVEL ${pj.nivel}</p>
            </div>
        `;
    }).join('');

    const footer = document.getElementById('footer-seleccion');
    footer.classList.remove('hidden');
    document.getElementById('btn-confirmar-sel').onclick = () => {
        if(seleccionTemporal.length === 0) return notificar("Elige al menos 1", "error");
        enviarSol('duelo');
        cerrarSeleccionPj();
    };
}

function togglePjDuelo(id) {
    if (seleccionTemporal.includes(id)) {
        seleccionTemporal = seleccionTemporal.filter(i => i !== id);
    } else if (seleccionTemporal.length < 3) {
        seleccionTemporal.push(id);
    }
    actualizarVistaDuelo();
}

function confirmarBorrarAmigo(id, nombre) {
    cerrarAcciones();
    const modal = document.getElementById('modal-confirmar');
    document.getElementById('conf-texto').innerText = `¿ELIMINAR A ${nombre} DE TUS AMIGOS?`;
    document.getElementById('btn-conf-si').onclick = () => eliminarAmigo(id);
    modal.classList.remove('hidden');
}

function confirmarBloqueo(id, nombre) {
    cerrarAcciones();
    const modal = document.getElementById('modal-confirmar');
    document.getElementById('conf-texto').innerText = `¿BLOQUEAR A ${nombre}? NO PODRÁN INTERACTUAR MÁS.`;
    document.getElementById('btn-conf-si').onclick = () => ejecutarBloqueo(id, 'bloquear');
    modal.classList.remove('hidden');
}

async function ejecutarBloqueo(targetId, tipo) {
    await fetch(`${API_URL}/usuarios/bloqueo`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ miId: usuario.id, targetId, accion: tipo })
    });
    notificar(tipo === 'bloquear' ? "Usuario bloqueado" : "Usuario desbloqueado");
    cerrarConfirmacion();
    cargarDatos();
}

function cerrarAcciones() {
    document.getElementById('modal-user-acciones').classList.add('hidden');
}

function cerrarSeleccionPj() {
    document.getElementById('modal-seleccion-pj').classList.add('hidden');
    document.getElementById('footer-seleccion').classList.add('hidden');
}

function cerrarConfirmacion() {
    document.getElementById('modal-confirmar').classList.add('hidden');
}

async function cargarChat() {
    if(!chatTarget) return; // Si no hay nadie seleccionado, no cargamos nada

    const res = await fetch(`${API_URL}/chat/${usuario.username}/${chatTarget}`);
    const msjs = await res.json();
    
    const container = document.getElementById('chat-container');
    if(msjs.length === 0) {
        container.innerHTML = `<div class="opacity-20 text-center py-10 hud-text-xs font-black uppercase">Sin mensajes con ${chatTarget}</div>`;
        return;
    }

    container.innerHTML = msjs.map(m => `
        <div class="flex flex-col ${m.emisor === usuario.username ? 'items-end' : 'items-start'} mb-2">
            <div class="p-3 rounded-2xl hud-text-xs ${m.emisor === usuario.username ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-gray-800 text-gray-300 rounded-tl-none border border-white/5'}">
                ${m.texto}
            </div>
        </div>
    `).reverse().join('');
}
function setChatTarget(target) {
    chatTarget = target;
    document.getElementById('chat-target-label').innerText = `Chat con ${target}`;
    
    // Desbloquear input si estaba gris
    const controls = document.getElementById('chat-controls');
    if(controls) controls.classList.remove('opacity-30', 'pointer-events-none');
    
    switchSocial('chat');
    cerrarAcciones();
    cargarChat();
}

async function enviarMensaje() {
    const input = document.getElementById('chat-input');
    const texto = input.value.trim();
    if(!texto || !usuario || !chatTarget) return;

    await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ 
            emisor: usuario.username, 
            receptor: chatTarget, 
            texto: texto 
        })
    });
    input.value = "";
    cargarChat();
}

async function enviarSol(tipo) {
    if(!userEnMira) return;

    let extraData = {};
    if(tipo === 'trade') extraData = { trade: tradeConfig };
    if(tipo === 'duelo') extraData = { personajes: seleccionTemporal };

    try {
        const res = await fetch(`${API_URL}/solicitud/enviar`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ 
                emisorId: usuario.id, 
                emisorName: usuario.username, 
                receptorId: userEnMira.id, 
                tipo: tipo,
                ...extraData
            })
        });
        const data = await res.json();
        if(data.error) return notificar(data.error, "error");
        
        notificar(`Solicitud de ${tipo} enviada`);
        cerrarAcciones();
    } catch (e) {
        notificar("Error de conexión", "error");
    }
}
