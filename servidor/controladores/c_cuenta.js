const pool = require('./conexion')
const dotenv = require('dotenv');
dotenv.config();

// ===============================
// FUNCIONES PRINCIPALES DE CUENTA
// ===============================

const crearCuenta = async (req, res) => {
  const { descripcion, numero, nota, saldo, id_banco, id_tipo_cuenta, id_color, id_usuario } = req.body;
  
  try {
    const queryValidarUsuario = ` 
         INSERT INTO cuenta(descripcion,numero,saldo,nota,id_banco,id_tipo_cuenta,id_color,id_usuario) 
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         RETURNING id_cuenta
    `;

    const parametros = [
        descripcion, numero, saldo,
        nota, id_banco, id_tipo_cuenta,
        id_color, id_usuario
    ]

    const resultadoq = await pool.query(queryValidarUsuario, parametros);

    if (resultadoq.rowCount > 0) {
        return res.status(201).json({
          mensaje: 'Cuenta creada con éxito', 
          id_cuenta: resultadoq.rows[0].id_cuenta
        })
    } else {
        console.error('Error al crear cuenta - No se insertó ninguna fila');
        res.status(500).json({ error: 'Error al crear cuenta' });
    }

  } catch (error) {
    console.error('Error al crear cuenta', error);
    res.status(500).json({ error: 'Error al crear cuenta' });
  }
};

const consultarCuentas = async (req, res) => {
  const { id_usuario } = req.params;
  console.log('hola')
  try {
    const query = `
      SELECT 
        c.id_cuenta,
        c.descripcion,
        c.numero,
        c.saldo,
        c.nota,
        c.positivo,
        b.descripcion AS nombre_banco,
        tc.descripcion AS tipo_cuenta,
        col.descripcion AS color,
        col.codigo_hex,
        u.nombre AS usuario
      FROM cuenta c
      INNER JOIN banco b ON c.id_banco = b.id_banco
      INNER JOIN tipo_cuenta tc ON c.id_tipo_cuenta = tc.id_tipo_cuenta
      INNER JOIN color col ON c.id_color = col.id_color
      INNER JOIN usuario u ON c.id_usuario = u.id_usuario
      WHERE c.id_usuario = $1
      ORDER BY c.descripcion ASC
    `;

    const parametros = [id_usuario];
    
    const resultado = await pool.query(query, parametros);

    if (resultado.rowCount > 0) {
      return res.status(200).json({
        mensaje: 'Cuentas consultadas con éxito',
        cuentas: resultado.rows
      });
    } else {
      return res.status(404).json({
        mensaje: 'No se encontraron cuentas para este usuario'
      });
    }

  } catch (error) {
    console.error('Error al consultar cuentas:', error);
    res.status(500).json({ error: 'Error al consultar cuentas' });
  }
};

const consultarTodasLasCuentas = async (req, res) => {
  try {
    const query = `
      SELECT 
        c.id_cuenta,
        c.descripcion,
        c.numero,
        c.saldo,
        c.nota,
        c.positivo,
        b.descripcion AS nombre_banco,
        tc.descripcion AS tipo_cuenta,
        col.descripcion AS color,
        col.codigo_hex,
        u.nombre AS usuario
      FROM cuenta c
      INNER JOIN banco b ON c.id_banco = b.id_banco
      INNER JOIN tipo_cuenta tc ON c.id_tipo_cuenta = tc.id_tipo_cuenta
      INNER JOIN color col ON c.id_color = col.id_color
      INNER JOIN usuario u ON c.id_usuario = u.id_usuario
      ORDER BY c.descripcion ASC
    `;
    
    const resultado = await pool.query(query);

    if (resultado.rowCount > 0) {
      return res.status(200).json({
        mensaje: 'Todas las cuentas consultadas con éxito',
        cuentas: resultado.rows
      });
    } else {
      return res.status(404).json({
        mensaje: 'No se encontraron cuentas'
      });
    }

  } catch (error) {
    console.error('Error al consultar todas las cuentas:', error);
    res.status(500).json({ error: 'Error al consultar todas las cuentas' });
  }
};

