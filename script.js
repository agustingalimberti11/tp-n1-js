// Estado inicial
let saldo = 50000.00;
let transacciones = [
    {
        tipo: 'ingreso',
        monto: 10000.00,
        descripcion: 'Depósito inicial',
        fecha: new Date('2024-01-15')
    },
    {
        tipo: 'egreso',
        monto: 2500.00,
        descripcion: 'Transferencia a Juan Pérez',
        fecha: new Date('2024-01-20')
    },
    {
        tipo: 'ingreso',
        monto: 5000.00,
        descripcion: 'Sueldo',
        fecha: new Date('2024-02-01')
    },
    {
        tipo: 'egreso',
        monto: 1500.00,
        descripcion: 'Pago de servicios',
        fecha: new Date('2024-02-05')
    }
];

// Elementos del DOM
const balanceElement = document.getElementById('balance');
const transactionsList = document.getElementById('transactionsList');
const btnIngresar = document.getElementById('btnIngresar');
const btnTransferir = document.getElementById('btnTransferir');
const modalIngresar = document.getElementById('modalIngresar');
const modalTransferir = document.getElementById('modalTransferir');
const closeIngresar = document.getElementById('closeIngresar');
const closeTransferir = document.getElementById('closeTransferir');
const confirmarIngresar = document.getElementById('confirmarIngresar');
const confirmarTransferir = document.getElementById('confirmarTransferir');

// Formatear número como moneda
function formatearMoneda(monto) {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 2
    }).format(monto);
}

// Formatear fecha
function formatearFecha(fecha) {
    return new Intl.DateTimeFormat('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(fecha);
}

// Actualizar saldo en pantalla
function actualizarSaldo() {
    balanceElement.textContent = formatearMoneda(saldo);
    balanceElement.classList.add('pulse');
    setTimeout(() => {
        balanceElement.classList.remove('pulse');
    }, 500);
}

// Renderizar transacciones
function renderizarTransacciones() {
    transactionsList.innerHTML = '';
    
    // Ordenar transacciones por fecha (más recientes primero)
    const transaccionesOrdenadas = [...transacciones].sort((a, b) => b.fecha - a.fecha);
    
    transaccionesOrdenadas.forEach(transaccion => {
        const item = document.createElement('div');
        item.className = `transaction-item ${transaccion.tipo}`;
        
        const info = document.createElement('div');
        info.className = 'transaction-info';
        
        const descripcion = document.createElement('div');
        descripcion.className = 'transaction-descripcion';
        descripcion.textContent = transaccion.descripcion;
        
        const fecha = document.createElement('div');
        fecha.className = 'transaction-fecha';
        fecha.textContent = formatearFecha(transaccion.fecha);
        
        info.appendChild(descripcion);
        info.appendChild(fecha);
        
        const monto = document.createElement('div');
        monto.className = `transaction-monto ${transaccion.tipo}`;
        const signo = transaccion.tipo === 'ingreso' ? '+' : '-';
        monto.textContent = `${signo} ${formatearMoneda(transaccion.monto)}`;
        
        item.appendChild(info);
        item.appendChild(monto);
        
        transactionsList.appendChild(item);
    });
}

// Abrir modal de ingresar
btnIngresar.addEventListener('click', () => {
    modalIngresar.classList.add('show');
    document.getElementById('montoIngresar').value = '';
    document.getElementById('descripcionIngresar').value = '';
});

// Cerrar modal de ingresar
closeIngresar.addEventListener('click', () => {
    modalIngresar.classList.remove('show');
});

// Confirmar ingreso
confirmarIngresar.addEventListener('click', () => {
    const monto = parseFloat(document.getElementById('montoIngresar').value);
    const descripcion = document.getElementById('descripcionIngresar').value || 'Ingreso de dinero';
    
    if (isNaN(monto) || monto <= 0) {
        alert('Por favor, ingrese un monto válido');
        return;
    }
    
    // Actualizar saldo
    saldo += monto;
    
    // Agregar transacción
    transacciones.push({
        tipo: 'ingreso',
        monto: monto,
        descripcion: descripcion,
        fecha: new Date()
    });
    
    // Actualizar UI
    actualizarSaldo();
    renderizarTransacciones();
    
    // Cerrar modal
    modalIngresar.classList.remove('show');
    
    // Animación de éxito
    balanceElement.classList.add('updated');
    setTimeout(() => {
        balanceElement.classList.remove('updated');
    }, 1000);
});

// Abrir modal de transferir
btnTransferir.addEventListener('click', () => {
    modalTransferir.classList.add('show');
    document.getElementById('montoTransferir').value = '';
    document.getElementById('destinatarioTransferir').value = '';
    document.getElementById('descripcionTransferir').value = '';
});

// Cerrar modal de transferir
closeTransferir.addEventListener('click', () => {
    modalTransferir.classList.remove('show');
});

// Confirmar transferencia
confirmarTransferir.addEventListener('click', () => {
    const monto = parseFloat(document.getElementById('montoTransferir').value);
    const destinatario = document.getElementById('destinatarioTransferir').value.trim();
    const descripcion = document.getElementById('descripcionTransferir').value || 'Transferencia';
    
    if (isNaN(monto) || monto <= 0) {
        alert('Por favor, ingrese un monto válido');
        return;
    }
    
    if (!destinatario) {
        alert('Por favor, ingrese un destinatario');
        return;
    }
    
    if (monto > saldo) {
        alert('Saldo insuficiente');
        return;
    }
    
    // Actualizar saldo
    saldo -= monto;
    
    // Agregar transacción
    transacciones.push({
        tipo: 'egreso',
        monto: monto,
        descripcion: `${descripcion} - ${destinatario}`,
        fecha: new Date()
    });
    
    // Actualizar UI
    actualizarSaldo();
    renderizarTransacciones();
    
    // Cerrar modal
    modalTransferir.classList.remove('show');
    
    // Animación de éxito
    balanceElement.classList.add('updated');
    setTimeout(() => {
        balanceElement.classList.remove('updated');
    }, 1000);
});

// Cerrar modales al hacer clic fuera
window.addEventListener('click', (e) => {
    if (e.target === modalIngresar) {
        modalIngresar.classList.remove('show');
    }
    if (e.target === modalTransferir) {
        modalTransferir.classList.remove('show');
    }
});

// Inicializar
actualizarSaldo();
renderizarTransacciones();

