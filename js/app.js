/**
 * Simulador HomeBanking - Entrega N°2
 * Integración DOM, Eventos y localStorage.
 * Sin uso de prompt(), alert() ni salida por consola para la interacción.
 */

// ========== DATOS Y ALMACENAMIENTO ==========

const CLAVE_CUENTA = 'homebanking_cuenta';
const CLAVE_TARJETAS = 'homebanking_tarjetas';

/**
 * Obtiene los datos de la cuenta desde localStorage o devuelve valores por defecto.
 * @returns {Object} Objeto con saldo y array de movimientos.
 */
function obtenerCuenta() {
  const guardado = localStorage.getItem(CLAVE_CUENTA);
  if (guardado) {
    try {
      return JSON.parse(guardado);
    } catch (e) {
      return cuentaInicial();
    }
  }
  return cuentaInicial();
}

/**
 * Devuelve la estructura inicial de la cuenta.
 * @returns {Object} { saldo: number, movimientos: Array }
 */
function cuentaInicial() {
  return {
    saldo: 0,
    movimientos: []
  };
}

/**
 * Guarda la cuenta en localStorage.
 * @param {Object} cuenta - Objeto cuenta a persistir.
 */
function guardarCuenta(cuenta) {
  localStorage.setItem(CLAVE_CUENTA, JSON.stringify(cuenta));
}

/**
 * Obtiene el array de tarjetas desde localStorage.
 * @returns {Array} Array de objetos tarjeta.
 */
function obtenerTarjetas() {
  const guardado = localStorage.getItem(CLAVE_TARJETAS);
  if (guardado) {
    try {
      return JSON.parse(guardado);
    } catch (e) {
      return [];
    }
  }
  return [];
}

/**
 * Guarda el array de tarjetas en localStorage.
 * @param {Array} tarjetas - Array de tarjetas.
 */
function guardarTarjetas(tarjetas) {
  localStorage.setItem(CLAVE_TARJETAS, JSON.stringify(tarjetas));
}

// ========== RENDERIZADO EN EL DOM ==========

/**
 * Actualiza en el DOM el saldo mostrado.
 * @param {number} saldo - Saldo actual.
 */
function renderizarSaldo(saldo) {
  const elementoSaldo = document.getElementById('saldo-actual');
  if (elementoSaldo) {
    elementoSaldo.textContent = formatearMoneda(saldo);
  }
}

/**
 * Formatea un número como moneda.
 * @param {number} valor - Cantidad a formatear.
 * @returns {string} Texto formateado (ej: "$ 1.234,56").
 */
function formatearMoneda(valor) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS'
  }).format(valor);
}

/**
 * Renderiza la lista de movimientos en el contenedor del DOM.
 * @param {Array} movimientos - Array de objetos movimiento.
 * @param {string} idContenedor - ID del elemento contenedor.
 */
function renderizarMovimientos(movimientos, idContenedor) {
  const contenedor = document.getElementById(idContenedor);
  if (!contenedor) return;

  if (!movimientos || movimientos.length === 0) {
    contenedor.innerHTML = '<p class="text-muted mb-0 py-3 text-center">No hay movimientos registrados.</p>';
    return;
  }

  // Ordenar por fecha descendente (más recientes primero)
  const ordenados = [...movimientos].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  contenedor.innerHTML = ordenados.map(function (mov) {
    const esDeposito = mov.tipo === 'deposito';
    const claseBadge = esDeposito ? 'badge-deposito' : 'badge-extraccion';
    const signo = esDeposito ? '+' : '-';
    const fechaFormateada = new Date(mov.fecha).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    return (
      '<div class="movimiento-item">' +
        '<div>' +
          '<span class="badge ' + claseBadge + ' me-2">' + (esDeposito ? 'Depósito' : 'Extracción') + '</span>' +
          '<span>' + (mov.descripcion || '-') + '</span>' +
          '<small class="d-block text-muted">' + fechaFormateada + '</small>' +
        '</div>' +
        '<strong class="' + (esDeposito ? 'text-success' : 'text-danger') + '">' + signo + formatearMoneda(mov.monto) + '</strong>' +
      '</div>'
    );
  }).join('');
}

/**
 * Renderiza la lista de tarjetas en el DOM.
 * @param {Array} tarjetas - Array de objetos tarjeta.
 * @param {string} idContenedor - ID del elemento contenedor.
 */
function renderizarTarjetas(tarjetas, idContenedor) {
  const contenedor = document.getElementById(idContenedor);
  if (!contenedor) return;

  if (!tarjetas || tarjetas.length === 0) {
    contenedor.innerHTML = '<p class="text-muted mb-0 py-3">No tenés tarjetas cargadas.</p>';
    return;
  }

  contenedor.innerHTML = tarjetas.map(function (t, index) {
    return (
      '<div class="tarjeta-item d-flex justify-content-between align-items-center">' +
        '<div>' +
          '<span class="fw-bold">' + (t.tipo || 'Tarjeta') + '</span> ' +
          '<span class="text-muted">**** ' + (t.ultimosDigitos || '') + '</span>' +
          '<small class="d-block">Vence: ' + (t.vencimiento || '-') + '</small>' +
        '</div>' +
        '<button type="button" class="btn btn-outline-danger btn-sm" data-indice="' + index + '" data-accion="eliminar-tarjeta">Eliminar</button>' +
      '</div>'
    );
  }).join('');

  // Delegación de eventos para eliminar tarjeta
  contenedor.querySelectorAll('[data-accion="eliminar-tarjeta"]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const indice = parseInt(this.getAttribute('data-indice'), 10);
      eliminarTarjeta(indice);
    });
  });
}

