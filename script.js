// ===================================================
// 1. ALGORITMO COLA (FIFO) - LÓGICA INTERNA DE NEGOCIO
// ===================================================
class ColaSolicitudes {
    constructor() {
        this.items = JSON.parse(localStorage.getItem('cola_prestamos')) || [];
    }

    encolar(solicitud) { // Enqueue
        this.items.push(solicitud);
        this.guardar();
    }

    desencolar() { // Dequeue
        if (this.estaVacia()) return null;
        const atendida = this.items.shift();
        this.guardar();
        return atendida;
    }

    estaVacia() { return this.items.length === 0; }
    obtenerTodas() { return this.items; }
    guardar() { localStorage.setItem('cola_prestamos', JSON.stringify(this.items)); }
}

const colaPrestamos = new ColaSolicitudes();

// ===================================================
// 2. BASE DE DATOS LOCAL (LOCALSTORAGE)
// ===================================================
const FLOTILLA_BASE = [
    { placa: "YWZ-101-A", marca: "Nissan", modelo: "NP300", anio: 2022, km: 45200, estatus: "Disponible" },
    { placa: "ZAC-102-B", marca: "Chevrolet", modelo: "Aveo", anio: 2021, km: 62400, estatus: "En Ruta" },
    { placa: "YZA-103-C", marca: "Toyota", modelo: "Hilux", anio: 2023, km: 31000, estatus: "Disponible" }
];

const CONDUCTORES_BASE = [
    { nombre: "Alejandro Pech Cetina", depto: "Soporte Técnico", licencia: "YUC-982341" },
    { nombre: "María José Chan", depto: "Ventas Mérida", licencia: "YUC-445120" }
];

function getBD(clave, base) {
    const data = localStorage.getItem(clave);
    if (!data) {
        localStorage.setItem(clave, JSON.stringify(base));
        return base;
    }
    return JSON.parse(data);
}

function setBD(clave, data) {
    localStorage.setItem(clave, JSON.stringify(data));
}

// ===================================================
// 3. NAVEGACIÓN ENTRE PESTAÑAS (TABS)
// ===================================================
document.querySelectorAll('.nav-item').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Quitar clase activa
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        document.querySelectorAll('.app-section').forEach(s => s.classList.remove('active'));

        // Activar la seleccionada
        link.classList.add('active');
        const targetId = link.getAttribute('data-target');
        document.getElementById(targetId).classList.add('active');
    });
});

