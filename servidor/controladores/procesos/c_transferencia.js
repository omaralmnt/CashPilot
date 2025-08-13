const pool = require('../conexion');

const registrarTransferencia = async (req, res) => {
  const { datosTransferencia } = req.body;
  
  // Extraer los datos necesarios del objeto datosTransferencia
  const { monto, concepto, id_cuenta_origen, id_cuenta_destino, id_usuario } = datosTransferencia;

  // Validar campos obligatorios
  if (!monto || !id_cuenta_origen || !id_cuenta_destino || !id_usuario) {
    return res.status(400).json({ 
      error: 'Faltan campos obligatorios: monto, id_cuenta_origen, id_cuenta_destino, id_usuario' 
    });
  }

  // Validar que las cuentas origen y destino no sean la misma
  if (id_cuenta_origen === id_cuenta_destino) {
    return res.status(400).json({ 
      error: 'La cuenta origen y destino no pueden ser la misma' 
    });
  }

  // Validar que el monto sea positivo
  if (monto <= 0) {
    return res.status(400).json({ 
      error: 'El monto debe ser mayor a 0' 
    });
  }

  try {
    // Verificar que las cuentas existan
    const queryVerificarCuentas = `
      SELECT id_cuenta FROM cuenta WHERE id_cuenta IN ($1, $2)
    `;
    const resultCuentas = await pool.query(queryVerificarCuentas, [id_cuenta_origen, id_cuenta_destino]);

    if (resultCuentas.rowCount !== 2) {
      return res.status(404).json({ 
        error: 'Una o ambas cuentas no existen' 
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

    // Verificar saldo suficiente en cuenta origen (opcional, dependiendo de tu lógica de negocio)
    const queryVerificarSaldo = `
      SELECT saldo FROM cuenta WHERE id_cuenta = $1
    `;
    const resultSaldo = await pool.query(queryVerificarSaldo, [id_cuenta_origen]);

    if (resultSaldo.rows[0].saldo < monto) {
      return res.status(400).json({ 
        error: 'Saldo insuficiente en la cuenta origen' 
      });
    }

    // Iniciar transacción para mantener consistencia
    await pool.query('BEGIN');

    try {
      // Insertar la nueva transferencia
      const queryInsertar = `
        INSERT INTO transferencia (monto, concepto, id_cuenta_origen, id_cuenta_destino, id_usuario)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id_transferencia, monto, fecha_hora, concepto, id_cuenta_origen, id_cuenta_destino, id_usuario
      `;

      const result = await pool.query(queryInsertar, [
        monto, 
        concepto || null, // Si no hay concepto, insertar null
        id_cuenta_origen, 
        id_cuenta_destino, 
        id_usuario
      ]);

      // Actualizar saldos de las cuentas
      // Restar monto de cuenta origen
      await pool.query(
        'UPDATE cuenta SET saldo = saldo - $1 WHERE id_cuenta = $2',
        [monto, id_cuenta_origen]
      );

      // Sumar monto a cuenta destino
      await pool.query(
        'UPDATE cuenta SET saldo = saldo + $1 WHERE id_cuenta = $2',
        [monto, id_cuenta_destino]
      );

      // Confirmar transacción
      await pool.query('COMMIT');

      const transferencia = result.rows[0];

      res.status(201).json({
        mensaje: 'Transferencia registrada exitosamente',
        transferencia: {
          id_transferencia: transferencia.id_transferencia,
          monto: transferencia.monto,
          fecha_hora: transferencia.fecha_hora,
          concepto: transferencia.concepto,
          id_cuenta_origen: transferencia.id_cuenta_origen,
          id_cuenta_destino: transferencia.id_cuenta_destino,
          id_usuario: transferencia.id_usuario
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


const obtenerTransferencias = async (req,res) =>{
  try {
     console.log(hola)
  } catch (error) {
    req.status(500).json({mensaje:'unknown error'})
  }
}
module.exports = {
  registrarTransferencia,
  obtenerTransferencias
};