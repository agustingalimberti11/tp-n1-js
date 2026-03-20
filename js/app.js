/**
 * Simulador HomeBanking - Entrega N°2
 * Integración DOM, Eventos y localStorage.
 * Sin uso de prompt(), alert() ni salida por consola para la interacción.
 */

// ========== DATOS Y ALMACENAMIENTO ==========

const CLAVE_CUENTA = 'homebanking_cuenta';
const CLAVE_TARJETAS = 'homebanking_tarjetas';
const CLAVE_SERVICIOS_PAGADOS = 'homebanking_servicios_pagados';
const RUTA_JSON_SERVICIOS = 'data/servicios.json';

// Se usan como respaldo si el fetch falla (por ejemplo, si se abre el HTML sin servidor).
const SERVICIOS_FALLBACK = [
  {
    codigo: 'AGUA',
    nombre: 'Agua Corriente',
    descripcion: 'Pago de factura de servicios de agua.',
    comisionFija: 120,
    comisionPorcentaje: 1.5
  },
  {
    codigo: 'LUZ',
    nombre: 'Luz Eléctrica',
    descripcion: 'Pago de factura de electricidad.',
    comisionFija: 150,
    comisionPorcentaje: 1.2
  },
  {
    codigo: 'INTERNET',
    nombre: 'Internet Hogar',
    descripcion: 'Pago de servicio de internet y conexión.',
    comisionFija: 90,
    comisionPorcentaje: 2.0
  },
  {
    codigo: 'TELEFONIA',
    nombre: 'Telefonía Móvil',
    descripcion: 'Pago de factura de telefonía móvil.',
    comisionFija: 80,
    comisionPorcentaje: 1.8
  }
];

let serviciosDisponibles = [];

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

/**
 * Obtiene el array de servicios pagados desde localStorage.
 * @returns {Array}
 */