const consultarCuentaPorId = async (req, res) => {
  const { id_cuenta } = req.params;
  
  try {
    const query = `
      SELECT 
        c.id_cuenta,
        c.descripcion,
        c.numero,
        c.saldo,
        c.nota,
        c.positivo,
        c.id_banco,
        c.id_tipo_cuenta,
        c.id_color,
        c.id_usuario,
        b.descripcion AS nombre_banco,
        tc.descripcion AS tipo_cuenta,
        col.descripcion AS color,
        col.codigo_hex,
        u.nombre AS usuario
      FROM cuenta c
      INNER JOIN banco b ON c.id_banco = b.id_banco
      INNER JOIN tipo_cuenta tc ON c.id_tipo_cuenta = tc.id_tipo_cuenta
      INNER JOIN color col ON c.id_color = col.id_color
      INNER JOIN usuario u ON c.id_usuario = u.id_usuario
      WHERE c.id_cuenta = $1
    `;

    const parametros = [id_cuenta];
    
    const resultado = await pool.query(query, parametros);

    if (resultado.rowCount > 0) {
      return res.status(200).json({
        mensaje: 'Cuenta encontrada',
        cuenta: resultado.rows[0]
      });
    } else {
      return res.status(404).json({
        mensaje: 'Cuenta no encontrada'
      });
    }

  } catch (error) {
    console.error('Error al consultar cuenta por ID:', error);
    res.status(500).json({ error: 'Error al consultar cuenta' });
  }
};

const actualizarCuenta = async (req, res) => {
  const { id_cuenta } = req.params;
  const { descripcion, numero, saldo, nota, id_banco, id_tipo_cuenta, id_color } = req.body;
  
  try {
    const query = `
      UPDATE cuenta 
      SET descripcion = $1, numero = $2, saldo = $3, nota = $4, 
          id_banco = $5, id_tipo_cuenta = $6, id_color = $7
      WHERE id_cuenta = $8
      RETURNING id_cuenta
    `;

    const parametros = [
      descripcion, numero, saldo, nota,
      id_banco, id_tipo_cuenta, id_color, id_cuenta
    ];
    
    const resultado = await pool.query(query, parametros);

    if (resultado.rowCount > 0) {
      return res.status(200).json({
        mensaje: 'Cuenta actualizada con éxito',
        id_cuenta: resultado.rows[0].id_cuenta
      });
    } else {
      return res.status(404).json({
        mensaje: 'Cuenta no encontrada'
      });
    }

  } catch (error) {
    console.error('Error al actualizar cuenta:', error);
    res.status(500).json({ error: 'Error al actualizar cuenta' });
  }
};

const eliminarCuenta = async (req, res) => {
  const { id_cuenta } = req.params;
  
  try {
    const query = `
      DELETE FROM cuenta 
      WHERE id_cuenta = $1
      RETURNING id_cuenta
    `;

    const parametros = [id_cuenta];
    
    const resultado = await pool.query(query, parametros);

    if (resultado.rowCount > 0) {
      return res.status(200).json({
        mensaje: 'Cuenta eliminada con éxito',
        id_cuenta: resultado.rows[0].id_cuenta
      });
    } else {
      return res.status(404).json({
        mensaje: 'Cuenta no encontrada'
      });
    }

  } catch (error) {
    console.error('Error al eliminar cuenta:', error);
    res.status(500).json({ error: 'Error al eliminar cuenta' });
  }
};

// ===============================
// FUNCIONES AUXILIARES
// ===============================

const consultarBancos = async (req, res) => {
  try {
    const query = `
      SELECT 
        id_banco,
        descripcion
      FROM banco
      ORDER BY descripcion ASC
    `;
    
    const resultado = await pool.query(query);

    if (resultado.rowCount > 0) {
      return res.status(200).json({
        mensaje: 'Bancos consultados con éxito',
        bancos: resultado.rows
      });
    } else {
      return res.status(404).json({
        mensaje: 'No se encontraron bancos'
      });
    }

  } catch (error) {
    console.error('Error al consultar bancos:', error);
    res.status(500).json({ error: 'Error al consultar bancos' });
  }
};

const consultarTiposCuenta = async (req, res) => {
  try {
    const query = `
      SELECT 
        id_tipo_cuenta,
        descripcion
      FROM tipo_cuenta
      ORDER BY descripcion ASC
    `;
    
    const resultado = await pool.query(query);

    if (resultado.rowCount > 0) {
      return res.status(200).json({
        mensaje: 'Tipos de cuenta consultados con éxito',
        tipos: resultado.rows
      });
    } else {
      return res.status(404).json({
        mensaje: 'No se encontraron tipos de cuenta'
      });
    }

  } catch (error) {
    console.error('Error al consultar tipos de cuenta:', error);
    res.status(500).json({ error: 'Error al consultar tipos de cuenta' });
  }
};