// ===================================================
// 4. RENDERS Y ACTUALIZACIÓN DE INTERFAZ
// ===================================================
function actualizarTodo() {
    const vehiculos = getBD('vehiculos_db', FLOTILLA_BASE);
    const conductores = getBD('conductores_db', CONDUCTORES_BASE);
    const mantenimientos = getBD('mantenimientos_db', []);
    const gastos = getBD('gastos_db', []);

    // Métricas Panel
    document.getElementById('metric-total').textContent = vehiculos.length;
    document.getElementById('metric-disponibles').textContent = vehiculos.filter(v => v.estatus === 'Disponible').length;
    document.getElementById('metric-en-ruta').textContent = vehiculos.filter(v => v.estatus === 'En Ruta').length;
    document.getElementById('metric-mantenimiento').textContent = vehiculos.filter(v => v.estatus === 'En Mantenimiento').length;

    // Tabla Panel & Tabla Autos
    const htmlAutos = vehiculos.map(v => `
        <tr>
            <td><strong>${v.placa}</strong></td>
            <td>${v.marca} ${v.modelo}</td>
            <td>${v.km.toLocaleString()} km</td>
            <td><span class="badge badge-${v.estatus.toLowerCase().replace(' ', '-')}">${v.estatus}</span></td>
        </tr>
    `).join('');
    document.getElementById('tabla-panel-body').innerHTML = htmlAutos;

    document.getElementById('tabla-vehiculos-body').innerHTML = vehiculos.map(v => `
        <tr>
            <td><strong>${v.placa}</strong></td>
            <td>${v.marca} ${v.modelo}</td>
            <td>${v.km.toLocaleString()} km</td>
            <td><span class="badge badge-${v.estatus.toLowerCase().replace(' ', '-')}">${v.estatus}</span></td>
            <td><button class="btn-danger-sm" onclick="eliminarAuto('${v.placa}')">Baja</button></td>
        </tr>
    `).join('');

    // Tabla Conductores
    document.getElementById('tabla-conductores-body').innerHTML = conductores.map(c => `
        <tr><td><strong>${c.nombre}</strong></td><td>${c.depto}</td><td>${c.licencia}</td></tr>
    `).join('');

    // Selects dinámicos
    const optConductores = conductores.map(c => `<option value="${c.nombre}">${c.nombre} (${c.depto})</option>`).join('');
    document.getElementById('sol-empleado').innerHTML = optConductores;

    const optAutos = vehiculos.map(v => `<option value="${v.placa}">${v.placa} - ${v.marca} ${v.modelo}</option>`).join('');
    document.getElementById('mant-placa').innerHTML = optAutos;
    document.getElementById('gasto-placa').innerHTML = optAutos;

    // Tabla de Solicitudes Pendientes (La Cola)
    const colaList = colaPrestamos.obtenerTodas();
    document.getElementById('tabla-cola-body').innerHTML = colaList.length === 0 
        ? `<tr><td colspan="4" style="text-align:center; color:#94a3b8;">Sin solicitudes pendientes.</td></tr>`
        : colaList.map((s, i) => `
            <tr>
                <td><strong>Turno #${i+1}</strong></td>
                <td>${s.empleado}</td>
                <td>${s.destino}</td>
                <td><small>${s.hora}</small></td>
            </tr>
        `).join('');

    // Mantenimientos
    document.getElementById('tabla-mantenimiento-body').innerHTML = mantenimientos.map(m => `
        <tr><td><strong>${m.placa}</strong></td><td>${m.servicio}</td><td>$${m.costo}</td></tr>
    `).join('');

    // Gastos
    document.getElementById('tabla-gastos-body').innerHTML = gastos.map(g => `
        <tr><td><strong>${g.placa}</strong></td><td>${g.litros} L</td><td>$${g.monto}</td><td>${g.fecha}</td></tr>
    `).join('');
}

// ===================================================
// 5. EVENTOS DE FORMULARIOS
// ===================================================

// Registrar Vehículo
document.getElementById('form-vehiculo').addEventListener('submit', (e) => {
    e.preventDefault();
    const vehiculos = getBD('vehiculos_db', FLOTILLA_BASE);
    vehiculos.push({
        placa: document.getElementById('placa').value.toUpperCase(),
        marca: document.getElementById('marca').value,
        modelo: document.getElementById('modelo').value,
        anio: parseInt(document.getElementById('anio').value),
        km: parseInt(document.getElementById('km').value),
        estatus: 'Disponible'
    });
    setBD('vehiculos_db', vehiculos);
    e.target.reset();
    actualizarTodo();
});

// Registrar Conductor
document.getElementById('form-conductor').addEventListener('submit', (e) => {
    e.preventDefault();
    const conductores = getBD('conductores_db', CONDUCTORES_BASE);
    conductores.push({
        nombre: document.getElementById('cond-nombre').value,
        depto: document.getElementById('cond-depto').value,
        licencia: document.getElementById('cond-licencia').value
    });
    setBD('conductores_db', conductores);
    e.target.reset();
    actualizarTodo();
});

// Encolar Solicitud (ENQUEUE)
document.getElementById('form-solicitud').addEventListener('submit', (e) => {
    e.preventDefault();
    colaPrestamos.encolar({
        empleado: document.getElementById('sol-empleado').value,
        tipo: document.getElementById('sol-tipo').value,
        destino: document.getElementById('sol-destino').value,
        hora: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    });
    e.target.reset();
    actualizarTodo();
});

