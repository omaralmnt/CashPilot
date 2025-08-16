const pool = require('../conexion');

const registrarTransferencia = async (req, res) => {
  const { datosTransferencia } = req.body;
  
  // Validar que datosTransferencia existe
  if (!datosTransferencia) {
    return res.status(400).json({ 
      error: 'Faltan datos de la transferencia. Se esperaba "datosTransferencia" en el body.' 
    });
  }
  
  // Extraer los datos necesarios del objeto datosTransferencia
  const { 
    monto, 
    concepto, 
    id_cuenta_origen, 
    id_cuenta_destino, 
    id_usuario,
    tipo_transaccion = 'transfer', // Por defecto es transferencia interna
    nombre_destinatario = null,
    id_categoria = null,
    comision = 0
  } = datosTransferencia;

  // Validar campos obligatorios básicos
  if (!monto || !id_usuario) {
    return res.status(400).json({ 
      error: 'Faltan campos obligatorios: monto, id_usuario' 
    });
  }

  // Validaciones específicas por tipo de transacción
  if (tipo_transaccion === 'transfer') {
    if (!id_cuenta_origen || !id_cuenta_destino) {
      return res.status(400).json({ 
        error: 'Para transferencias internas se requieren: id_cuenta_origen, id_cuenta_destino' 
      });
    }
    
    if (id_cuenta_origen === id_cuenta_destino) {
      return res.status(400).json({ 
        error: 'La cuenta origen y destino no pueden ser la misma' 
      });
    }
  } else if (tipo_transaccion === 'payment') {
    if (!id_cuenta_origen || !nombre_destinatario || !id_categoria) {
      return res.status(400).json({ 
        error: 'Para pagos a terceros se requieren: id_cuenta_origen, nombre_destinatario, id_categoria' 
      });
    }
  } else if (tipo_transaccion === 'receive') {
    if (!id_cuenta_destino || !nombre_destinatario) {
      return res.status(400).json({ 
        error: 'Para recibir dinero se requieren: id_cuenta_destino, nombre_destinatario' 
      });
    }
  } else {
    return res.status(400).json({ 
      error: 'Tipo de transacción inválido. Debe ser: transfer, payment o receive' 
    });
  }

  // Validar que el monto sea positivo
  if (monto <= 0) {
    return res.status(400).json({ 
      error: 'El monto debe ser mayor a 0' 
    });
  }

  try {
    // Verificar que las cuentas involucradas existan
    const cuentasAVerificar = [];
    if (id_cuenta_origen) cuentasAVerificar.push(id_cuenta_origen);
    if (id_cuenta_destino) cuentasAVerificar.push(id_cuenta_destino);

    if (cuentasAVerificar.length > 0) {
      const queryVerificarCuentas = `
        SELECT id_cuenta FROM cuenta WHERE id_cuenta = ANY($1)
      `;
      const resultCuentas = await pool.query(queryVerificarCuentas, [cuentasAVerificar]);

      if (resultCuentas.rowCount !== cuentasAVerificar.length) {
        return res.status(404).json({ 
          error: 'Una o más cuentas no existen' 
        });
      }
    }

    // Verificar que el usuario exista
    const queryVerificarUsuario = `
      SELECT id_usuario FROM usuario WHERE id_usuario = $1
    `;
    const resultUsuario = await pool.query(queryVerificarUsuario, [id_usuario]);

    if (resultUsuario.rowCount === 0) {
      return res.status(404).json({ 
        error: 'El usuario no existe' 
      });
    }

    // Verificar que la categoría exista (solo para pagos)
    if (tipo_transaccion === 'payment' && id_categoria) {
      const queryVerificarCategoria = `
        SELECT id_categoria FROM categoria WHERE id_categoria = $1
      `;
      const resultCategoria = await pool.query(queryVerificarCategoria, [id_categoria]);

      if (resultCategoria.rowCount === 0) {
        return res.status(404).json({ 
          error: 'La categoría seleccionada no existe' 
        });
      }
    }

    // Verificar saldo suficiente solo para transferencias y pagos (no para recepciones)
    if ((tipo_transaccion === 'transfer' || tipo_transaccion === 'payment') && id_cuenta_origen) {
      const queryVerificarSaldo = `
        SELECT saldo FROM cuenta WHERE id_cuenta = $1
      `;
      const resultSaldo = await pool.query(queryVerificarSaldo, [id_cuenta_origen]);

      const totalDebitar = parseFloat(monto) + parseFloat(comision);
      if (resultSaldo.rows[0].saldo < totalDebitar) {
        return res.status(400).json({ 
          error: `Saldo insuficiente en la cuenta origen. Se requiere $${totalDebitar} (monto: $${monto} + comisión: $${comision})` 
        });
      }
    }

    // Iniciar transacción para mantener consistencia
    await pool.query('BEGIN');

    try {
      // Insertar la nueva transferencia
      const queryInsertar = `
        INSERT INTO transferencia (
          monto, concepto, id_cuenta_origen, id_cuenta_destino, id_usuario,
          tipo_transaccion, nombre_destinatario, id_categoria, comision, estado
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id_transferencia, monto, fecha_hora, concepto, id_cuenta_origen, 
                  id_cuenta_destino, id_usuario, tipo_transaccion, nombre_destinatario, 
                  id_categoria, comision, estado
      `;

      const result = await pool.query(queryInsertar, [
        monto, 
        concepto || null,
        id_cuenta_origen || null,
        id_cuenta_destino || null,
        id_usuario,
        tipo_transaccion,
        nombre_destinatario,
        id_categoria || null,
        comision,
        'completada' // Estado por defecto
      ]);

      // Actualizar saldos según el tipo de transacción
      if (tipo_transaccion === 'transfer') {
        // Transferencia interna: restar de origen y sumar a destino
        await pool.query(
          'UPDATE cuenta SET saldo = saldo - $1 WHERE id_cuenta = $2',
          [parseFloat(monto) + parseFloat(comision), id_cuenta_origen]
        );

        await pool.query(
          'UPDATE cuenta SET saldo = saldo + $1 WHERE id_cuenta = $2',
          [monto, id_cuenta_destino]
        );
      } else if (tipo_transaccion === 'payment') {
        // Pago a tercero: solo restar de cuenta origen
        await pool.query(
          'UPDATE cuenta SET saldo = saldo - $1 WHERE id_cuenta = $2',
          [parseFloat(monto) + parseFloat(comision), id_cuenta_origen]
        );
      } else if (tipo_transaccion === 'receive') {
        // Recibir dinero: solo sumar a cuenta destino
        await pool.query(
          'UPDATE cuenta SET saldo = saldo + $1 WHERE id_cuenta = $2',
          [monto, id_cuenta_destino]
        );
      }

      // Confirmar transacción
      await pool.query('COMMIT');

      const transferencia = result.rows[0];

      // Preparar respuesta según el tipo
      const tipoTexto = {
        'transfer': 'Transferencia interna',
        'payment': 'Pago a tercero',
        'receive': 'Dinero recibido'
      };

      res.status(201).json({
        mensaje: `${tipoTexto[tipo_transaccion]} registrada exitosamente`,
        transferencia: {
          id_transferencia: transferencia.id_transferencia,
          monto: transferencia.monto,
          fecha_hora: transferencia.fecha_hora,
          concepto: transferencia.concepto,
          id_cuenta_origen: transferencia.id_cuenta_origen,
          id_cuenta_destino: transferencia.id_cuenta_destino,
          id_usuario: transferencia.id_usuario,
          tipo_transaccion: transferencia.tipo_transaccion,
          nombre_destinatario: transferencia.nombre_destinatario,
          id_categoria: transferencia.id_categoria,
          comision: transferencia.comision,
          estado: transferencia.estado
        }
      });

    } catch (error) {
      // Revertir transacción en caso de error
      await pool.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error al registrar transferencia:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Función para pagos a terceros
const registrarPagoTercero = async (req, res) => {
  console.log('Body recibido en pago tercero:', req.body);
  
  const { datosPago } = req.body;
  
  // Validar que datosPago existe
  if (!datosPago) {
    return res.status(400).json({ 
      error: 'Faltan datos del pago. Se esperaba "datosPago" en el body.' 
    });
  }
  
  // Restructurar para usar la función principal
  const datosTransferencia = {
    monto: datosPago.monto,
    concepto: datosPago.concepto,
    id_cuenta_origen: datosPago.id_cuenta_origen,
    id_usuario: datosPago.id_usuario,
    tipo_transaccion: 'payment',
    nombre_destinatario: datosPago.destinatario?.nombre || datosPago.nombre_destinatario,
    id_categoria: datosPago.id_categoria,
    comision: datosPago.comision || 0
  };

  console.log('Datos restructurados para pago:', datosTransferencia);

  // Llamar a la función principal con los datos restructurados
  req.body.datosTransferencia = datosTransferencia;
  return registrarTransferencia(req, res);
};

// Función para recibir dinero
const registrarRecepcionDinero = async (req, res) => {
  console.log('Body recibido en recepción:', req.body);
  
  const { datosRecepcion } = req.body;
  
  // Validar que datosRecepcion existe
  if (!datosRecepcion) {
    return res.status(400).json({ 
      error: 'Faltan datos de la recepción. Se esperaba "datosRecepcion" en el body.' 
    });
  }
  
  // Restructurar para usar la función principal
  const datosTransferencia = {
    monto: datosRecepcion.monto,
    concepto: datosRecepcion.concepto,
    id_cuenta_destino: datosRecepcion.id_cuenta_destino,
    id_usuario: datosRecepcion.id_usuario,
    tipo_transaccion: 'receive',
    nombre_destinatario: datosRecepcion.remitente?.nombre || datosRecepcion.nombre_remitente,
    id_categoria: null, // Las recepciones no tienen categoría
    comision: 0 // Las recepciones no tienen comisión
  };

  console.log('Datos restructurados para recepción:', datosTransferencia);

  // Llamar a la función principal con los datos restructurados
  req.body.datosTransferencia = datosTransferencia;
  return registrarTransferencia(req, res);
};

const obtenerTransferenciasUsuario = async (req, res) => {
  try {
    const { id_usuario } = req.params;
    
    // Validar que el ID sea válido
    if (!id_usuario || isNaN(id_usuario)) {
      return res.status(400).json({
        error: 'ID de usuario inválido'
      });
    }

    // Verificar que el usuario exista
    const queryVerificarUsuario = `
      SELECT id_usuario FROM usuario WHERE id_usuario = $1
    `;
    const resultUsuario = await pool.query(queryVerificarUsuario, [id_usuario]);

    if (resultUsuario.rowCount === 0) {
      return res.status(404).json({ 
        error: 'El usuario no existe' 
      });
    }

    // Consulta SQL actualizada para obtener todas las transacciones con información completa
    const query = `
      SELECT 
        t.id_transferencia,
        t.monto,
        t.fecha_hora,
        t.concepto,
        t.id_cuenta_origen,
        t.id_cuenta_destino,
        t.id_usuario,
        t.tipo_transaccion,
        t.nombre_destinatario,
        t.id_categoria,
        t.comision,
        t.estado,
        co.descripcion as cuenta_origen_descripcion,
        co.numero as cuenta_origen_numero,
        cd.descripcion as cuenta_destino_descripcion,
        cd.numero as cuenta_destino_numero,
        bo.descripcion as banco_origen,
        bd.descripcion as banco_destino,
        tco.descripcion as tipo_cuenta_origen,
        tcd.descripcion as tipo_cuenta_destino,
        uo.nombre as usuario_nombre,
        ud.nombre as usuario_destino_nombre,
        cat.descripcion as categoria_descripcion
      FROM transferencia t
      LEFT JOIN cuenta co ON t.id_cuenta_origen = co.id_cuenta
      LEFT JOIN cuenta cd ON t.id_cuenta_destino = cd.id_cuenta  
      LEFT JOIN banco bo ON co.id_banco = bo.id_banco
      LEFT JOIN banco bd ON cd.id_banco = bd.id_banco
      LEFT JOIN tipo_cuenta tco ON co.id_tipo_cuenta = tco.id_tipo_cuenta
      LEFT JOIN tipo_cuenta tcd ON cd.id_tipo_cuenta = tcd.id_tipo_cuenta
      LEFT JOIN usuario uo ON t.id_usuario = uo.id_usuario
      LEFT JOIN usuario ud ON cd.id_usuario = ud.id_usuario
      LEFT JOIN categoria cat ON t.id_categoria = cat.id_categoria
      WHERE t.id_usuario = $1
      ORDER BY t.fecha_hora DESC
    `;

    // Ejecutar consulta con PostgreSQL
    const result = await pool.query(query, [id_usuario]);
    const transferencias = result.rows;

    // Responder con las transferencias
    res.status(200).json({
      success: true,
      data: transferencias,
      total: transferencias.length,
      mensaje: transferencias.length > 0 ? 
        `Se encontraron ${transferencias.length} transacciones` : 
        'No se encontraron transacciones para este usuario'
    });

  } catch (error) {
    console.error('Error al obtener transferencias:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
};

// Función para obtener todas las categorías disponibles
const obtenerCategorias = async (req, res) => {
  try {
    const { id_usuario } = req.params;

    const query = `
      SELECT 
        id_categoria,
        descripcion
      FROM categoria
      WHERE id_usuario IS NULL OR id_usuario = $1
      ORDER BY descripcion ASC
    `;

    const result = await pool.query(query, [id_usuario]);

    res.status(200).json({
      success: true,
      data: result.rows,
      total: result.rows.length,
      mensaje: result.rows.length > 0 ? 
        `Se encontraron ${result.rows.length} categorías disponibles` : 
        'No hay categorías disponibles'
    });

  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
};

const crearCategoriaPersonalizada = async (req, res) => {
  try {
    const { id_usuario } = req.params;
    const { descripcion } = req.body;

    // Validaciones básicas
    if (!id_usuario || isNaN(id_usuario)) {
      return res.status(400).json({
        error: 'ID de usuario inválido'
      });
    }

    if (!descripcion || descripcion.trim() === '') {
      return res.status(400).json({
        error: 'La descripción de la categoría es obligatoria'
      });
    }

    // Verificar que el usuario exista
    const queryVerificarUsuario = `
      SELECT id_usuario FROM usuario WHERE id_usuario = $1
    `;
    const resultUsuario = await pool.query(queryVerificarUsuario, [id_usuario]);

    if (resultUsuario.rowCount === 0) {
      return res.status(404).json({ 
        error: 'El usuario no existe' 
      });
    }

    // Verificar que no exista una categoría con la misma descripción para este usuario
    const queryVerificarCategoria = `
      SELECT id_categoria FROM categoria 
      WHERE LOWER(TRIM(descripcion)) = LOWER(TRIM($1)) 
      AND (id_usuario = $2 OR id_usuario IS NULL)
    `;
    const resultCategoria = await pool.query(queryVerificarCategoria, [descripcion.trim(), id_usuario]);

    if (resultCategoria.rowCount > 0) {
      return res.status(409).json({
        error: 'Ya existe una categoría con esta descripción'
      });
    }

    // Insertar la nueva categoría
    const queryInsertar = `
      INSERT INTO categoria (descripcion, id_usuario)
      VALUES ($1, $2)
      RETURNING id_categoria, descripcion, id_usuario
    `;

    const result = await pool.query(queryInsertar, [
      descripcion.trim(),
      id_usuario
    ]);

    const nuevaCategoria = result.rows[0];

    res.status(201).json({
      success: true,
      mensaje: 'Categoría personalizada creada exitosamente',
      data: nuevaCategoria
    });

  } catch (error) {
    console.error('Error al crear categoría personalizada:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
};

// Función para obtener solo las categorías personalizadas del usuario
const obtenerCategoriasPersonalizadas = async (req, res) => {
  try {
    const { id_usuario } = req.params;

    if (!id_usuario || isNaN(id_usuario)) {
      return res.status(400).json({
        error: 'ID de usuario inválido'
      });
    }

    // Verificar que el usuario exista
    const queryVerificarUsuario = `
      SELECT id_usuario FROM usuario WHERE id_usuario = $1
    `;
    const resultUsuario = await pool.query(queryVerificarUsuario, [id_usuario]);

    if (resultUsuario.rowCount === 0) {
      return res.status(404).json({ 
        error: 'El usuario no existe' 
      });
    }

    const query = `
      SELECT 
        id_categoria,
        descripcion,
        id_usuario
      FROM categoria
      WHERE id_usuario = $1
      ORDER BY descripcion ASC
    `;

    const result = await pool.query(query, [id_usuario]);

    res.status(200).json({
      success: true,
      data: result.rows,
      total: result.rows.length,
      mensaje: result.rows.length > 0 ? 
        `Se encontraron ${result.rows.length} categorías personalizadas` : 
        'No tienes categorías personalizadas'
    });

  } catch (error) {
    console.error('Error al obtener categorías personalizadas:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
};

// Función para actualizar una categoría personalizada
const actualizarCategoriaPersonalizada = async (req, res) => {
  try {
    const { id_usuario, id_categoria } = req.params;
    const { descripcion } = req.body;

    // Validaciones básicas
    if (!id_usuario || isNaN(id_usuario)) {
      return res.status(400).json({
        error: 'ID de usuario inválido'
      });
    }

    if (!id_categoria || isNaN(id_categoria)) {
      return res.status(400).json({
        error: 'ID de categoría inválido'
      });
    }

    if (!descripcion || descripcion.trim() === '') {
      return res.status(400).json({
        error: 'La descripción es obligatoria'
      });
    }

    // Verificar que la categoría existe y pertenece al usuario
    const queryVerificarCategoria = `
      SELECT id_categoria FROM categoria 
      WHERE id_categoria = $1 AND id_usuario = $2
    `;
    const resultCategoria = await pool.query(queryVerificarCategoria, [id_categoria, id_usuario]);

    if (resultCategoria.rowCount === 0) {
      return res.status(404).json({
        error: 'La categoría no existe o no pertenece a este usuario'
      });
    }

    // Verificar duplicados
    const queryVerificarDuplicado = `
      SELECT id_categoria FROM categoria 
      WHERE LOWER(TRIM(descripcion)) = LOWER(TRIM($1)) 
      AND (id_usuario = $2 OR id_usuario IS NULL)
      AND id_categoria != $3
    `;
    const resultDuplicado = await pool.query(queryVerificarDuplicado, [descripcion.trim(), id_usuario, id_categoria]);

    if (resultDuplicado.rowCount > 0) {
      return res.status(409).json({
        error: 'Ya existe una categoría con esta descripción'
      });
    }

    // Actualizar la categoría
    const queryActualizar = `
      UPDATE categoria 
      SET descripcion = $1
      WHERE id_categoria = $2 AND id_usuario = $3
      RETURNING id_categoria, descripcion, id_usuario
    `;

    const result = await pool.query(queryActualizar, [
      descripcion.trim(),
      id_categoria,
      id_usuario
    ]);

    res.status(200).json({
      success: true,
      mensaje: 'Categoría actualizada exitosamente',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error al actualizar categoría:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
};

// Función para eliminar una categoría personalizada
const eliminarCategoriaPersonalizada = async (req, res) => {
  try {
    const { id_usuario, id_categoria } = req.params;

    // Validaciones básicas
    if (!id_usuario || isNaN(id_usuario)) {
      return res.status(400).json({
        error: 'ID de usuario inválido'
      });
    }

    if (!id_categoria || isNaN(id_categoria)) {
      return res.status(400).json({
        error: 'ID de categoría inválido'
      });
    }

    // Verificar que la categoría existe y pertenece al usuario
    const queryVerificarCategoria = `
      SELECT id_categoria, descripcion FROM categoria 
      WHERE id_categoria = $1 AND id_usuario = $2
    `;
    const resultCategoria = await pool.query(queryVerificarCategoria, [id_categoria, id_usuario]);

    if (resultCategoria.rowCount === 0) {
      return res.status(404).json({
        error: 'La categoría no existe o no pertenece a este usuario'
      });
    }

    // Verificar si la categoría está siendo utilizada
    const queryVerificarUso = `
      SELECT COUNT(*) as total FROM transferencia 
      WHERE id_categoria = $1
    `;
    const resultUso = await pool.query(queryVerificarUso, [id_categoria]);
    const totalTransferencias = parseInt(resultUso.rows[0].total);

    if (totalTransferencias > 0) {
      return res.status(409).json({
        error: `No se puede eliminar la categoría porque está siendo utilizada en ${totalTransferencias} transacción(es)`
      });
    }

    // Eliminar la categoría
    const queryEliminar = `
      DELETE FROM categoria 
      WHERE id_categoria = $1 AND id_usuario = $2
      RETURNING descripcion
    `;
    const result = await pool.query(queryEliminar, [id_categoria, id_usuario]);

    res.status(200).json({
      success: true,
      mensaje: `Categoría "${result.rows[0].descripcion}" eliminada exitosamente`
    });

  } catch (error) {
    console.error('Error al eliminar categoría:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
};
module.exports = {
  registrarTransferencia,
  registrarPagoTercero,
  registrarRecepcionDinero,
  obtenerTransferenciasUsuario,
  obtenerCategorias,
  crearCategoriaPersonalizada,
  obtenerCategoriasPersonalizadas,
  actualizarCategoriaPersonalizada,
  eliminarCategoriaPersonalizada
};