const consultarColores = async (req, res) => {
  try {
    const query = `
      SELECT 
        id_color,
        descripcion,
        codigo_hex
      FROM color
      ORDER BY descripcion ASC
    `;
    
    const resultado = await pool.query(query);

    if (resultado.rowCount > 0) {
      return res.status(200).json({
        mensaje: 'Colores consultados con éxito',
        colores: resultado.rows
      });
    } else {
      return res.status(404).json({
        mensaje: 'No se encontraron colores'
      });
    }

  } catch (error) {
    console.error('Error al consultar colores:', error);
    res.status(500).json({ error: 'Error al consultar colores' });
  }
};

// ===============================
// FUNCIONES ADICIONALES ÚTILES
// ===============================

const consultarResumenCuentas = async (req, res) => {
  const { id_usuario } = req.params;
  
  try {
    const query = `
      SELECT 
        COUNT(*) as total_cuentas,
        COALESCE(SUM(c.saldo), 0) as saldo_total,
        COALESCE(SUM(CASE WHEN c.saldo > 0 THEN c.saldo ELSE 0 END), 0) as activos_totales,
        COALESCE(SUM(CASE WHEN c.saldo < 0 THEN ABS(c.saldo) ELSE 0 END), 0) as deudas_totales,
        COUNT(CASE WHEN tc.descripcion LIKE '%Crédito%' THEN 1 END) as cuentas_credito,
        COUNT(CASE WHEN tc.descripcion NOT LIKE '%Crédito%' THEN 1 END) as cuentas_regulares
      FROM cuenta c
      INNER JOIN tipo_cuenta tc ON c.id_tipo_cuenta = tc.id_tipo_cuenta
      WHERE c.id_usuario = $1 AND c.positivo = true
    `;

    const parametros = [id_usuario];
    
    const resultado = await pool.query(query, parametros);

    return res.status(200).json({
      mensaje: 'Resumen de cuentas consultado con éxito',
      resumen: resultado.rows[0]
    });

  } catch (error) {
    console.error('Error al consultar resumen de cuentas:', error);
    res.status(500).json({ error: 'Error al consultar resumen de cuentas' });
  }
};

const consultarCuentasPorTipo = async (req, res) => {
  const { id_usuario } = req.params;
  
  try {
    const query = `
      SELECT 
        tc.descripcion as tipo_cuenta,
        COUNT(*) as cantidad,
        COALESCE(SUM(c.saldo), 0) as saldo_total
      FROM cuenta c
      INNER JOIN tipo_cuenta tc ON c.id_tipo_cuenta = tc.id_tipo_cuenta
      WHERE c.id_usuario = $1 AND c.positivo = true
      GROUP BY tc.id_tipo_cuenta, tc.descripcion
      ORDER BY saldo_total DESC
    `;

    const parametros = [id_usuario];
    
    const resultado = await pool.query(query, parametros);

    if (resultado.rowCount > 0) {
      return res.status(200).json({
        mensaje: 'Cuentas por tipo consultadas con éxito',
        tipos: resultado.rows
      });
    } else {
      return res.status(404).json({
        mensaje: 'No se encontraron cuentas para este usuario'
      });
    }

  } catch (error) {
    console.error('Error al consultar cuentas por tipo:', error);
    res.status(500).json({ error: 'Error al consultar cuentas por tipo' });
  }
};

const cambiarEstadoCuenta = async (req, res) => {
  const { id_cuenta } = req.params;
  const { positivo } = req.body;
  
  try {
    const query = `
      UPDATE cuenta 
      SET positivo = $1
      WHERE id_cuenta = $2
      RETURNING id_cuenta, positivo
    `;

    const parametros = [positivo, id_cuenta];
    
    const resultado = await pool.query(query, parametros);

    if (resultado.rowCount > 0) {
      return res.status(200).json({
        mensaje: `Cuenta ${positivo ? 'activada' : 'desactivada'} con éxito`,
        cuenta: resultado.rows[0]
      });
    } else {
      return res.status(404).json({
        mensaje: 'Cuenta no encontrada'
      });
    }

  } catch (error) {
    console.error('Error al cambiar estado de cuenta:', error);
    res.status(500).json({ error: 'Error al cambiar estado de cuenta' });
  }
};

// ===============================
// EXPORTACIONES
// ===============================

module.exports = {
  // Funciones principales
  crearCuenta,
  consultarCuentas,
  consultarTodasLasCuentas,
  consultarCuentaPorId,
  actualizarCuenta,
  eliminarCuenta,
  
  // Funciones auxiliares
  consultarBancos,
  consultarTiposCuenta,
  consultarColores,
  
  // Funciones adicionales
  consultarResumenCuentas,
  consultarCuentasPorTipo,
  cambiarEstadoCuenta
};