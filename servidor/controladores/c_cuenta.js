const pool = require('./conexion')
const dotenv = require('dotenv');
dotenv.config();


const crearCuenta = async (req, res) => {
  
  const { descripcion,numero,nota,saldo,id_banco,id_tipo_cuenta,id_color,id_usuario } = req.body;
  
  // console.log(clave)

  try {
    const queryValidarUsuario = ` 
         INSERT INTO cuenta(descripcion,numero,saldo,nota,id_banco,id_tipo_cuenta,id_color,id_usuario) 
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         RETURNING id_cuenta
    `;

    const parametros = [
        descripcion,numero,saldo,
        nota,id_banco,id_tipo_cuenta,
        id_color,id_usuario
    ]

    
    const resultadoq = await pool.query(queryValidarUsuario, parametros);

    if (resultadoq.rowCount > 0) {
        return res.status(201).json({mensaje: 'Cuenta creada con éxito', id_cuenta: resultadoq.rows[0].id_cuenta})
    }else{
          console.error('Error al crear cuenta', error);
    res.status(500).json({ error: 'Error al crear cuenta' });
    }
    // const { id_usuario, nombre } = resultValidarUsuario.rows[0];

 
 

  } catch (error) {
    console.error('Error al crear cuenta', error);
    res.status(500).json({ error: 'Error al crear cuenta' });
  }
};


module.exports = {
    crearCuenta
}