function obtenerServiciosPagados() {
  const guardado = localStorage.getItem(CLAVE_SERVICIOS_PAGADOS);
  if (guardado) {
    try {
      const parsed = JSON.parse(guardado);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }
  return [];
}

/**
 * Guarda el array de servicios pagados en localStorage.
 * @param {Array} serviciosPagados
 */
function guardarServiciosPagados(serviciosPagados) {
  localStorage.setItem(CLAVE_SERVICIOS_PAGADOS, JSON.stringify(serviciosPagados));
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
 * Carga "servicios" desde un JSON (simula datos remotos).
 * @returns {Promise<Array>}
 */
async function cargarServiciosDesdeJSON() {
  const respuesta = await fetch(RUTA_JSON_SERVICIOS, { cache: 'no-store' });
  if (!respuesta.ok) {
    throw new Error('No se pudo cargar el archivo JSON de servicios.');
  }
  const datos = await respuesta.json();
  if (!Array.isArray(datos)) {
    throw new Error('El JSON de servicios no tiene el formato esperado.');
  }
  return datos;
}

/**
 * Busca un servicio por código.
 * @param {string} codigo
 * @returns {Object | undefined}
 */
function buscarServicioPorCodigo(codigo) {
  return serviciosDisponibles.find(function (s) {
    return String(s.codigo) === String(codigo);
  });
}

/**
 * Calcula la comisión total para un monto y servicio.
 * @param {Object} servicio
 * @param {number} monto
 * @returns {number}
 */
function calcularComision(servicio, monto) {
  const comisionFija = Number(servicio.comisionFija) || 0;
  const comisionPorcentaje = Number(servicio.comisionPorcentaje) || 0;
  return comisionFija + (monto * comisionPorcentaje) / 100;
}

/**
 * Renderiza el select de servicios con opciones desde datos cargados.
 * @param {Array} servicios
 */
function renderizarServiciosSelect(servicios) {
  const select = document.getElementById('servicios-select');
  if (!select) return;

  const opciones = servicios.map(function (s) {
    return '<option value=\"' + String(s.codigo) + '\">' + String(s.nombre) + '</option>';
  }).join('');

  select.innerHTML =
    '<option value=\"\">Seleccioná un servicio...</option>' +
    (opciones || '');
}

/**
 * Actualiza el bloque de detalle (comisión y total) en función del servicio seleccionado y monto.
 */
function renderizarDetalleServicio() {
  const select = document.getElementById('servicios-select');
  const detalle = document.getElementById('detalle-servicio');
  const inputMonto = document.getElementById('monto-servicio');

  if (!select || !detalle || !inputMonto) return;

  const servicio = buscarServicioPorCodigo(select.value);
  const monto = parseFloat(inputMonto.value);

  if (!servicio || isNaN(monto) || monto <= 0) {
    detalle.textContent = 'Seleccioná un servicio y cargá un monto válido.';
    return;
  }

  const comision = calcularComision(servicio, monto);
  const total = monto + comision;

  detalle.innerHTML =
    '<div><strong>' + String(servicio.nombre) + '</strong></div>' +
    '<div class=\"text-muted\">Comisión fija: ' + formatearMoneda(Number(servicio.comisionFija) || 0) + '</div>' +
    '<div class=\"text-muted\">Comisión %: ' + String(servicio.comisionPorcentaje || 0).replace('.', ',') + '%</div>' +
    '<div class=\"text-muted\">Comisión calculada: <strong>' + formatearMoneda(comision) + '</strong></div>' +
    '<div>Total a debitar: <strong>' + formatearMoneda(total) + '</strong></div>' +
    '<div class=\"text-muted small\">' + String(servicio.descripcion || '') + '</div>';
}

/**
 * Registra un pago de servicio: valida saldo, descuenta total y agrega movimientos al historial.
 * @param {string} codigoServicio
 * @param {number|string} monto
 * @param {string} referencia
 * @returns {{ok: boolean, error?: string}}
 */
function pagarServicio(codigoServicio, monto, referencia) {
  const montoNum = parseFloat(monto);
  if (isNaN(montoNum) || montoNum <= 0) {
    return { ok: false, error: 'monto' };
  }

  const servicio = buscarServicioPorCodigo(codigoServicio);
  if (!servicio) {
    return { ok: false, error: 'servicio' };
  }

  const referenciaLimpia = (referencia || '').trim();
  const comision = calcularComision(servicio, montoNum);
  const total = montoNum + comision;

  const cuenta = obtenerCuenta();
  if (cuenta.saldo < total) {
    return { ok: false, error: 'saldo' };
  }

  const fecha = new Date().toISOString();
  const descripcionBase = referenciaLimpia ? (' - Ref: ' + referenciaLimpia) : '';

  const movimientoPago = {
    tipo: 'extraccion',
    monto: montoNum,
    descripcion: 'Pago ' + servicio.nombre + descripcionBase,
    fecha: fecha
  };

  const movimientoComision = {
    tipo: 'extraccion',
    monto: comision,
    descripcion: 'Comisión ' + servicio.nombre + descripcionBase,
    fecha: fecha
  };

  cuenta.movimientos.push(movimientoPago);
  cuenta.movimientos.push(movimientoComision);
  cuenta.saldo -= total;
  guardarCuenta(cuenta);

  // Persistimos también un registro "extra" del flujo (para cumplir con el criterio de storage).
  const serviciosPagados = obtenerServiciosPagados();
  serviciosPagados.push({
    codigoServicio: servicio.codigo,
    nombreServicio: servicio.nombre,
    referencia: referenciaLimpia,
    monto: montoNum,
    comision: comision,
    total: total,
    fecha: fecha
  });
  guardarServiciosPagados(serviciosPagados);

  renderizarSaldo(cuenta.saldo);
  renderizarMovimientos(cuenta.movimientos, 'lista-movimientos');

  return { ok: true };
}

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
  const formServicio = document.getElementById('form-servicio');

  if (formMovimiento) {
    const tipoSelect = document.getElementById('tipo-movimiento');
    const inputMonto = document.getElementById('monto-movimiento');
    const inputDescripcion = document.getElementById('descripcion-movimiento');
    // Precarga valores de ejemplo (si el usuario no completó aún).
    if (tipoSelect && !tipoSelect.value) tipoSelect.value = 'deposito';
    if (inputMonto && !inputMonto.value) inputMonto.value = '1500';
    if (inputDescripcion && !inputDescripcion.value) inputDescripcion.value = 'Depósito de ejemplo';

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
    const inputDigitos = document.getElementById('digitos-tarjeta');
    const inputVencimiento = document.getElementById('vencimiento-tarjeta');
    if (inputDigitos && !inputDigitos.value) inputDigitos.value = '1234';
    if (inputVencimiento && !inputVencimiento.value) inputVencimiento.value = '12/26';

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

  if (formServicio) {
    // Eventos para actualizar detalle en vivo.
    const selectServicio = document.getElementById('servicios-select');
    const inputMontoServicio = document.getElementById('monto-servicio');
    const inputReferenciaServicio = document.getElementById('referencia-servicio');

    if (inputMontoServicio && !inputMontoServicio.value) inputMontoServicio.value = '2500';
    if (inputReferenciaServicio && !inputReferenciaServicio.value) inputReferenciaServicio.value = 'Cliente 2048';

    if (selectServicio) {
      selectServicio.addEventListener('change', function () {
        ocultarMensaje('mensaje-servicio');
        renderizarDetalleServicio();
      });
    }
    if (inputMontoServicio) {
      inputMontoServicio.addEventListener('input', function () {
        ocultarMensaje('mensaje-servicio');
        renderizarDetalleServicio();
      });
    }

    formServicio.addEventListener('submit', function (e) {
      e.preventDefault();
      ocultarMensaje('mensaje-servicio');

      const codigoServicio = document.getElementById('servicios-select').value;
      const monto = document.getElementById('monto-servicio').value;
      const referencia = document.getElementById('referencia-servicio').value;

      const resultado = pagarServicio(codigoServicio, monto, referencia);
      if (!resultado.ok) {
        if (resultado.error === 'saldo') {
          mostrarMensaje('mensaje-servicio', 'Saldo insuficiente para pagar el servicio.', false);
        } else if (resultado.error === 'servicio') {
          mostrarMensaje('mensaje-servicio', 'Seleccioná un servicio válido.', false);
        } else {
          mostrarMensaje('mensaje-servicio', 'Ingresá un monto válido mayor a cero.', false);
        }
        return;
      }

      mostrarMensaje('mensaje-servicio', 'Pago de servicio registrado correctamente.', true);
      formServicio.reset();
      // El reset borra el select; lo dejamos listo para que el usuario elija nuevamente.
      if (selectServicio) selectServicio.value = '';
      renderizarDetalleServicio();
    });
  }
}

/**
 * Carga inicial: lee datos de localStorage y pinta el DOM.
 */
async function iniciarSimulador() {
  const cuenta = obtenerCuenta();
  const tarjetas = obtenerTarjetas();

  renderizarSaldo(cuenta.saldo);
  renderizarMovimientos(cuenta.movimientos, 'lista-movimientos');
  renderizarTarjetas(tarjetas, 'lista-tarjetas');

  // Carga asíncrona de JSON (datos simulados/remotos).
  const selectServicios = document.getElementById('servicios-select');
  if (selectServicios) {
    selectServicios.disabled = true;
    selectServicios.innerHTML = '<option value=\"\">Cargando...</option>';
    try {
      serviciosDisponibles = await cargarServiciosDesdeJSON();
    } catch (e) {
      serviciosDisponibles = SERVICIOS_FALLBACK;
    }
    renderizarServiciosSelect(serviciosDisponibles);
    selectServicios.disabled = false;
  }

  inicializarEventos();
  renderizarDetalleServicio();
}

// Ejecutar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { iniciarSimulador(); });
} else {
  iniciarSimulador();
}