// Atender Solicitud (DEQUEUE)
function atenderSiguienteSolicitud() {
    if (colaPrestamos.estaVacia()) {
        alert("No hay solicitudes pendientes en la lista.");
        return;
    }

    const vehiculos = getBD('vehiculos_db', FLOTILLA_BASE);
    const libre = vehiculos.find(v => v.estatus === 'Disponible');

    if (!libre) {
        alert("No hay autos disponibles para asignar en este momento.");
        return;
    }

    const atendida = colaPrestamos.desencolar();
    libre.estatus = 'En Ruta';
    setBD('vehiculos_db', vehiculos);

    alert(`✅ Vehículo Asignado\n\nAuto: ${libre.marca} ${libre.modelo} (${libre.placa})\nConductor: ${atendida.empleado}\nDestino: ${atendida.destino}`);
    actualizarTodo();
}

// Registrar Mantenimiento
document.getElementById('form-mantenimiento').addEventListener('submit', (e) => {
    e.preventDefault();
    const placa = document.getElementById('mant-placa').value;
    const mants = getBD('mantenimientos_db', []);
    const vehiculos = getBD('vehiculos_db', FLOTILLA_BASE);

    mants.push({
        placa: placa,
        servicio: document.getElementById('mant-servicio').value,
        costo: document.getElementById('mant-costo').value
    });

    const v = vehiculos.find(x => x.placa === placa);
    if(v) v.estatus = 'En Mantenimiento';

    setBD('mantenimientos_db', mants);
    setBD('vehiculos_db', vehiculos);
    e.target.reset();
    actualizarTodo();
});

// Registrar Gasto
document.getElementById('form-gasto').addEventListener('submit', (e) => {
    e.preventDefault();
    const gastos = getBD('gastos_db', []);
    gastos.push({
        placa: document.getElementById('gasto-placa').value,
        litros: document.getElementById('gasto-litros').value,
        monto: document.getElementById('gasto-monto').value,
        fecha: new Date().toLocaleDateString()
    });
    setBD('gastos_db', gastos);
    e.target.reset();
    actualizarTodo();
});

function eliminarAuto(placa) {
    let vehiculos = getBD('vehiculos_db', FLOTILLA_BASE);
    vehiculos = vehiculos.filter(v => v.placa !== placa);
    setBD('vehiculos_db', vehiculos);
    actualizarTodo();
}

document.addEventListener('DOMContentLoaded', actualizarTodo);

// ===================================================
// CONTROL DE AUTENTICACIÓN (LOGIN / LOGOUT)
// ===================================================
function verificarSesion() {
    const sesionActiva = sessionStorage.getItem('flotillapro_session');
    const loginOverlay = document.getElementById('login-overlay');
    
    if (sesionActiva === 'true') {
        loginOverlay.classList.add('hidden');
    } else {
        loginOverlay.classList.remove('hidden');
    }
}

// Evento de Login
document.getElementById('form-login').addEventListener('submit', (e) => {
    e.preventDefault();
    const user = document.getElementById('login-user').value.trim();
    const pass = document.getElementById('login-pass').value.trim();

    // Credenciales de prueba
    if (user === 'admin' && pass === '123456') {
        sessionStorage.setItem('flotillapro_session', 'true');
        verificarSesion();
        e.target.reset();
    } else {
        alert('❌ Credenciales incorrectas.\n\nUsuario demo: admin\nContraseña: 123456');
    }
});

// Evento de Logout
document.getElementById('btn-logout').addEventListener('click', () => {
    if (confirm('¿Deseas cerrar la sesión actual?')) {
        sessionStorage.removeItem('flotillapro_session');
        verificarSesion();
    }
});

// Verificar sesión al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    verificarSesion();
});