/**
 * Muestra un mensaje al usuario en el elemento indicado (éxito o error).
 * @param {string} idElemento - ID del elemento mensaje.
 * @param {string} texto - Texto a mostrar.
 * @param {boolean} esExito - true para estilo éxito, false para error.
 */
function mostrarMensaje(idElemento, texto, esExito) {
  const el = document.getElementById(idElemento);
  if (!el) return;
  el.textContent = texto;
  el.className = 'mensaje-usuario visible ' + (esExito ? 'exito' : 'error');
  el.setAttribute('aria-live', 'polite');
}

/**
 * Oculta el mensaje del usuario.
 * @param {string} idElemento - ID del elemento mensaje.
 */
function ocultarMensaje(idElemento) {
  const el = document.getElementById(idElemento);
  if (!el) return;
  el.className = 'mensaje-usuario';
  el.textContent = '';
}

// ========== LÓGICA DE NEGOCIO ==========

/**
 * Agrega un movimiento (depósito o extracción) y actualiza saldo y DOM.
 * @param {string} tipo - 'deposito' o 'extraccion'.
 * @param {number} monto - Monto (siempre positivo).
 * @param {string} descripcion - Descripción opcional.
 * @returns {boolean} true si se aplicó, false si no (ej: saldo insuficiente).
 */
function agregarMovimiento(tipo, monto, descripcion) {
  const montoNum = parseFloat(monto);
  if (isNaN(montoNum) || montoNum <= 0) return false;

  const cuenta = obtenerCuenta();
  if (tipo === 'extraccion' && cuenta.saldo < montoNum) return false;

  const movimiento = {
    tipo: tipo,
    monto: montoNum,
    descripcion: (descripcion || '').trim() || 'Sin descripción',
    fecha: new Date().toISOString()
  };

  cuenta.movimientos.push(movimiento);
  cuenta.saldo += tipo === 'deposito' ? montoNum : -montoNum;
  guardarCuenta(cuenta);

  renderizarSaldo(cuenta.saldo);
  renderizarMovimientos(cuenta.movimientos, 'lista-movimientos');
  return true;
}

/**
 * Agrega una tarjeta y la persiste en localStorage.
 * @param {string} tipo - Tipo de tarjeta (ej: Débito, Crédito).
 * @param {string} ultimosDigitos - Últimos 4 dígitos.
 * @param {string} vencimiento - Fecha de vencimiento.
 * @returns {boolean} true si se agregó correctamente.
 */
function agregarTarjeta(tipo, ultimosDigitos, vencimiento) {
  const tarjetas = obtenerTarjetas();
  tarjetas.push({
    tipo: (tipo || '').trim() || 'Tarjeta',
    ultimosDigitos: (ultimosDigitos || '').trim().slice(-4),
    vencimiento: (vencimiento || '').trim() || '-'
  });
  guardarTarjetas(tarjetas);
  renderizarTarjetas(tarjetas, 'lista-tarjetas');
  return true;
}

/**
 * Elimina una tarjeta por índice y actualiza el DOM y localStorage.
 * @param {number} indice - Índice en el array de tarjetas.
 */
function eliminarTarjeta(indice) {
  const tarjetas = obtenerTarjetas();
  if (indice < 0 || indice >= tarjetas.length) return;
  tarjetas.splice(indice, 1);
  guardarTarjetas(tarjetas);
  renderizarTarjetas(tarjetas, 'lista-tarjetas');
}

// ========== EVENTOS Y INICIALIZACIÓN ==========

/**
 * Asocia los escuchadores de eventos a formularios y botones.
 */
function inicializarEventos() {
  const formMovimiento = document.getElementById('form-movimiento');
  const formTarjeta = document.getElementById('form-tarjeta');

  if (formMovimiento) {
    formMovimiento.addEventListener('submit', function (e) {
      e.preventDefault();
      ocultarMensaje('mensaje-movimiento');
      const tipo = document.getElementById('tipo-movimiento').value;
      const monto = document.getElementById('monto-movimiento').value;
      const descripcion = document.getElementById('descripcion-movimiento').value;
      const ok = agregarMovimiento(tipo, monto, descripcion);
      if (ok) {
        mostrarMensaje('mensaje-movimiento', 'Movimiento registrado correctamente.', true);
        formMovimiento.reset();
      } else {
        if (tipo === 'extraccion') {
          mostrarMensaje('mensaje-movimiento', 'Saldo insuficiente para realizar la extracción.', false);
        } else {
          mostrarMensaje('mensaje-movimiento', 'Ingresá un monto válido mayor a cero.', false);
        }
      }
    });
  }

  if (formTarjeta) {
    formTarjeta.addEventListener('submit', function (e) {
      e.preventDefault();
      ocultarMensaje('mensaje-tarjeta');
      const tipo = document.getElementById('tipo-tarjeta').value;
      const digitos = document.getElementById('digitos-tarjeta').value;
      const vencimiento = document.getElementById('vencimiento-tarjeta').value;
      agregarTarjeta(tipo, digitos, vencimiento);
      mostrarMensaje('mensaje-tarjeta', 'Tarjeta agregada correctamente.', true);
      formTarjeta.reset();
    });
  }
}

/**
 * Carga inicial: lee datos de localStorage y pinta el DOM.
 */
function iniciarSimulador() {
  const cuenta = obtenerCuenta();
  const tarjetas = obtenerTarjetas();

  renderizarSaldo(cuenta.saldo);
  renderizarMovimientos(cuenta.movimientos, 'lista-movimientos');
  renderizarTarjetas(tarjetas, 'lista-tarjetas');
  inicializarEventos();
}

// Ejecutar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', iniciarSimulador);
} else {
  iniciarSimulador();
}
